import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { loadConfig,projectRoot } from '../backend/config.mjs';
import { publicLinks } from './generate-qr.mjs';
export const cloudTarget=Object.freeze({project:'2fb171d1-803d-4f5e-93cc-94837e2f42d4',service:'musuroom-web',environment:'production',origin:'https://musuroom-web-production.up.railway.app'});
export const cloudKeys=['NODE_ENV','HOST','PORT','PUBLIC_ORIGIN','DATABASE_PROVIDER','DATABASE_URL','DATABASE_CA_CERT','STORAGE_PROVIDER','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_STORAGE_BUCKET','API_WRITE_TOKEN','AI_PROVIDER','OPENROUTER_API_KEY','AI_MODEL','AI_TIMEOUT_MS','AI_MAX_TOKENS','AI_CONTEXT_MAX_CHARS','AI_MAX_CONCURRENT','AI_COOLDOWN_MS','CHAT_REQUESTS_PER_MINUTE','INSIGHTS_REQUESTS_PER_MINUTE','AUTH_SESSION_MINUTES','AUTH_IDLE_MINUTES','AUTH_LOGIN_LIMIT','JEV_ENABLED','JEV_API_KEY','JEV_MODEL','JEV_TRANSPORT','JEV_MIN_CONFIDENCE','MONGO_ENABLED','MONGODB_URI','MONGODB_DATABASE','MONGO_SOURCE_ID','MONGO_JEV_ENRICHMENT','MONGO_SYNC_BATCH_SIZE','MONGO_SYNC_INTERVAL_MS','MONGO_JEV_MAX_PER_RUN'];
export function cloudEnvironment(values,origin=cloudTarget.origin) {
 publicLinks(origin);
 const env={...values,NODE_ENV:'production',HOST:'0.0.0.0',PORT:'8080',PUBLIC_ORIGIN:new URL(origin).origin,API_WRITE_TOKEN:'',AI_PROVIDER:values.AI_PROVIDER||'disabled',JEV_ENABLED:values.JEV_ENABLED||'false',MONGO_ENABLED:values.MONGO_ENABLED||'false',MONGO_JEV_ENRICHMENT:values.MONGO_JEV_ENRICHMENT||'false',MONGO_SOURCE_ID:values.MONGO_SOURCE_ID||'musuroom-production'};
 const config=loadConfig(env);
 Object.assign(env,{AI_TIMEOUT_MS:config.timeout,AI_MAX_TOKENS:config.maxTokens,AI_CONTEXT_MAX_CHARS:config.aiContextMaxChars,AI_MAX_CONCURRENT:config.aiConcurrency,AI_COOLDOWN_MS:config.aiCooldownMs,CHAT_REQUESTS_PER_MINUTE:config.chatLimit,INSIGHTS_REQUESTS_PER_MINUTE:config.insightsLimit,AUTH_SESSION_MINUTES:config.authSessionMs/60000,AUTH_IDLE_MINUTES:config.authIdleMs/60000,AUTH_LOGIN_LIMIT:config.authLoginLimit,JEV_API_KEY:config.jevKey,JEV_MODEL:config.jevModel,JEV_TRANSPORT:config.jevTransport,JEV_MIN_CONFIDENCE:config.jevMinConfidence,MONGODB_DATABASE:config.mongoDatabase,MONGO_SYNC_BATCH_SIZE:config.mongoBatchSize,MONGO_SYNC_INTERVAL_MS:config.mongoSyncMs,MONGO_JEV_MAX_PER_RUN:config.mongoJevMax});
 return{config,env:Object.fromEntries(cloudKeys.map(key=>[key,String(env[key]??'')]))};
}
export function readCloudEnvironment(origin,{withoutAtlas=false}={}) {
 let values;try{values=parseEnv(readFileSync(resolve(projectRoot,'data/cloud.env'),'utf8'));}catch{throw new Error('Create private data/cloud.env from cloud.env.example first.');}
 return cloudEnvironment(withoutAtlas?{...values,MONGO_ENABLED:'false',MONGO_JEV_ENRICHMENT:'false'}:values,origin);
}
