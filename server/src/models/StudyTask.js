const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, default: 'General' },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    linkedFlashcardIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

studyTaskSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('StudyTask', studyTaskSchema);
