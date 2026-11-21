const StudyTask = require('../models/StudyTask');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, subject, dueDate, notes } = req.body || {};
  if (!title?.trim()) throw ApiError.badRequest('Task title is required');
  const task = await StudyTask.create({
    userId: req.user._id,
    title: title.trim(),
    subject: (subject || 'General').trim() || 'General',
    dueDate: dueDate ? new Date(dueDate) : null,
    notes: notes || '',
  });
  ok(res, { task }, 201);
});

// GET /api/tasks?status=today|upcoming|completed
const listTasks = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  if (req.query.completed !== undefined) {
    query.completed = String(req.query.completed) === 'true';
  }
  const tasks = await StudyTask.find(query).sort({ dueDate: 1, createdAt: -1 }).lean();
  ok(res, { tasks });
});

// PATCH /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const allowed = ['title', 'subject', 'dueDate', 'completed', 'notes', 'linkedFlashcardIds'];
  const updates = {};
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.title !== undefined && !String(updates.title).trim()) {
    throw ApiError.badRequest('Task title cannot be empty');
  }
  if (updates.completed === true) updates.completedAt = new Date();
  if (updates.completed === false) updates.completedAt = null;

  const task = await StudyTask.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!task) throw ApiError.notFound('Task not found');
  ok(res, { task });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await StudyTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) throw ApiError.notFound('Task not found');
  ok(res, { message: 'Task deleted' });
});

module.exports = { createTask, listTasks, updateTask, deleteTask };
