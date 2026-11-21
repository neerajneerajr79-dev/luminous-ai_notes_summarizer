const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Document = require('../models/Document');
const StudySession = require('../models/StudySession');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const quizService = require('../services/quizService');
const { prepareSource } = require('./summaryController');
const { QUIZ_TYPES } = require('../config/constants');

// POST /api/quizzes/generate { documentId, rawText, title, count, difficulty, types }
const generateQuiz = asyncHandler(async (req, res) => {
  const { documentId, rawText, title, count, difficulty, types } = req.body || {};

  const difficultyLevel = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
  const questionCount = Math.min(Math.max(parseInt(count, 10) || 8, 3), 20);
  const questionTypes = Array.isArray(types)
    ? types.filter((t) => QUIZ_TYPES.includes(t))
    : ['mcq', 'truefalse', 'short'];

  if (!documentId && !(rawText || '').trim()) {
    throw ApiError.badRequest('Provide a documentId or raw text to generate a quiz');
  }

  let document = null;
  let source;
  let hasPages = false;
  if (documentId) {
    document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) throw ApiError.notFound('Document not found');
    if (document.processingStatus !== 'ready') {
      throw ApiError.badRequest('This document has not finished processing');
    }
    source = prepareSource(document, 50000);
    hasPages = /\n===PAGE \d+===\n/.test(document.extractedText || '');
  } else {
    source = String(rawText).slice(0, 50000);
  }

  const generated = await quizService.generateQuiz({
    sourceText: source,
    count: questionCount,
    difficulty: difficultyLevel,
    types: questionTypes,
    hasPages,
    subjectHint: document?.subject,
  });

  const quiz = await Quiz.create({
    userId: req.user._id,
    documentId: document?._id || null,
    title: title || document?.title || 'Practice quiz',
    questions: generated.questions,
    difficulty: difficultyLevel,
    status: 'ready',
    fileName: document?.originalFileName || '',
  });

  await StudySession.create({
    userId: req.user._id,
    documentId: document?._id || null,
    activityType: 'quiz',
    description: `Quiz generated with ${generated.questions.length} questions`,
  });

  ok(res, { quiz }, 201);
});

// GET /api/quizzes
const listQuizzes = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id, status: 'ready' };
  if (req.query.documentId) query.documentId = req.query.documentId;
  // Answers hidden in list view; fetched individually when attempting.
  const quizzes = await Quiz.find(query).sort({ createdAt: -1 }).select('-questions.correctAnswer -questions.explanation').lean();
  ok(res, { quizzes });
});

// GET /api/quizzes/:id - for taking the quiz (correct answers withheld)
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!quiz) throw ApiError.notFound('Quiz not found');
  // Strip anything that would reveal correctness before the attempt is submitted.
  quiz.questions = quiz.questions.map(({ correctAnswer, explanation, ...q }) => q);
  ok(res, { quiz });
});

// POST /api/quizzes/:id/submit { answers: [{ questionIndex, given }] }
const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    throw ApiError.badRequest('answers array is required');
  }
  const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const norm = (s) => String(s || '').trim().toLowerCase();
  const givenMap = new Map(
    answers.map((a) => [parseInt(a.questionIndex, 10), String(a.given || '')])
  );

  const questionResults = quiz.questions.map((q, i) => {
    const given = givenMap.has(i) ? givenMap.get(i) : '';
    let correct = false;
    switch (q.type) {
      case 'mcq':
      case 'truefalse':
        correct = norm(given) === norm(q.correctAnswer);
        break;
      case 'short': {
        // Keyword-overlap grading for short answers: >=50% overlap of content words.
        const keywords = norm(q.correctAnswer)
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length > 3);
        const unique = [...new Set(keywords)];
        const hit = unique.filter((w) => norm(given).includes(w)).length;
        correct = unique.length > 0 ? hit / unique.length >= 0.5 : norm(given).length > 0;
        break;
      }
      default:
        correct = false;
    }
    return {
      questionIndex: i,
      correct,
      given,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      topic: q.topic || '',
      type: q.type,
    };
  });

  const score = questionResults.filter((r) => r.correct).length;
  const percentage = Math.round((score / quiz.questions.length) * 100);

  const weakTopicMap = {};
  questionResults.filter((r) => !r.correct).forEach((r) => {
    const topic = r.topic || 'Uncategorized';
    weakTopicMap[topic] = (weakTopicMap[topic] || 0) + 1;
  });
  const weakTopics = Object.keys(weakTopicMap).sort((a, b) => weakTopicMap[b] - weakTopicMap[a]);

  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    quizId: quiz._id,
    answers: answers.map((a) => ({ questionIndex: parseInt(a.questionIndex, 10), given: String(a.given || '') })),
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    questionResults,
    weakTopics,
    completedAt: new Date(),
  });

  await StudySession.create({
    userId: req.user._id,
    documentId: quiz.documentId,
    activityType: 'quiz',
    description: `Quiz "${quiz.title}" attempted - ${score}/${quiz.questions.length}`,
  });

  ok(res, { attempt });
});

// GET /api/quizzes/:id/attempts
const listAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({
    userId: req.user._id,
    quizId: req.params.id,
  }).sort({ completedAt: -1 });
  ok(res, { attempts });
});

// DELETE /api/quizzes/:id
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!quiz) throw ApiError.notFound('Quiz not found');
  await QuizAttempt.deleteMany({ quizId: quiz._id, userId: req.user._id });
  ok(res, { message: 'Quiz deleted' });
});

module.exports = { generateQuiz, listQuizzes, getQuiz, submitQuiz, listAttempts, deleteQuiz };
