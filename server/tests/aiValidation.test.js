import { describe, it, expect } from 'vitest';
import {
  parseJsonResponse,
  validateSummaryShape,
  validateFlashcardsShape,
  validateQuizShape,
} from '../src/services/aiValidation.js';
import { retrieveRelevantChunks, tokenize } from '../src/services/retrievalService.js';

describe('parseJsonResponse', () => {
  it('parses plain JSON', () => {
    expect(parseJsonResponse('{"a":1}')).toEqual({ a: 1 });
  });
  it('parses JSON wrapped in markdown fences', () => {
    expect(parseJsonResponse('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('parses JSON with surrounding chatter', () => {
    expect(parseJsonResponse('Sure! Here it is:\n{"a": 2}\nHope that helps.')).toEqual({ a: 2 });
  });
  it('throws on garbage', () => {
    expect(() => parseJsonResponse('not json at all')).toThrow();
  });
});

describe('validateSummaryShape', () => {
  it('accepts a well-formed summary', () => {
    const parsed = {
      content: '## Overview\n' + 'word '.repeat(60),
      keyPoints: ['a', 'b'],
      concepts: ['c'],
      definitions: [{ term: 't', definition: 'd' }],
      formulas: ['E=mc2'],
    };
    const clean = validateSummaryShape(parsed);
    expect(clean.keyPoints).toEqual(['a', 'b']);
    expect(clean.definitions).toHaveLength(1);
  });
  it('rejects empty content', () => {
    expect(() => validateSummaryShape({ content: '' })).toThrow();
    expect(() => validateSummaryShape({ content: 'too short' })).toThrow();
  });
  it('filters malformed definitions', () => {
    const clean = validateSummaryShape({
      content: 'word '.repeat(60),
      definitions: [{ term: '', definition: 'x' }, { term: 'ok', definition: 'fine' }, 'garbage'],
    });
    expect(clean.definitions).toHaveLength(1);
  });
});

describe('validateFlashcardsShape', () => {
  it('accepts valid cards array', () => {
    const clean = validateFlashcardsShape([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
    ]);
    expect(clean).toHaveLength(2);
  });
  it('accepts nested flashcards key', () => {
    const clean = validateFlashcardsShape({ flashcards: [{ question: 'Q', answer: 'A' }] });
    expect(clean).toHaveLength(1);
  });
  it('rejects cards missing answers', () => {
    expect(() => validateFlashcardsShape([{ question: 'Q', answer: '' }])).toThrow();
  });
});

describe('validateQuizShape', () => {
  it('normalizes truefalse answers to True/False', () => {
    const clean = validateQuizShape([
      {
        type: 'truefalse',
        question: 'Is 2+2 four?',
        correctAnswer: 'true',
        options: [],
        explanation: 'x',
        topic: 'math',
      },
    ]);
    expect(clean[0].correctAnswer).toBe('True');
    expect(clean[0].options).toEqual(['True', 'False']);
  });
  it('rejects MCQ with fewer than 2 options', () => {
    expect(() =>
      validateQuizShape([{ type: 'mcq', question: 'Pick one', correctAnswer: 'A', options: [] }])
    ).toThrow();
  });
  it('rejects unknown question types', () => {
    expect(() =>
      validateQuizShape([{ type: 'essay', question: 'x', correctAnswer: 'y', options: [] }])
    ).toThrow();
  });
});

describe('retrievalService', () => {
  const chunks = [
    { text: 'Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose.', page: 2 },
    { text: 'Respiration converts glucose into ATP, releasing carbon dioxide in cells.', page: 3 },
    { text: 'The mitochondria is the powerhouse of the cell producing ATP.', page: 4 },
  ];

  it('tokenizes and drops stop words', () => {
    const tokens = tokenize('The process of light energy');
    expect(tokens).toContain('process');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('of');
  });

  it('ranks the most relevant chunk first', () => {
    const results = retrieveRelevantChunks(chunks, 'How do plants convert light energy into glucose?', 2);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].page).toBe(2);
  });

  it('returns empty for unrelated queries with no overlap', () => {
    const results = retrieveRelevantChunks(chunks, 'zebra quantum flux capacitor xylophone', 3);
    expect(results).toHaveLength(0);
  });

  it('falls back to first chunks when query has no tokens', () => {
    const results = retrieveRelevantChunks(chunks, 'the a of', 2);
    expect(results).toHaveLength(Math.min(2, chunks.length));
  });
});
