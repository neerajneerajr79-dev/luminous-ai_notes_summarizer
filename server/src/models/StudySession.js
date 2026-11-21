const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    duration: { type: Number, default: 0 }, // seconds
    activityType: {
      type: String,
      enum: ['summary', 'flashcards', 'quiz', 'chat', 'reading'],
      required: true,
    },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

studySessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
