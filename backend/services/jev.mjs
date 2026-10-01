import { sensoryLabels as labels,sensoryQuestion } from './jev-rubric.mjs';
import { createJevEvaluator,validChoice } from './jev-client.mjs';
import { localSensoryClassification } from './local-classifier.mjs';
export function createJevClassifier(config,fetchImpl) {
 const evaluate=createJevEvaluator(config,fetchImpl);
 return async(comment,allowRemote)=>{
  const text=comment.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[email removed]').replace(/\+?\d[\d\s().-]{6,}\d/g,'[phone removed]');
  const unavailable=reason=>localSensoryClassification(text,labels,reason);
  if(!config.jevEnabled)return unavailable('jev_disabled');
  if(!allowRemote)return unavailable('remote_consent_required');
  const result=await evaluate({model:config.jevModel,state:{comment:text},questions:{topic:sensoryQuestion}});
  if(result.reason)return unavailable(result.reason);
  const answer=result.data?.answers?.topic;
  if(!validChoice(answer,labels)||typeof result.data.model!=='string'||result.data.model.length>100)return unavailable('invalid_response');
  return{mode:'jev',key:answer.choice,label:labels[answer.choice],confidence:answer.confidence,probabilities:answer.probabilities,model:result.data.model,message:'Đề xuất phân loại để đối chiếu; không tự thay đổi điểm hoặc quyền truy cập.'};
 };
}
