import { createJevEvaluator,validChoice } from './jev-client.mjs';
import { knowledgeTopic } from './knowledge-decisions.mjs';
import { localKnowledgeClassification } from './local-classifier.mjs';
import { guardedKnowledge,confidenceGate } from './decision-policy.mjs';
export function createKnowledgeBatch(config,fetchImpl) {
 const evaluate=createJevEvaluator(config,fetchImpl);
 return async(documents,allowRemote)=>{
  if(!Array.isArray(documents)||!documents.length||documents.length>5)throw new Error('Batch must contain 1–5 documents');
  const guarded=documents.map(guardedKnowledge),eligible=guarded.map((entry,index)=>({entry,index})).filter(({entry})=>entry.guard.allow_remote);
  const fallback=(entry,reason)=>confidenceGate(localKnowledgeClassification(entry.document,reason),config.jevMinConfidence);
  const results=guarded.map(entry=>fallback(entry,entry.guard.reason||(!allowRemote?'remote_consent_required':'jev_disabled')));
  let requests=0;
  if(allowRemote&&config.jevEnabled&&eligible.length){
   const request={model:config.jevModel,state:{documents:eligible.map(({entry,index})=>({index,...Object.fromEntries(['title','summary','body','limitation'].map(key=>[key,entry.document.data[key].slice(0,key==='body'?1000:350)]))}))},questions:Object.fromEntries(eligible.map(({index})=>['item_'+index,{...knowledgeTopic,instructions:knowledgeTopic.instructions+` Evaluate ONLY the document whose index is ${index} in state.documents.`}]))};
   requests=1;const response=await evaluate(request);
   for(const {entry,index} of eligible){
    const answer=response.data?.answers?.['item_'+index];
    if(response.reason||!validChoice(answer,knowledgeTopic.criteria)||typeof response.data?.model!=='string'||response.data.model.length>100){results[index]=fallback(entry,response.reason||'invalid_response');continue;}
    results[index]=confidenceGate({mode:'jev',topic:answer.choice,confidence:answer.confidence,probabilities:answer.probabilities,model:response.data.model,rubric_version:'knowledge-topic-batch-1'},config.jevMinConfidence);
   }
  }
  return {items:results.map((result,index)=>({article_id:documents[index].resource_id,...result})),jev_requests:requests};
 };
}
