/*
 * Gemini-powered AI service.
 * Keeps the existing completeText and completeJson interfaces.
 */

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

async function completeText({
  system,
  user,
  temperature = 0.4,
  maxTokens = 4096
}) {
  const apiKey = env.ai.apiKey;

  if (!apiKey) {
    throw ApiError.serviceUnavailable(
      'Gemini is not configured. Set GEMINI_API_KEY in Vercel.'
    );
  }

  const contents = Array.isArray(user)
    ? user
        .filter((m) => m && ['user', 'assistant'].includes(m.role))
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content) }]
        }))
    : [{
        role: 'user',
        parts: [{ text: String(user) }]
      }];

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  if (system) {
    body.systemInstruction = {
      parts: [{ text: system }]
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.ai.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || 'Unknown Gemini error';

      if (response.status === 429) {
        throw ApiError.serviceUnavailable(
          'Gemini rate limit reached. Please wait and try again.'
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw ApiError.serviceUnavailable(
          'Gemini rejected the API key. Check GEMINI_API_KEY.'
        );
      }

      throw ApiError.serviceUnavailable(
        `Gemini request failed: ${message}`
      );
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('');

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;

  } catch (err) {
    if (err instanceof ApiError) throw err;

    throw ApiError.serviceUnavailable(
      `AI request failed: ${err.message || 'unknown error'}`
    );
  }
}


// Structured JSON completion with automatic retry.
async function completeJson({
  system,
  user,
  validate,
  temperature = 0.3,
  maxTokens = 4096
}) {
  const jsonHint =
    'You must reply with ONLY valid JSON. No markdown fences or commentary.';

  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await completeText({
      system: `${system || ''}\n${jsonHint}`,
      user: attempt === 0
        ? user
        : `${user}\n\nYour previous reply could not be parsed. Reply again with ONLY valid JSON.`,
      temperature,
      maxTokens
    });

    try {
      let parsed;

      try {
        parsed = JSON.parse(raw.trim());
      } catch {
        const fence = raw.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
        parsed = fence
          ? JSON.parse(fence[1].trim())
          : JSON.parse(raw.trim());
      }

      const validated = validate(parsed);

      if (validated) return validated;

      return parsed;

    } catch (err) {
      lastError = err;
    }
  }

  throw ApiError.serviceUnavailable(
    `The AI returned an unusable response: ${lastError?.message || 'validation failed'}`
  );
}

function resetProvider() {
  // No cached provider is needed for REST requests.
}

module.exports = {
  completeText,
  completeJson,
  resetProvider
};