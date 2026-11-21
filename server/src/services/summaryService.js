const Summary = require('../models/Summary');
const StudySession = require('../models/StudySession');
const aiService = require('./aiService');
const { validateSummaryShape } = require('./aiValidation');
const { SUMMARY_TYPES } = require('../config/constants');

const SYSTEM_PROMPT =
  'You are Lumio, an expert academic study assistant for college students. Follow the requested output format exactly, use clear markdown structure with headings, subheadings and bullet points. Be accurate to the provided source material and never invent facts that are not present. If the material appears unrelated or comes in unreadable characters, say so in the summary.';

const TYPE_PROMPTS = {
  quick: {
    label: 'Quick Summary',
    instruction:
      'Produce a concise overview of the entire document: an intro paragraph, "## Main Ideas" with markdown bullet points and "## Important Takeaways" bullets. Keep total length under 400 words.',
  },
  detailed: {
    label: 'Detailed Summary',
    instruction:
      'Produce a detailed topic-by-topic explanation: an intro, then one "## <Topic>" section per major topic (max 8 topics), each with "### Key Concepts" and "### Supporting Details" bullets, and a final "## Definitions" section (term: definition).',
  },
  exam: {
    label: 'Exam Preparation Notes',
    instruction:
      'Produce exam-focused revision notes with sections: "## Important Exam Topics", "## Likely Short-Answer Questions", "## Important Long-Answer / Essay Topics", "## Definitions", "## Formulas" (if any), "## Key Points for Revision" (top 10 bullets).',
  },
  simple: {
    label: 'Simple Explanation',
    instruction:
      'Explain the complicated material in beginner-friendly language, as if teaching a first-year student. Break it into small numbered sections with a simple analogy or example for each key idea. Avoid jargon; when unavoidable, define it inline. Use "## " headings per small section and bullet points.',
  },
  revision: {
    label: 'Last-Minute Revision',
    instruction:
      'Produce a highly condensed last-minute revision sheet: "## Must-Remember Points" (max 15 dense bullets), "## Definitions" (term: one-line definition), "## Formulas" (if any, rendered as text), "## One-Line Wrap-up". Total under 350 words.',
  },
};

function buildUserPrompt(type, sourceText, { hasPages }) {
  const meta = TYPE_PROMPTS[type];
  const pageHint = hasPages
    ? 'Some page markers (=== PAGE n ===) appear in the text; reference them only via structure, not in the content.'
    : '';
  return `${meta.label} request.\n${pageHint}\n\n<source>\n${sourceText}\n</source>\n\nTask: ${meta.instruction}\n\nAfter writing the markdown summary in "content", also fill these fields: keyPoints (5-10 one-line strings), concepts (topic strings), definitions (array of {term, definition}), formulas (array of strings, empty if none).\nReturn JSON with exactly these keys: content, keyPoints, concepts, definitions, formulas.`;
}

/**
 * Generates a summary. `sourceText` should already be the (possibly chunked,
 * truncated) text chosen by the caller.
 */
async function generateSummary({ type, sourceText, hasPages }) {
  const meta = TYPE_PROMPTS[type];
  if (!meta) throw new Error(`Unknown summary type: ${type}`);

  const data = await aiService.completeJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(type, sourceText, { hasPages }),
    temperature: 0.35,
    maxTokens: 6000,
    validate: (parsed) => validateSummaryShape(parsed),
  });

  return {
    summaryType: type,
    label: meta.label,
    ...data,
  };
}

async function saveSummary({ userId, documentId, title, fileName, ...generated }) {
  const summary = await Summary.create({
    userId,
    documentId: documentId || null,
    summaryType: generated.summaryType,
    title: title || generated.label,
    content: generated.content,
    keyPoints: generated.keyPoints,
    concepts: generated.concepts,
    definitions: generated.definitions,
    formulas: generated.formulas,
    fileName: fileName || '',
  });
  // Study session logging moved here so controllers stay thin.
  await StudySession.create({
    userId,
    documentId: documentId || null,
    activityType: 'summary',
    description: `${generated.label} generated${fileName ? ` for ${fileName}` : ''}`,
  });
  return summary;
}

module.exports = { generateSummary, saveSummary, SUMMARY_TYPES };
