import { createJevEvaluator,validChoice } from './jev-client.mjs';
import { knowledgeTopic } from './knowledge-decisions.mjs';
import { localKnowledgeClassification } from './local-classifier.mjs';
import { guardedKnowledge,confidenceGate } from './decision-policy.mjs';
import {validKnowledgeState} from './decision-contracts.mjs';
export function knowledgeBatchPreview(documents,model='typesafe-ai/jev') {
 if(!Array.isArray(documents)||!documents.length||documents.length>5||documents.some(d=>d?.type!=='knowledge'||!d.active||!d.data))throw new Error('Batch must contain 1–5 public knowledge documents');
 if(documents.some(document=>!validKnowledgeState(document).success))throw new Error('Invalid public knowledge JSON');
 const guarded=documents.map(guardedKnowledge),eligible=guarded.map((entry,index)=>({entry,index})).filter(({entry})=>entry.guard.allow_remote);
 const cut=(value,length)=>Array.from(value).slice(0,length).join('');
 const request={model,state:{documents:eligible.map(({entry,index})=>({index,...Object.fromEntries(['title','summary','body','limitation'].map(key=>[key,cut(entry.document.data[key],key==='body'?1000:350)]))}))},questions:Object.fromEntries(eligible.map(({index})=>['item_'+index,{...knowledgeTopic,instructions:knowledgeTopic.instructions+` Evaluate ONLY the document whose index is ${index} in state.documents.`}]))};
 const bytes=()=>Buffer.byteLength(JSON.stringify(request));
 // Reserve bytes for the MCP envelope; reduce fields on code point boundaries.
 while(bytes()>18000){
  const fields=request.state.documents.flatMap(doc=>['title','summary','body','limitation'].map(key=>({doc,key,bytes:Buffer.byteLength(doc[key])})));
  fields.sort((a,b)=>b.bytes-a.bytes);const largest=fields[0];if(!largest?.bytes)throw new Error('Batch instructions exceed budget');
  largest.doc[largest.key]=cut(largest.doc[largest.key],Math.floor(Array.from(largest.doc[largest.key]).length*0.75));
 }
 return {request,request_bytes:bytes(),payload_budget_bytes:18000,articles:guarded.map(({guard,document},index)=>{const state=request.state.documents.find(doc=>doc.index===index);return {article_id:document.resource_id,title:document.data.title,remote_eligible:guard.allow_remote,reason:guard.reason,truncated:!!state&&['title','summary','body','limitation'].some(key=>state[key]!==document.data[key])};})};
}
export function createKnowledgeBatch(config,fetchImpl) {
 const evaluate=createJevEvaluator(config,fetchImpl);
 return async(documents,allowRemote)=>{
  const preview=knowledgeBatchPreview(documents,config.jevModel);
  const guarded=documents.map(guardedKnowledge),eligible=guarded.map((entry,index)=>({entry,index})).filter(({entry})=>entry.guard.allow_remote);
  const fallback=(entry,reason)=>confidenceGate(localKnowledgeClassification(entry.document,reason),config.jevMinConfidence);
  const results=guarded.map(entry=>fallback(entry,entry.guard.reason||(!allowRemote?'remote_consent_required':'jev_disabled')));
  let requests=0;
  if(allowRemote&&config.jevEnabled&&eligible.length){
   requests=1;const response=await evaluate(preview.request);
   for(const {entry,index} of eligible){
    const answer=response.data?.answers?.['item_'+index];
    if(response.reason||!validChoice(answer,knowledgeTopic.criteria)||typeof response.data?.model!=='string'||response.data.model.length>100){results[index]=fallback(entry,response.reason||'invalid_response');continue;}
    results[index]=confidenceGate({mode:'jev',topic:answer.choice,confidence:answer.confidence,probabilities:answer.probabilities,model:response.data.model,rubric_version:'knowledge-topic-batch-1'},config.jevMinConfidence);
   }
  }
  return {items:results.map((result,index)=>({article_id:documents[index].resource_id,...result})),jev_requests:requests,summary:{total:results.length,jev:results.filter(item=>item.mode==='jev').length,local:results.filter(item=>item.mode!=='jev').length,needs_review:results.filter(item=>item.requires_review).length}};
 };
}
