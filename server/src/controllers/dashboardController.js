const Document = require('../models/Document');
const Summary = require('../models/Summary');
const Flashcard = require('../models/Flashcard');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const StudySession = require('../models/StudySession');
const StudyTask = require('../models/StudyTask');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

// GET /api/dashboard/stats - real aggregates only, no hardcoded numbers.
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalNotes,
    summariesGenerated,
    flashcardsCreated,
    studySessionsCompleted,
    dueFlashcards,
    completedTasks,
    pendingTasks,
  ] = await Promise.all([
    Document.countDocuments({ userId }),
    Summary.countDocuments({ userId }),
    Flashcard.countDocuments({ userId }),
    StudySession.countDocuments({ userId }),
    Flashcard.countDocuments({ userId, nextReviewAt: { $lte: new Date() } }),
    StudyTask.countDocuments({ userId, completed: true }),
    StudyTask.countDocuments({ userId, completed: false }),
  ]);

  ok(res, {
    stats: {
      totalNotes,
      summariesGenerated,
      flashcardsCreated,
      studySessionsCompleted,
      dueFlashcards,
      tasks: { completed: completedTasks, pending: pendingTasks },
    },
  });
});

// GET /api/dashboard/activity - recent items + 7-day study series.
const getActivity = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [recentSummaries, recentQuizzes, recentSessions, recentNotes, dueSoon] = await Promise.all([
    Summary.find({ userId }).sort({ createdAt: -1 }).limit(5).select('title summaryType fileName createdAt').lean(),
    Quiz.find({ userId, status: 'ready' }).sort({ createdAt: -1 }).limit(5).select('title difficulty createdAt').lean(),
    StudySession.find({ userId }).sort({ createdAt: -1 }).limit(8).lean(),
    Document.find({ userId }).sort({ updatedAt: -1 }).limit(4).select('title subject updatedAt isFavorite').lean(),
    Flashcard.countDocuments({ userId, nextReviewAt: { $lte: new Date() } }),
  ]);

  // Build a 7-day daily series with per-activity counts.
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const sessions = await StudySession.find({ userId, createdAt: { $gte: since } })
    .select('activityType createdAt')
    .lean();

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(since);
    day.setDate(since.getDate() + (6 - i));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const daySessions = sessions.filter(
      (s) => new Date(s.createdAt) >= day && new Date(s.createdAt) < next
    );
    days.push({
      date: day.toISOString().slice(0, 10),
      summaries: daySessions.filter((s) => s.activityType === 'summary').length,
      flashcards: daySessions.filter((s) => s.activityType === 'flashcards').length,
      quizzes: daySessions.filter((s) => s.activityType === 'quiz').length,
      chats: daySessions.filter((s) => s.activityType === 'chat').length,
      total: daySessions.length,
    });
  }

  ok(res, {
    activity: {
      recentSummaries,
      recentQuizzes,
      recentSessions,
      recentNotes,
      dueFlashcards: dueSoon,
      weekly: days,
    },
  });
});

module.exports = { getStats, getActivity };
