const mongoose = require('mongoose');

const reviewEntrySchema = new mongoose.Schema(
  {
    rating: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const flashcardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    summaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Summary', default: null },
    deckName: { type: String, default: 'Untitled deck' },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    nextReviewAt: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date, default: null },
    reviewHistory: { type: [reviewEntrySchema], default: [] },
    sourcePage: { type: Number, default: null },
  },
  { timestamps: true }
);

flashcardSchema.index({ userId: 1, deckName: 1 });
flashcardSchema.index({ userId: 1, nextReviewAt: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
