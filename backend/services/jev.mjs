import { sensoryLabels as labels, sensoryQuestion } from './jev-rubric.mjs';
export function createJevClassifier(config, fetchImpl = fetch) {
  let active = 0;
  return async (comment, allowRemote) => {
    const unavailable = reason => ({ mode: 'manual', reason, label: null, message: 'Chưa có đề xuất từ Jev. Bạn có thể tự phân loại góp ý.' });
    if (!config.jevEnabled) return unavailable('jev_disabled');
    if (!allowRemote) return unavailable('remote_consent_required');
    if (active >= 2) return unavailable('jev_busy');
    const text = comment.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[email removed]').replace(/\+?\d[\d\s().-]{6,}\d/g,'[phone removed]');
    active++;
    try {
      const deadline=AbortSignal.timeout(config.timeout);
      let response;
      for(let attempt=0;attempt<2;attempt++){
       response = await fetchImpl('https://api.typesafe.ai/v1/systemone', {
        method: 'POST', headers: { Authorization: `Bearer ${config.typesafeKey}`, 'Content-Type': 'application/json' }, signal: deadline,
        body: JSON.stringify({ model: config.jevModel, state: { comment: text }, questions: { topic: sensoryQuestion } })
      });
       if(attempt || ![429,529].includes(response.status))break;
       const header=response.headers?.get('retry-after');const seconds=header===null||header===undefined?1:Number(header);
       if(!Number.isFinite(seconds)||seconds<0||seconds>3)break;
       await response.body?.cancel();
       const {setTimeout}=await import('node:timers/promises');await setTimeout(Math.max(250,seconds*1000),undefined,{signal:deadline});
      }
      if (!response.ok) return unavailable('provider_unavailable');
      const data = await response.json(); const a = data?.answers?.topic;
      if (!a || a.type !== 'choice' || !Object.hasOwn(labels,a.choice) || !Number.isFinite(a.confidence) || a.confidence < 0 || a.confidence > 1 || !a.probabilities || Object.keys(a.probabilities).length !== 6 || Object.keys(labels).some(key => !Number.isFinite(a.probabilities[key]) || a.probabilities[key] < 0 || a.probabilities[key] > 1) || Math.abs(Object.values(a.probabilities).reduce((x,y)=>x+y,0)-1) > 0.01) return unavailable('invalid_response');
      if(a.probabilities[a.choice] < Math.max(...Object.values(a.probabilities)))return unavailable('invalid_response');
      return { mode: 'jev', key: a.choice, label: labels[a.choice], confidence: a.confidence, probabilities: a.probabilities, model: data.model, message: 'Đề xuất phân loại để đối chiếu; không tự thay đổi điểm hoặc quyền truy cập.' };
    } catch { return unavailable('provider_unavailable'); }
    finally { active--; }
  };
}
