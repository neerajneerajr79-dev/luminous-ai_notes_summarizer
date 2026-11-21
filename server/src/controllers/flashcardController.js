const Flashcard = require('../models/Flashcard');
const Summary = require('../models/Summary');
const Document = require('../models/Document');
const StudySession = require('../models/StudySession');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const flashcardService = require('../services/flashcardService');
const { prepareSource } = require('./summaryController');

// Spaced repetition: simple SM-2-lite. Ratings adjust the next review interval.
const REVIEW_INTERVALS_DAYS = { easy: 7, medium: 3, hard: 1 };

// POST /api/flashcards/generate { documentId, summaryId, rawText, count, deckName }
const generateFlashcards = asyncHandler(async (req, res) => {
  const { documentId, summaryId, rawText, count, deckName } = req.body || {};
  let source;
  let hasPages = false;

  if (documentId) {
    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) throw ApiError.notFound('Document not found');
    if (document.processingStatus !== 'ready') {
      throw ApiError.badRequest('This document has not finished processing');
    }
    source = prepareSource(document, 50000);
    hasPages = /\n===PAGE \d+===\n/.test(document.extractedText || '');
  } else if (summaryId) {
    const summary = await Summary.findOne({ _id: summaryId, userId: req.user._id });
    if (!summary) throw ApiError.notFound('Summary not found');
    source = summary.content.slice(0, 50000);
  } else if ((rawText || '').trim()) {
    source = String(rawText).slice(0, 50000);
  } else {
    throw ApiError.badRequest('Provide documentId, summaryId, or rawText to generate flashcards');
  }

  const cards = await flashcardService.generateFlashcards({ sourceText: source, count, hasPages });
  const saved = await flashcardService.saveFlashcards({
    userId: req.user._id,
    documentId: documentId || null,
    summaryId: summaryId || null,
    deckName: deckName || 'Untitled deck',
    cards,
  });

  await StudySession.create({
    userId: req.user._id,
    documentId: documentId || null,
    activityType: 'flashcards',
    description: `${saved.length} flashcards created${deckName ? ` in "${deckName}"` : ''}`,
  });

  ok(res, { flashcards: saved, created: saved.length }, 201);
});

// GET /api/flashcards?deck=&due=&difficulty=&documentId=
const listFlashcards = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  if (req.query.deck) query.deckName = req.query.deck;
  if (req.query.difficulty) query.difficulty = req.query.difficulty;
  if (req.query.documentId) query.documentId = req.query.documentId;
  if (req.query.due === 'true') query.nextReviewAt = { $lte: new Date() };

  const flashcards = await Flashcard.find(query).sort({ createdAt: -1 }).lean();
  ok(res, { flashcards });
});

// PATCH /api/flashcards/:id (edit question/answer/deck)
const updateFlashcard = asyncHandler(async (req, res) => {
  const allowed = ['question', 'answer', 'deckName', 'difficulty'];
  const updates = {};
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) updates[key] = req.body[key];
  }
  const card = await Flashcard.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!card) throw ApiError.notFound('Flashcard not found');
  ok(res, { flashcard: card });
});

// DELETE /api/flashcards/:id
const deleteFlashcard = asyncHandler(async (req, res) => {
  const card = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!card) throw ApiError.notFound('Flashcard not found');
  ok(res, { message: 'Flashcard deleted' });
});

// POST /api/flashcards/:id/review { rating: easy|medium|hard }
const reviewFlashcard = asyncHandler(async (req, res) => {
  const { rating } = req.body || {};
  if (!['easy', 'medium', 'hard'].includes(rating)) {
    throw ApiError.badRequest('rating must be easy, medium, or hard');
  }
  const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
  if (!card) throw ApiError.notFound('Flashcard not found');

  const days = REVIEW_INTERVALS_DAYS[rating];
  const next = new Date();
  next.setDate(next.getDate() + days);

  card.difficulty = rating;
  card.lastReviewedAt = new Date();
  card.nextReviewAt = next;
  card.reviewHistory.push({ rating, reviewedAt: new Date() });
  await card.save();

  ok(res, { flashcard: card, nextReviewAt: next });
});

module.exports = { generateFlashcards, listFlashcards, updateFlashcard, deleteFlashcard, reviewFlashcard };
