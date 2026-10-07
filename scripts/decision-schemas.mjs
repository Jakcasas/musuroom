import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decisionSchemas} from '../backend/services/decision-contracts.mjs';
const root=resolve(import.meta.dirname,'../docs/schemas');await mkdir(root,{recursive:true});
for(const[name,schema]of Object.entries(decisionSchemas))await writeFile(resolve(root,name+'.schema.json'),JSON.stringify(schema,null,2)+'\n');
console.log('Exported three JSON Schema contracts to docs/schemas.');
