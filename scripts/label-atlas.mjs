import {loadProjectEnv} from './env.mjs';
import {loadConfig} from '../backend/config.mjs';
import {readCloudEnvironment} from './cloud-config.mjs';
import {openConfiguredDatabase} from '../backend/db/configured.mjs';
import {createAtlasLabeling} from '../backend/services/atlas-labeling.mjs';
loadProjectEnv();let db;
try{
 const args=process.argv.slice(2),allowed=new Set(['--cloud','--run','--allow-remote','--limit','--id','--resume','--cancel']);
 for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw Error('invalid_option');if(['--limit','--id'].includes(args[i]))i++;}
 const limit=args.includes('--limit')?Number(args[args.indexOf('--limit')+1]):100,id=args.includes('--id')?args[args.indexOf('--id')+1]:null;
 const config=args.includes('--cloud')?readCloudEnvironment().config:loadConfig();db=await openConfiguredDatabase(config);const labeling=createAtlasLabeling(db,config);
 if(id&&!/^[a-f0-9-]{36}$/.test(id))throw Error('invalid_run_id');
 if(args.includes('--resume')||args.includes('--cancel')){
  if(!id)throw Error('run_id_required');const changed=await labeling.control(id,args.includes('--resume')?'resume':'cancel');console.log(JSON.stringify({changed,run:await labeling.get(id)}));
 }else if(args.includes('--run')){
  let run=id?await labeling.get(id):await labeling.enqueue({limit,allow_remote:args.includes('--allow-remote')});if(!run)throw Error('run_not_found');
  for(let i=0;i<2001&&['queued','running'].includes(run.status);i++){
   const result=await labeling.runOnce();console.log(JSON.stringify(result));run=await labeling.get(run.id);if(['idle','lease_lost','retry_scheduled'].includes(result.mode))break;
  }console.log(JSON.stringify({run}));if(['blocked','failed'].includes(run.status))process.exitCode=2;
 }else if(id)console.log(JSON.stringify({run:await labeling.get(id)}));
 else console.log(JSON.stringify(await labeling.preview({limit,allow_remote:args.includes('--allow-remote')})));
}catch{console.error('Atlas labeling stopped. Check options, JSON contracts and private configuration; credentials were not printed.');process.exitCode=1;}
finally{await db?.close();}
