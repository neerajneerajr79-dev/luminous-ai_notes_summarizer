const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const documentService = require('../services/documentService');
const { uploadDir } = require('../middleware/upload');

// POST /api/documents/upload
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file was uploaded');
  const { originalname, size, detectedType, path: storedPath } = req.file;

  const labelMap = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain': 'TXT',
  };
  if (!labelMap[detectedType]) {
    await fs.promises.unlink(storedPath).catch(() => {});
    throw ApiError.badRequest('Unsupported file format');
  }

  const title =
    (req.body?.title || '').trim() ||
    path.basename(originalname, path.extname(originalname)).slice(0, 200);

  const doc = await Document.create({
    userId: req.user._id,
    title,
    originalFileName: originalname,
    fileType: labelMap[detectedType],
    fileSize: size,
    storagePath: path.relative(process.cwd(), storedPath),
    processingStatus: 'processing',
    subject: (req.body?.subject || 'General').trim() || 'General',
  });

  // Extract synchronously; the client shows progress while we do real work.
  try {
    const { text, pages } = await documentService.extractDocumentFilePath(storedPath, doc.fileType);
    if (!text || text.trim().length === 0) {
      throw new Error(
        'No readable text could be extracted. The file may be a scanned image or password-protected.'
      );
    }
    doc.extractedText = text.slice(0, documentService.MAX_CHARS);
    doc.chunks = documentService.chunkText(doc.extractedText).map(({ text: t, page }) => ({ text: t, page }));
    doc.pageCount = Array.isArray(pages) ? pages.length : pages || null;
    doc.hasExtractedText = true;
    doc.processingStatus = 'ready';
    await doc.save();
  } catch (err) {
    doc.processingStatus = 'failed';
    doc.processingError = err.message || 'Text extraction failed';
    await doc.save();
    throw ApiError.badRequest(
      `The file was saved but text processing failed: ${doc.processingError}`
    );
  }

  ok(res, { document: doc }, 201);
});

// GET /api/documents  (search, subject, favorite, sort filters)
const listDocuments = asyncHandler(async (req, res) => {
  const { search, subject, favorite, folder, sort } = req.query;
  const query = { userId: req.user._id };
  if (subject && subject !== 'all') query.subject = subject;
  if (favorite === 'true') query.isFavorite = true;
  if (folder) query.folder = folder;
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: rx }, { tags: rx }, { originalFileName: rx }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { title: 1 },
    '-name': { title: -1 },
    modified: { updatedAt: -1 },
  };

  const documents = await Document.find(query)
    .sort(sortMap[sort] || sortMap.newest)
    .select('-extractedText -chunks')
    .lean();

  ok(res, { documents });
});

// GET /api/documents/:id - full workspace payload
const getDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) throw ApiError.notFound('Document not found');
  ok(res, { document: doc });
});

// PATCH /api/documents/:id  (rename, tags, subject, favorite, folder)
const updateDocument = asyncHandler(async (req, res) => {
  const allowed = ['title', 'subject', 'tags', 'folder', 'isFavorite'];
  const updates = {};
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.title !== undefined && !String(updates.title).trim()) {
    throw ApiError.badRequest('Title cannot be empty');
  }
  const doc = await Document.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-extractedText -chunks');
  if (!doc) throw ApiError.notFound('Document not found');
  ok(res, { document: doc });
});

// DELETE /api/documents/:id (removes file from disk and dependent data)
const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) throw ApiError.notFound('Document not found');

  const abs = path.resolve(process.cwd(), doc.storagePath);
  await fs.promises.unlink(abs).catch(() => {}); // file may already be gone
  await doc.deleteOne();

  ok(res, { message: 'Document deleted' });
});

module.exports = { uploadDocument, listDocuments, getDocument, updateDocument, deleteDocument, uploadDir };
