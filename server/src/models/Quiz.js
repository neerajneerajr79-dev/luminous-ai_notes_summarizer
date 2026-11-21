const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['mcq', 'truefalse', 'short'], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] }, // for mcq / truefalse
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: String, default: '' },
    sourcePage: { type: Number, default: null },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    title: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
    },
    failureReason: { type: String, default: '' },
    fileName: { type: String, default: '' },
  },
  { timestamps: true }
);

quizSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
