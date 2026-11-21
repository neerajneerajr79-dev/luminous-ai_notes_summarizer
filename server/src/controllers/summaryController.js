const Document = require('../models/Document');
const Summary = require('../models/Summary');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const summaryService = require('../services/summaryService');

// Truncate material for AI context: recent model windows are large but we cap
// for cost/latency. Chunks with markers keep approximate page attribution.
function prepareSource(document, maxChars = 60000) {
  let text = document.extractedText || '';
  if (!text) throw ApiError.badRequest('This document has no extracted text to summarize');
  if (text.length > maxChars) {
    // Front-load: most study material is front-loaded; keep head + tail sample.
    text = `${text.slice(0, maxChars * 0.85)}\n\n[... middle of document omitted for length ...]\n\n${text.slice(-Math.floor(maxChars * 0.15))}`;
  }
  return text;
}

// POST /api/summaries/generate { documentId?, rawText?, title?, summaryType }
const generateSummary = asyncHandler(async (req, res) => {
  const { documentId, rawText, title, summaryType } = req.body || {};

  if (!['quick', 'detailed', 'exam', 'simple', 'revision'].includes(summaryType)) {
    throw ApiError.badRequest('summaryType must be one of: quick, detailed, exam, simple, revision');
  }

  if (!documentId && !(rawText || '').trim()) {
    throw ApiError.badRequest('Provide either a documentId or raw text to summarize');
  }

  let document = null;
  let source;
  let fileName;
  if (documentId) {
    document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) throw ApiError.notFound('Document not found');
    if (document.processingStatus !== 'ready') {
      throw ApiError.badRequest('This document has not finished processing');
    }
    source = prepareSource(document);
    fileName = document.originalFileName;
  } else {
    source = String(rawText).slice(0, 60000);
    fileName = title || 'Pasted text';
  }

  const generated = await summaryService.generateSummary({
    type: summaryType,
    sourceText: source,
    hasPages: document ? /\n===PAGE \d+===\n/.test(document.extractedText || '') : false,
  });

  const summary = await summaryService.saveSummary({
    userId: req.user._id,
    documentId: document?._id || null,
    title: title || fileName,
    fileName,
    ...generated,
  });

  ok(res, { summary }, 201);
});

// GET /api/summaries?documentId=&summaryType=
const listSummaries = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  if (req.query.documentId) query.documentId = req.query.documentId;
  if (req.query.summaryType) query.summaryType = req.query.summaryType;
  const summaries = await Summary.find(query)
    .sort({ createdAt: -1 })
    .select('-content')
    .lean();
  ok(res, { summaries });
});

// GET /api/summaries/:id
const getSummary = asyncHandler(async (req, res) => {
  const summary = await Summary.findOne({ _id: req.params.id, userId: req.user._id });
  if (!summary) throw ApiError.notFound('Summary not found');
  ok(res, { summary });
});

// DELETE /api/summaries/:id
const deleteSummary = asyncHandler(async (req, res) => {
  const summary = await Summary.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!summary) throw ApiError.notFound('Summary not found');
  ok(res, { message: 'Summary deleted' });
});

module.exports = { generateSummary, listSummaries, getSummary, deleteSummary, prepareSource };
