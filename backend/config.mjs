import { resolve } from 'node:path';
export const projectRoot = resolve(import.meta.dirname, '..');
export function loadConfig(env = process.env) {
  const url = (value,key) => { try { return new URL(value); } catch { throw new Error('Invalid '+key); } };
  const integer = (key, fallback, min, max) => {
    const value = Number(env[key] || fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  const production = env.NODE_ENV === 'production';
  const host = env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
  if ((!production && host !== '127.0.0.1' && !(env.CONTAINER_LOCAL==='true'&&host==='0.0.0.0')) || (production && !['0.0.0.0','127.0.0.1'].includes(host))) throw new Error('Invalid HOST for deployment mode');
  const databaseProvider = env.DATABASE_PROVIDER || 'sqlite';
  if(!['sqlite','postgres'].includes(databaseProvider))throw new Error('Invalid DATABASE_PROVIDER');
  const publicOrigin = env.PUBLIC_ORIGIN || '';
  if(publicOrigin){const u=url(publicOrigin,'PUBLIC_ORIGIN');if(u.protocol!=='https:' || u.username || u.password || u.pathname!=='/' || u.search || u.hash)throw new Error('PUBLIC_ORIGIN must be an HTTPS origin');}
  const databaseUrl = env.DATABASE_URL || '';
  if(databaseProvider==='postgres') { const connection=url(databaseUrl,'DATABASE_URL'); if(!['postgres:','postgresql:'].includes(connection.protocol)||!connection.hostname||!connection.username||!connection.password)throw new Error('Postgres requires a complete DATABASE_URL'); if(connection.port==='6543')throw new Error('Use the Session pooler on 5432 or a direct connection; transaction pooling cannot hold the migration lock.'); }
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
  const defaultJudgeAccountId=(env.JUDGE_DEFAULT_ACCOUNT_ID||'').trim();
  if(defaultJudgeAccountId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(defaultJudgeAccountId))throw new Error('Invalid JUDGE_DEFAULT_ACCOUNT_ID');
  if (writeToken && writeToken.length < 32) throw new Error('API_WRITE_TOKEN must have at least 32 characters');
  if (env.JEV_ENABLED && !['true','false'].includes(env.JEV_ENABLED)) throw new Error('Invalid JEV_ENABLED');
  const jevEnabled = env.JEV_ENABLED === 'true';
  // Older local setups used TYPESAFE_API_KEY as a variable name for the same JevAI key.
  const jevKey = env.JEV_API_KEY || env.TYPESAFE_API_KEY || '';
  if (jevEnabled && !jevKey) throw new Error('JEV_ENABLED requires a JevAI JEV_API_KEY from /agent/keys');
  if(jevEnabled && (/\s/.test(jevKey)||jevKey.length>512||/^(?:YOUR_|DIEN_|<|\[)/.test(jevKey)))throw new Error('Replace the JevAI placeholder with a server-only key.');
  const jevModel='typesafe-ai/jev'; if(env.JEV_MODEL&&!['typesafe-ai/jev','jev-latest'].includes(env.JEV_MODEL))throw new Error('Only the JevAI typesafe-ai/jev model is supported');
  const jevTransport=env.JEV_TRANSPORT||'rest';if(!['rest','mcp'].includes(jevTransport))throw new Error('Invalid JEV_TRANSPORT');
  for(const key of ['MONGO_ENABLED','MONGO_JEV_ENRICHMENT'])if(env[key]&&!['true','false'].includes(env[key]))throw new Error('Invalid '+key);
  const mongoEnabled=env.MONGO_ENABLED==='true', mongoUri=env.MONGODB_URI||'', mongoEnrichment=env.MONGO_JEV_ENRICHMENT==='true';
  const mongoDatabase=env.MONGODB_DATABASE||'musuroom', mongoSource=env.MONGO_SOURCE_ID||(production?'musuroom-production':'musuroom-local');
  if(!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(mongoDatabase)||!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(mongoSource))throw new Error('Invalid MongoDB database/source name');
  if(mongoEnabled){const u=url(mongoUri,'MONGODB_URI');if(!['mongodb:','mongodb+srv:'].includes(u.protocol)||!u.hostname||u.hash)throw new Error('Invalid MONGODB_URI'); if(production&&(u.protocol!=='mongodb+srv:'||!u.hostname.endsWith('.mongodb.net')||!u.username||!u.password))throw new Error('Production requires an authenticated Atlas SRV URI');for(const[key,value]of u.searchParams)if((['tls','ssl'].includes(key.toLowerCase())&&value==='false')||(['tlsinsecure','tlsallowinvalidcertificates','tlsallowinvalidhostnames'].includes(key.toLowerCase())&&value==='true'))throw new Error('MongoDB TLS verification cannot be disabled');}
  if(mongoEnrichment&&(!mongoEnabled||!jevEnabled))throw new Error('MongoDB enrichment requires MongoDB and Jev configuration');
  const mongoControls={mongoEnabled,mongoUri,mongoDatabase,mongoSource,mongoEnrichment,mongoBatchSize:integer('MONGO_SYNC_BATCH_SIZE',25,1,100),mongoSyncMs:integer('MONGO_SYNC_INTERVAL_MS',60000,10000,3600000),mongoJevMax:integer('MONGO_JEV_MAX_PER_RUN',10,1,20),jevMinConfidence:Number(env.JEV_MIN_CONFIDENCE||0.65)};
  if(!Number.isFinite(mongoControls.jevMinConfidence)||mongoControls.jevMinConfidence<0||mongoControls.jevMinConfidence>1)throw new Error('Invalid JEV_MIN_CONFIDENCE');
  mongoControls.jevTransport=jevTransport;
  return Object.freeze({ ...aiControls, ...mongoControls, defaultJudgeAccountId, production, publicOrigin:publicOrigin.replace(/\/$/,''), databaseProvider, databaseUrl, databaseCa:env.DATABASE_CA_CERT || '', storageProvider,supabaseUrl,storageKey,storageBucket, host, port: integer('PORT', 8766, 1, 65535), databasePath: env.DATABASE_PATH === ':memory:' ? ':memory:' : resolve(projectRoot, env.DATABASE_PATH || 'data/musuroom.sqlite'), writeToken, provider, apiKey, model, timeout: integer('AI_TIMEOUT_MS', 20000, 1000, 60000), maxTokens: integer('AI_MAX_TOKENS', 700, 100, 2000), chatLimit: integer('CHAT_REQUESTS_PER_MINUTE', 10, 1, 60), authSessionMs: integer('AUTH_SESSION_MINUTES', 120, 15, 480)*60000, authIdleMs: integer('AUTH_IDLE_MINUTES', 20, 5, 120)*60000, authLoginLimit: integer('AUTH_LOGIN_LIMIT', 8, 3, 20), jevEnabled, jevKey, jevModel, documentRoot: resolve(projectRoot, 'data/dossier') });
}
