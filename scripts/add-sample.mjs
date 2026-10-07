import {operation} from '../backend/db/operation.mjs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { loadProjectEnv } from './env.mjs';
import { loadConfig } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { validateSample,isMeasurementEvidence } from '../backend/routes/project.mjs';
if(!process.argv[2])throw new Error('Usage: node scripts/add-sample.mjs PATH_TO_ACTUAL_SAMPLE_JSON');
const{input,errors}=validateSample(JSON.parse(readFileSync(resolve(process.argv[2]),'utf8')));if(Object.keys(errors).length)throw new Error(Object.entries(errors).map(([key,message])=>key+': '+message).join('\n'));
loadProjectEnv();const db=await openConfiguredDatabase(loadConfig());
try{
 const doc=await operation(db,'documents.get',()=>db.prepare('SELECT evidence_status,doc_type FROM quality_documents WHERE id=?')).get(input.evidence_document_id);if(!isMeasurementEvidence(doc))throw new Error('Register a FINAL COA or measurement REPORT first.');
 const id=randomUUID();const inserted=await operation(db,'products.insert',()=>db.prepare('INSERT INTO product_samples(id,sample_code,label,origin,process_notes,metrics_json,nutrition_json,measured_at,evidence_document_id,publication_status) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(sample_code) DO NOTHING')).run(id,input.sample_code,input.label,input.origin,input.process_notes,JSON.stringify(input.metrics),JSON.stringify(input.nutrition),input.measured_at,input.evidence_document_id,input.publication_status);
 if(!inserted.changes)throw new Error('Sample code exists. Existing record preserved.');
 await operation(db,'audit.insert',()=>db.prepare('INSERT INTO access_audit(account_id,action,resource_id) VALUES(?,?,?)')).run(null,'SAMPLE_REGISTERED_CLI',id);console.log('Actual sample registered:',id,'Visibility:',input.publication_status);
}finally{await db.close();}
