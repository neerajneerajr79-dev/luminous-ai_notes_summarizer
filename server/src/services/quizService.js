const aiService = require('./aiService');
const { validateQuizShape } = require('./aiValidation');

const SYSTEM_PROMPT =
  'You are an expert exam-writer for college students. Write questions that are accurate to the source material, clearly worded, and educational. For every question include a short explanation of the correct answer and a topic tag. Never invent facts not present in the source material.';

const TYPE_LABELS = { mcq: 'multiple-choice', truefalse: 'true/false', short: 'short-answer' };

async function generateQuiz({ sourceText, count, difficulty, types, hasPages, subjectHint }) {
  const total = Math.min(Math.max(count, 3), 20);
  const validTypes = types.filter((t) => ['mcq', 'truefalse', 'short'].includes(t));
  const chosenTypes = validTypes.length > 0 ? validTypes : ['mcq'];
  const typeList = chosenTypes.map((t) => TYPE_LABELS[t]).join(', ');

  // validateQuizShape returns the cleaned questions array directly.
  const questions = await aiService.completeJson({
    system: SYSTEM_PROMPT,
    user: `<source>\n${sourceText}\n</source>\n\nCreate exactly ${total} ${
      difficulty
    } difficulty exam practice questions of these types only: ${typeList}. ${
      subjectHint ? `The subject area is: ${subjectHint}.` : ''
    }${
      hasPages
        ? ' Page markers (=== PAGE n ===) appear in the text for reference only.'
        : ''
    }\n\nRules per type:\n- "mcq": provide "options" array with exactly 4 plausible choices, "correctAnswer" must EXACTLY match one option string.\n- "truefalse": correctAnswer is "True" or "False".\n- "short": correctAnswer is a model answer, max 60 words.\n\nReturn JSON: { "questions": [ { "type": "mcq"|"truefalse"|"short", "question": "...", "options": ["..."], "correctAnswer": "...", "explanation": "...", "topic": "..." } ] }`,
    temperature: 0.5,
    maxTokens: 6000,
    validate: (parsed) => validateQuizShape(parsed),
  });

  // Normalize: MCQ option list must contain the correct answer verbatim.
  questions.forEach((q) => {
    if (q.type === 'mcq') {
      let options = q.options.filter(Boolean).map(String);
      const matched = options.find((opt) => opt.toLowerCase() === q.correctAnswer.toLowerCase());
      if (matched) {
        q.correctAnswer = matched;
      } else if (options.length >= 2) {
        options = [...new Set([q.correctAnswer, ...options])].slice(0, 4);
      }
      // Deterministic alphabetical order avoids answer-position telltales.
      q.options = options.sort((a, b) => a.localeCompare(b));
    }
  });

  return { questions };
}

module.exports = { generateQuiz };
