import { operation } from '../backend/db/operation.mjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readCloudEnvironment } from './cloud-config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { openMongoStore } from '../backend/services/mongo-store.mjs';
import { readProviderJson } from '../backend/services/provider-response.mjs';
import { setTimeout } from 'node:timers/promises';
export async function checkCloud(config,{openDatabase=openConfiguredDatabase,openMongo=openMongoStore,fetchImpl=fetch}={}) {
 const checks=[];let db;
 try{for(let attempt=0;attempt<3;attempt++){try{db=await openDatabase(config);break;}catch(error){if(attempt===2||!error.message?.includes('(28P01)'))throw error;await setTimeout(2000);}}const row=await operation(db,'knowledge.count',()=>db.prepare('SELECT count(*) AS n FROM knowledge_articles')).get();checks.push({service:config.databaseProvider,ok:true,articles:Number(row.n)});}
 catch(error){checks.push({service:config.databaseProvider,ok:false,reason:error.message?.includes('(28P01)')?'database_password_rejected':'connection_or_migration_failed'});}
 finally{await db?.close();}
 if(config.storageProvider==='supabase')try{
   const signal=AbortSignal.timeout(15000),response=await fetchImpl(config.supabaseUrl+'/storage/v1/bucket/'+config.storageBucket,{redirect:'error',signal,headers:{Authorization:'Bearer '+config.storageKey,apikey:config.storageKey}});
   if(!response.ok){await response.body?.cancel();throw new Error('storage_unavailable');}
   const bucket=await readProviderJson(response,signal);if(bucket.public!==false)throw new Error('bucket_not_private');
   checks.push({service:'storage',ok:true,private:true});
  }catch{checks.push({service:'storage',ok:false,reason:'private_bucket_check_failed'});}
 else checks.push({service:'storage',ok:config.storageProvider==='mongodb'?checks[0]?.ok===true:true,mode:config.storageProvider});
 if(config.mongoEnabled){let store;try{store=await openMongo(config);checks.push({service:'atlas',ok:true});}catch{checks.push({service:'atlas',ok:false,reason:'connection_or_indexes_failed'});}finally{await store?.close();}}
 else checks.push({service:'atlas',ok:true,mode:'disabled'});
 checks.push({service:'jev',ok:true,mode:config.jevEnabled?'configured_not_verified':'disabled'});
 return{ready:checks.every(check=>check.ok),checks};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const{config}=readCloudEnvironment(process.argv.slice(2).find(x=>!x.startsWith('--')),{withoutAtlas:process.argv.includes('--without-atlas')});const result=await checkCloud(config);console.log(JSON.stringify(result,null,2));if(!result.ready)process.exitCode=1;}
 catch{console.error('Cloud configuration invalid. Check private data/cloud.env and HTTPS origin; values were not printed.');process.exitCode=1;}
}
