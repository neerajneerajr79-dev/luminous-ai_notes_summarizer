/**
 * Shared validation helpers for structured AI output.
 * Every AI JSON response passes through these before anything is saved to MongoDB.
 */

function parseJsonResponse(raw, context = 'AI response') {
  if (typeof raw !== 'string') {
    if (raw && typeof raw === 'object') return raw;
    throw new Error(`${context} was empty`);
  }
  let text = raw.trim();
  // Strip markdown code fences the model may add despite instructions.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    // Trim to the outermost braces as a fallback.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new Error(`${context} was not valid JSON`);
  }
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateSummaryShape(parsed) {
  if (!parsed || typeof parsed !== 'object') throw new Error('Summary response must be an object');
  const { content } = parsed;
  if (!isNonEmptyString(content) || content.trim().split(/\s+/).length < 30) {
    throw new Error('Summary content was missing or too short');
  }
  return {
    content: content.trim(),
    keyPoints: Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.filter(isNonEmptyString).slice(0, 15)
      : [],
    concepts: Array.isArray(parsed.concepts)
      ? parsed.concepts.filter(isNonEmptyString).slice(0, 20)
      : [],
    definitions: Array.isArray(parsed.definitions)
      ? parsed.definitions
          .filter(
            (d) =>
              d && typeof d === 'object' && isNonEmptyString(d.term) && isNonEmptyString(d.definition)
          )
          .slice(0, 20)
      : [],
    formulas: Array.isArray(parsed.formulas)
      ? parsed.formulas.filter(isNonEmptyString).slice(0, 15)
      : [],
  };
}

function validateFlashcardsShape(parsed) {
  const cards = Array.isArray(parsed) ? parsed : parsed?.flashcards || parsed?.cards;
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('Flashcard response contained no cards');
  }
  const clean = cards
    .filter((c) => c && typeof c === 'object' && isNonEmptyString(c.question) && isNonEmptyString(c.answer))
    .slice(0, 40)
    .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }));
  if (clean.length === 0) throw new Error('No structurally valid flashcards were returned');
  return clean;
}

function validateQuizShape(parsed, expectedDifficulties) {
  const questions = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Quiz response contained no questions');
  }
  const types = new Set(['mcq', 'truefalse', 'short']);
  const clean = questions
    .filter(
      (q) =>
        q &&
        typeof q === 'object' &&
        isNonEmptyString(q.question) &&
        isNonEmptyString(q.correctAnswer) &&
        types.has(q.type)
    )
    .map((q) => ({
      type: q.type,
      question: q.question.trim(),
      correctAnswer: String(q.correctAnswer).trim(),
      options: Array.isArray(q.options)
        ? q.options.filter(isNonEmptyString).map(String).slice(0, 6)
        : [],
      explanation: isNonEmptyString(q.explanation) ? String(q.explanation).trim() : '',
      topic: isNonEmptyString(q.topic) ? String(q.topic).trim() : '',
    }))
    .map((q) => {
      if (q.type === 'truefalse') {
        const norm = q.correctAnswer.toLowerCase();
        q.correctAnswer = norm.startsWith('true') || norm.startsWith('t') ? 'True' : 'False';
        q.options = ['True', 'False'];
      }
      if (q.type === 'mcq' && q.options.length < 2) {
        throw new Error('An MCQ question was returned without at least two options');
      }
      if (expectedDifficulties) q.difficulty = expectedDifficulties;
      return q;
    });
  if (clean.length === 0) throw new Error('No structurally valid questions were returned');
  return clean;
}

module.exports = {
  parseJsonResponse,
  validateSummaryShape,
  validateFlashcardsShape,
  validateQuizShape,
};
