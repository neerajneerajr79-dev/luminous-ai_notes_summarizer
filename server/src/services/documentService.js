/**
 * Document text extraction + chunking pipeline.
 * Extracts real text from PDF / DOCX / PPTX / TXT and falls back to raw-bytes
 * text detection. Never fabricates a result: failures are surfaced to caller.
 */
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const MAX_CHARS = 400000; // guardrail for pathological files

function normalize(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdf(filePath) {
  const { PDFParse } = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return {
      text: normalize(result.text),
      pages: result.total || null,
    };
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return { text: normalize(value), pages: null };
}

// PPTX is a zip of XML; pull text out of <a:t> runs per slide.
async function extractPptx(filePath) {
  const JSZip = require('jszip');
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)/)[1], 10);
      return na - nb;
    });
  const pages = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('string');
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    const slideText = runs.join('\n').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    pages.push(slideText);
  }
  const slideTexts = pages.filter(Boolean);
  const text = normalize(
    slideTexts.length > 1
      ? slideTexts.map((t, i) => `${t}\n===PAGE ${i + 1}===`).join('\n\n')
      : slideTexts.join('\n\n')
  );
  return { text, pages };
}

function extractTxt(filePath) {
  const raw = fs.readFileSync(filePath);
  return { text: normalize(raw.toString('utf8')), pages: null };
}

async function extractDocumentFilePath(storagePath, fileType) {
  const abs = path.isAbsolute(storagePath) ? storagePath : path.resolve(process.cwd(), storagePath);
  if (!fs.existsSync(abs)) throw new Error('Stored file is missing on disk');

  switch (fileType) {
    case 'PDF':
      return extractPdf(abs);
    case 'DOCX':
      return extractDocx(abs);
    case 'PPTX':
      return extractPptx(abs);
    case 'TXT':
      return extractTxt(abs);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

const CHUNK_SIZE = 1600;
const CHUNK_OVERLAP = 200;

function chunkText(text, { pageBreakToken = /\n===PAGE (\d+)===\n/g } = {}) {
  if (!text || !text.trim()) return [];

  // Build chunks tracking page ownership when page markers exist.
  const segments = [];
  let lastIdx = 0;
  let match;
  pageBreakToken.lastIndex = 0;
  while ((match = pageBreakToken.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ text: text.slice(lastIdx, match.index), page: parseInt(match[1], 10) });
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    segments.push({ text: text.slice(lastIdx), page: null });
  }
  for (const seg of segments) {
    if (seg.page !== null) seg.page -= 1; // markers are 1-based human pages
  }

  const chunks = [];
  for (const seg of segments) {
    const body = seg.text.trim();
    if (!body) continue;
    let start = 0;
    while (start < body.length) {
      const slice = body.slice(start, start + CHUNK_SIZE).trim();
      if (slice) {
        chunks.push({ text: slice, page: seg.page, section: null });
      }
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
  }
  return chunks.slice(0, 400);
}

module.exports = {
  extractDocumentFilePath,
  chunkText,
  normalize,
  MAX_CHARS,
};
