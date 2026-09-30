import { loadProjectEnv } from './env.mjs';
import { loadConfig } from '../backend/config.mjs';
loadProjectEnv();const config=loadConfig();if(config.storageProvider!=='supabase')throw new Error('Set STORAGE_PROVIDER=supabase');
const headers={apikey:config.storageKey,Authorization:`Bearer ${config.storageKey}`,'Content-Type':'application/json'};
const origin=config.supabaseUrl+'/storage/v1/bucket';
const check=await fetch(origin+'/'+config.storageBucket,{headers,redirect:'error',signal:AbortSignal.timeout(15000)});
if(check.ok){if((await check.json()).public!==false)throw new Error('Existing bucket is public. Choose a new private bucket; access was not changed.');console.log('Private Supabase bucket verified.');}
else if(check.status===404 || check.status===400){
 const created=await fetch(origin,{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(20000),body:JSON.stringify({id:config.storageBucket,name:config.storageBucket,public:false,file_size_limit:50*1024*1024})});
 if(!created.ok)throw new Error('Private bucket creation failed. Check server key and permissions.');console.log('Private Supabase bucket created.');
}else throw new Error('Cannot verify Supabase bucket. Check server-only key.');
