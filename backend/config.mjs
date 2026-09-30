import { resolve } from 'node:path';
export const projectRoot = resolve(import.meta.dirname, '..');
export function loadConfig(env = process.env) {
  const integer = (key, fallback, min, max) => {
    const value = Number(env[key] || fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const production = env.NODE_ENV === 'production';
  const host = env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
  if ((!production && host !== '127.0.0.1') || (production && !['0.0.0.0','127.0.0.1'].includes(host))) throw new Error('Invalid HOST for deployment mode');
  const databaseProvider = env.DATABASE_PROVIDER || 'sqlite';
  if(!['sqlite','postgres'].includes(databaseProvider))throw new Error('Invalid DATABASE_PROVIDER');
  const publicOrigin = env.PUBLIC_ORIGIN || '';
  if(publicOrigin){const u=new URL(publicOrigin);if(u.protocol!=='https:' || u.username || u.password || u.pathname!=='/' || u.search || u.hash)throw new Error('PUBLIC_ORIGIN must be an HTTPS origin');}
  const databaseUrl = env.DATABASE_URL || '';
  if(databaseProvider==='postgres' && (!/^postgres(?:ql)?:\/\//.test(databaseUrl) || !new URL(databaseUrl).hostname))throw new Error('Postgres requires DATABASE_URL');
  if(databaseProvider==='postgres' && databaseUrl.includes('[YOUR-PASSWORD]'))throw new Error('Fill the actual database password in the private environment file');
  const storageProvider = env.STORAGE_PROVIDER || 'local';
  if(!['local','supabase'].includes(storageProvider))throw new Error('Invalid STORAGE_PROVIDER');
  const supabaseUrl=env.SUPABASE_URL || ''; const storageKey=env.SUPABASE_SERVICE_ROLE_KEY || '';
  if(storageProvider==='supabase' && (!/^https:\/\/[^/]+\.supabase\.co$/.test(supabaseUrl) || !storageKey))throw new Error('Supabase Storage requires URL and server-only key');
  const storageBucket=env.SUPABASE_STORAGE_BUCKET || 'musuroom-dossier';
  if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(storageBucket))throw new Error('Invalid storage bucket');
  if(production && (!publicOrigin || databaseProvider!=='postgres' || storageProvider!=='supabase'))throw new Error('Production requires HTTPS PUBLIC_ORIGIN, Postgres and Supabase private storage');
  const provider = env.AI_PROVIDER || 'disabled';
  if (!['disabled', 'openrouter'].includes(provider)) throw new Error('Invalid AI_PROVIDER');
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  const model = (env.AI_MODEL || '').trim();
  if (provider === 'openrouter' && (!apiKey || !model)) throw new Error('OpenRouter requires OPENROUTER_API_KEY and AI_MODEL');
  if (provider === 'openrouter' && (/^YOUR_|^<|^\[/.test(apiKey) || /^YOUR_|^<|^\[/.test(model) || /\s/.test(apiKey) || apiKey.length > 512 || !/^[A-Za-z0-9~][A-Za-z0-9._:/~+-]{0,199}$/.test(model))) throw new Error('Replace OpenRouter placeholders with a valid server key and model ID');
  const aiControls = { aiConcurrency: integer('AI_MAX_CONCURRENT', 2, 1, 4), aiCooldownMs: integer('AI_COOLDOWN_MS', 30000, 0, 120000), aiContextMaxChars: integer('AI_CONTEXT_MAX_CHARS', 12000, 3000, 24000), insightsLimit: integer('INSIGHTS_REQUESTS_PER_MINUTE', 10, 1, 60) };
  const writeToken = env.API_WRITE_TOKEN || '';
  if (writeToken && writeToken.length < 32) throw new Error('API_WRITE_TOKEN must have at least 32 characters');
  if (env.JEV_ENABLED && !['true','false'].includes(env.JEV_ENABLED)) throw new Error('Invalid JEV_ENABLED');
  const jevEnabled = env.JEV_ENABLED === 'true';
  const typesafeKey = env.TYPESAFE_API_KEY || '';
  if (jevEnabled && !typesafeKey) throw new Error('JEV_ENABLED requires TYPESAFE_API_KEY');
  return Object.freeze({ ...aiControls, production, publicOrigin:publicOrigin.replace(/\/$/,''), databaseProvider, databaseUrl, databaseCa:env.DATABASE_CA_CERT || '', storageProvider,supabaseUrl,storageKey,storageBucket, host, port: integer('PORT', 8766, 1, 65535), databasePath: env.DATABASE_PATH === ':memory:' ? ':memory:' : resolve(projectRoot, env.DATABASE_PATH || 'data/musuroom.sqlite'), writeToken, provider, apiKey, model, timeout: integer('AI_TIMEOUT_MS', 20000, 1000, 60000), maxTokens: integer('AI_MAX_TOKENS', 700, 100, 2000), chatLimit: integer('CHAT_REQUESTS_PER_MINUTE', 10, 1, 60), authSessionMs: integer('AUTH_SESSION_MINUTES', 120, 15, 480)*60000, authIdleMs: integer('AUTH_IDLE_MINUTES', 20, 5, 120)*60000, authLoginLimit: integer('AUTH_LOGIN_LIMIT', 8, 3, 20), jevEnabled, typesafeKey, jevModel: env.JEV_MODEL || 'jev-latest', documentRoot: resolve(projectRoot, 'data/dossier') });
}
