const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    summaryType: {
      type: String,
      required: true,
      enum: ['quick', 'detailed', 'exam', 'simple', 'revision'],
    },
    title: { type: String, default: '' },
    content: { type: String, required: true }, // markdown
    keyPoints: { type: [String], default: [] },
    concepts: { type: [String], default: [] },
    definitions: {
      type: [{ term: String, definition: String }],
      default: [],
    },
    formulas: { type: [String], default: [] },
    fileName: { type: String, default: '' },
  },
  { timestamps: true }
);

summarySchema.index({ userId: 1, documentId: 1, createdAt: -1 });

module.exports = mongoose.model('Summary', summarySchema);
