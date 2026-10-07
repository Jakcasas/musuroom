import {z} from 'zod';
const text=z.string().max(1000000);
export const topicSchema=z.enum(['ingredients','flavor','safety','methods','other']);
export const knowledgeStateSchema=z.strictObject({title:text,summary:text,body:text,limitation:text});
export const labelRunRequestSchema=z.strictObject({limit:z.number().int().min(1).max(10000).default(100),allow_remote:z.boolean()});
export const decisionEventSchema=z.strictObject({
 id:z.string().regex(/^[a-f0-9]{64}$/),run_id:z.uuid(),source:z.string().max(63),article_id:z.string().max(100),
 source_revision:z.number().int().min(1),content_hash:z.string().regex(/^[a-f0-9]{64}$/),
 decision_type:z.literal('KNOWLEDGE_TOPIC'),provider:z.enum(['jev','local']),model:z.string().max(100).nullable(),
 topic:topicSchema,confidence:z.number().min(0).max(1).nullable(),requires_review:z.boolean(),
 probabilities:z.strictObject(Object.fromEntries(['ingredients','flavor','safety','methods','other'].map(key=>[key,z.number().min(0).max(1)]))).nullable(),
 policy_version:z.string().max(100),rubric_version:z.string().max(100),fallback_used:z.boolean(),
 reason:z.string().regex(/^[a-z0-9_]{1,100}$/).nullable(),latency_ms:z.number().int().nonnegative(),
 outcome:z.enum(['saved','stale']),created_at:z.iso.datetime()
});
export const decisionSchemas=Object.fromEntries(Object.entries({knowledge_state:knowledgeStateSchema,label_run:labelRunRequestSchema,decision_event:decisionEventSchema}).map(([name,schema])=>[name,z.toJSONSchema(schema)]));
export function validKnowledgeState(document){return knowledgeStateSchema.safeParse(Object.fromEntries(['title','summary','body','limitation'].map(key=>[key,document?.data?.[key]])));}
export function mongoDecisionValidator(schema=decisionSchemas.decision_event){
 const convert=value=>{
  if(Array.isArray(value))return value.map(convert);if(!value||typeof value!=='object')return value;
  const row={};for(const[key,item]of Object.entries(value)){
   if(['$schema','format','default'].includes(key))continue;
   if(key==='type'){row.bsonType=item==='integer'?['int','long','double']:item==='number'?['int','long','double']:item==='boolean'?'bool':item;if(item==='integer')row.multipleOf=1;}
   else if(key==='const')row.enum=[item];else row[key]=convert(item);
  }return row;
 };
 const result=convert(schema);result.properties._id={bsonType:'objectId'};return {$jsonSchema:result};
}
