const Flashcard = require('../models/Flashcard');
const aiService = require('./aiService');
const { validateFlashcardsShape } = require('./aiValidation');

const SYSTEM_PROMPT =
  'You create high-quality study flashcards for college students. Extract the most important concepts into question/answer pairs. Answers must be accurate to the source material, concise (max 60 words), and self-contained. The "front" (question) should test understanding, not trivial recall. Never invent facts not present in the source.';

async function generateFlashcards({ sourceText, count = 10, hasPages }) {
  const target = Math.min(Math.max(count, 5), 20);
  const payload = await aiService.completeJson({
    system: SYSTEM_PROMPT,
    user: `<source>\n${sourceText}\n</source>\n\nGenerate exactly ${target} flashcards from this material. Return JSON: { "flashcards": [ { "question": "...", "answer": "..." } ] }${
      hasPages ? '. Note: page markers (=== PAGE n ===) may appear in the text; they are formatting, not content.' : ''
    }`,
    temperature: 0.4,
    maxTokens: 4000,
    validate: (parsed) => validateFlashcardsShape(parsed),
  });
  return payload;
}

async function saveFlashcards({ userId, documentId, summaryId, deckName, cards }) {
  const saved = Flashcard.insertMany(
    cards.map((c) => ({
      userId,
      documentId: documentId || null,
      summaryId: summaryId || null,
      deckName: deckName || 'Untitled deck',
      question: c.question,
      answer: c.answer,
      difficulty: 'medium',
    }))
  );
  return saved;
}

module.exports = { generateFlashcards, saveFlashcards };
