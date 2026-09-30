import { resolve } from 'node:path';
export const projectRoot = resolve(import.meta.dirname, '..');
export function loadConfig(env = process.env) {
  const integer = (key, fallback, min, max) => {
    const value = Number(env[key] || fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const host = env.HOST || '127.0.0.1';
  if (host !== '127.0.0.1') throw new Error('This local configuration requires HOST=127.0.0.1');
  const provider = env.AI_PROVIDER || 'disabled';
  if (!['disabled', 'openrouter'].includes(provider)) throw new Error('Invalid AI_PROVIDER');
  const apiKey = env.OPENROUTER_API_KEY || '';
  const model = env.AI_MODEL || '';
  if (provider === 'openrouter' && (!apiKey || !model)) throw new Error('OpenRouter requires OPENROUTER_API_KEY and AI_MODEL');
  const writeToken = env.API_WRITE_TOKEN || '';
  if (writeToken && writeToken.length < 32) throw new Error('API_WRITE_TOKEN must have at least 32 characters');
  if (env.JEV_ENABLED && !['true','false'].includes(env.JEV_ENABLED)) throw new Error('Invalid JEV_ENABLED');
  const jevEnabled = env.JEV_ENABLED === 'true';
  const typesafeKey = env.TYPESAFE_API_KEY || '';
  if (jevEnabled && !typesafeKey) throw new Error('JEV_ENABLED requires TYPESAFE_API_KEY');
  return Object.freeze({ host, port: integer('PORT', 8766, 1, 65535), databasePath: env.DATABASE_PATH === ':memory:' ? ':memory:' : resolve(projectRoot, env.DATABASE_PATH || 'data/musuroom.sqlite'), writeToken, provider, apiKey, model, timeout: integer('AI_TIMEOUT_MS', 20000, 1000, 60000), maxTokens: integer('AI_MAX_TOKENS', 700, 100, 2000), chatLimit: integer('CHAT_REQUESTS_PER_MINUTE', 10, 1, 60), authSessionMs: integer('AUTH_SESSION_MINUTES', 120, 15, 480)*60000, authIdleMs: integer('AUTH_IDLE_MINUTES', 20, 5, 120)*60000, authLoginLimit: integer('AUTH_LOGIN_LIMIT', 8, 3, 20), jevEnabled, typesafeKey, jevModel: env.JEV_MODEL || 'jev-latest', documentRoot: resolve(projectRoot, 'data/dossier') });
}
