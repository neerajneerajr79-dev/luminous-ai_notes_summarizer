const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  { questionIndex: { type: Number, required: true }, given: { type: String, required: true } },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    questionResults: {
      type: [
        new mongoose.Schema(
          {
            questionIndex: Number,
            correct: Boolean,
            given: String,
            correctAnswer: String,
            explanation: String,
            topic: String,
            type: String,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    weakTopics: { type: [String], default: [] },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
