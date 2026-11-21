/**
 * Lightweight keyword retrieval (TF-IDF style BM25-lite) over stored document
 * chunks. Chosen over a vector DB to keep the project dependency-light while
 * remaining genuinely useful for "find relevant text" style questions.
 */

const STOP_WORDS = new Set(
  ('a an and are as at be but by for from had has have he her his i if in into is it its of on or ' +
    'she that the their there they this to was were what when which who will with you your we our us')
    .split(' ')
);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

const kvCache = new Map(); // documentId -> { dfs, tf, N, avgLen }

function buildIndex(chunks) {
  const docs = chunks.map((c) => tokenize(c.text));
  const N = docs.length;
  const df = new Map();
  const tfs = docs.map((tokens) => {
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
    return tf;
  });
  const avgLen = docs.reduce((s, d) => s + d.length, 0) / Math.max(N, 1);
  return { N, df, tfs, avgLen };
}

const k1 = 1.3;
const b = 0.75;

function bm25Scores(index, queryTokens) {
  const scores = new Array(index.N).fill(0);
  for (const term of queryTokens) {
    const df = index.df.get(term) || 0;
    if (!df) continue;
    const idf = Math.log(1 + (index.N - df + 0.5) / (df + 0.5));
    for (let i = 0; i < index.N; i++) {
      const tf = index.tfs[i].get(term) || 0;
      if (!tf) continue;
      const len = index.tfs[i].size;
      scores[i] += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (len / index.avgLen))));
    }
  }
  return scores;
}

/**
 * Returns the top chunks relevant to the question.
 * @param {Array<{text,page,section}>} chunks
 * @param {string} question
 * @param {number} topK
 */
function retrieveRelevantChunks(chunks, question, topK = 5) {
  if (!chunks || chunks.length === 0) return [];
  // Normalize to plain objects first: Mongoose subdocuments keep their data
  // internally, so spreading them directly would lose text/page/section.
  const plain = chunks.map((c) => {
    if (typeof c.toObject === 'function') {
      const o = c.toObject();
      return { text: o.text, page: o.page ?? null, section: o.section ?? null };
    }
    return { text: c.text, page: c.page ?? null, section: c.section ?? null };
  });
  const index = buildIndex(plain);
  const queryTokens = tokenize(question).slice(0, 60);
  if (queryTokens.length === 0) {
    return plain.slice(0, topK).map(({ text, page, section }) => ({ text, page, section, score: 0 }));
  }
  const scores = bm25Scores(index, queryTokens);
  return plain
    .map((c, i) => ({ ...c, score: scores[i] }))
    .filter((c) => c.score > 0 && c.text)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, topK)
    .map(({ text, page, section, score }) => ({ text, page, section, score: Number(score.toFixed(2)) }));
}

module.exports = { retrieveRelevantChunks, tokenize, buildIndex, bm25Scores };
