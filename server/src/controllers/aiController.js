const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const StudySession = require('../models/StudySession');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const aiService = require('../services/aiService');
const { retrieveRelevantChunks } = require('../services/retrievalService');

const CHAT_SYSTEM_PROMPT =
  'You are Lumio, a study assistant. Answer the student\'s question using ONLY the provided material excerpts when they are relevant. Always ground your answer in the excerpts. When you reference information, mention the source page if available, for example (page 3). If the excerpts do not contain enough information to answer, say so clearly ("I could not find that in the provided material") and offer what you can. Keep answers structured with markdown, concise and educational.';

// POST /api/ai/chat { message, documentId?, conversationId? }
const chat = asyncHandler(async (req, res) => {
  const { message, documentId, conversationId } = req.body || {};
  if (!message?.trim()) throw ApiError.badRequest('A message is required');

  let conversation = null;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
    if (!conversation) throw ApiError.notFound('Conversation not found');
  } else {
    conversation = await Conversation.create({
      userId: req.user._id,
      documentId: documentId || null,
      title: message.trim().slice(0, 60),
      messages: [],
    });
  }

  let sources = [];
  let retrievalBlock = '';

  if (documentId) {
    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (document && document.chunks?.length > 0) {
      const relevant = retrieveRelevantChunks(document.chunks, message, 5);
      sources = relevant.map(({ page, section, score }) => ({ page, section, score }));
      if (relevant.length > 0) {
        retrievalBlock = relevant
          .map(
            (c, i) =>
              `[${i + 1}] (page ${c.page !== null ? c.page : 'unknown'}):\n${c.text.slice(0, 2000)}`
          )
          .join('\n\n---\n\n');
      }
    }
  }

  // Keep recent history for context, capped to avoid token blowups.
  const history = conversation.messages
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  const userContent =
    retrievalBlock
      ? `Material excerpts from the student's document:\n${retrievalBlock}\n\nStudent question: ${message.trim()}`
      : message.trim();

  const answer = await aiService.completeText({
    system: CHAT_SYSTEM_PROMPT,
    user: [...history, { role: 'user', content: userContent }],
    temperature: 0.4,
    maxTokens: 2000,
  });

  // Sanitize sources: only meaningful pages/sections, deduplicated.
  const cleanSources = [
    ...new Map(
      sources
        .filter((s) => (s.page !== null && s.page !== undefined) || s.section)
        .map((s) => [`${s.page}-${s.section || ''}`, { page: s.page ?? null, section: s.section || null }])
    ).values(),
  ].slice(0, 8);

  conversation.messages.push({ role: 'user', content: message.trim() });
  conversation.messages.push({ role: 'assistant', content: answer, sources: cleanSources });
  if (conversation.messages.length >= 2 && conversation.title === 'New conversation') {
    conversation.title = message.trim().slice(0, 60);
  }
  await conversation.save();

  await StudySession.create({
    userId: req.user._id,
    documentId: documentId || null,
    activityType: 'chat',
    description: `Asked: "${message.trim().slice(0, 80)}"`,
  });

  ok(res, { conversationId: conversation._id, answer, sources: cleanSources });
});

// GET /api/ai/conversations
const listConversations = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  if (req.query.documentId) query.documentId = req.query.documentId;
  const conversations = await Conversation.find(query)
    .sort({ updatedAt: -1 })
    .select('-messages')
    .lean();
  ok(res, { conversations });
});

// GET /api/ai/conversations/:id
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conversation) throw ApiError.notFound('Conversation not found');
  ok(res, { conversation });
});

// DELETE /api/ai/conversations/:id
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');
  ok(res, { message: 'Conversation deleted' });
});

module.exports = { chat, listConversations, getConversation, deleteConversation };
