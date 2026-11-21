const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    page: { type: Number, default: null },
    section: { type: String, default: null },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    originalFileName: { type: String, required: true },
    fileType: { type: String, required: true, enum: ['PDF', 'DOCX', 'PPTX', 'TXT'] },
    fileSize: { type: Number, required: true },
    storagePath: { type: String, required: true },
    extractedText: { type: String, default: '' },
    hasExtractedText: { type: Boolean, default: false },
    chunks: { type: [chunkSchema], default: [] },
    pageCount: { type: Number, default: null },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'failed'],
      default: 'uploaded',
    },
    processingError: { type: String, default: '' },
    subject: { type: String, default: 'General' },
    tags: { type: [String], default: [] },
    folder: { type: String, default: '' },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, subject: 1 });
documentSchema.index({ userId: 1, title: 'text' });

module.exports = mongoose.model('Document', documentSchema);
