/**
 * Provider-agnostic AI service. Swappable backends behind one contract:
 *   completeText({ system, user, temperature, maxTokens }) -> string
 *   completeJson({...}) -> parsed object/string with retry on malformed output
 *
 * Default provider: OpenAI-compatible chat completions (OPENAI_BASE_URL lets
 * users point at Azure/OpenRouter/local gateways without code changes).
 */
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let provider = null;

function getProvider() {
  if (provider) return provider;
  if (!env.ai.apiKey) {
    throw ApiError.serviceUnavailable(
      'AI is not configured on this server. Set OPENAI_API_KEY in server/.env and restart.'
    );
  }
  // Lazy import so the server still runs (non-AI features) without the key.
  const OpenAI = require('openai');
  provider = new OpenAI({
    apiKey: env.ai.apiKey,
    baseURL: env.ai.baseUrl,
    maxRetries: 2,
    timeout: 120000,
  });
  return provider;
}

async function completeText({ system, user, temperature = 0.4, maxTokens = 4096 }) {
  const client = getProvider();
  // `user` may be a plain string (single turn) or an array of {role, content}
  // messages (multi-turn chat with history). Normalize both to a message list.
  const systemMessages = system ? [{ role: 'system', content: system }] : [];
  const messages = Array.isArray(user)
    ? [...systemMessages, ...user.filter((m) => m && ['user', 'assistant'].includes(m.role))]
    : [...systemMessages, { role: 'user', content: user }];

  try {
    const response = await client.chat.completions.create({
      model: env.ai.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
    const text = response?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Model returned an empty response');
    return text;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.status === 401) {
      throw ApiError.serviceUnavailable('The AI provider rejected the API key. Check OPENAI_API_KEY.');
    }
    if (err.status === 429) {
      throw ApiError.serviceUnavailable('AI rate limit reached. Please wait a moment and try again.');
    }
    throw ApiError.serviceUnavailable(
      `AI request failed: ${err.message || 'unknown error'}`
    );
  }
}

// Structured JSON completion with one automatic retry when output fails validation.
async function completeJson({ system, user, validate, temperature = 0.3, maxTokens = 4096 }) {
  const jsonHint =
    'You must reply with ONLY valid JSON (no markdown fences, no commentary).';
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await completeText({
      system: `${system}\n${jsonHint}`,
      user: attempt === 0 ? user : `${user}\n\nYour previous reply could not be parsed. Reply again with ONLY valid JSON.`,
      temperature,
      maxTokens,
    });
    try {
      let parsed;
      try {
        parsed = JSON.parse(raw.trim());
      } catch {
        const fence = raw.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
        parsed = fence ? JSON.parse(fence[1].trim()) : JSON.parse(raw.trim());
      }
      const validated = validate(parsed);
      if (validated) return validated;
      return parsed;
    } catch (validateErr) {
      lastError = validateErr;
    }
  }
  throw ApiError.serviceUnavailable(
    `The AI returned an unusable response: ${lastError?.message || 'validation failed'}`
  );
}

// Clears cached provider so tests can swap the base key.
function resetProvider() {
  provider = null;
}

module.exports = { completeText, completeJson, resetProvider };
