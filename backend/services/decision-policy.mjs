import { normalize } from '../../shared/core.js';
// Heuristics reduce exposure; authentication and authorization remain deterministic.
export function guardInput(value) {
 const raw=String(value??'').normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g,'');
 const secret=/(?:Bearer\s+[A-Za-z0-9._-]{12,}|(?:api[_ -]?key|password|mật\s*khẩu|mat\s*khau|access[_ -]?token|mã\s*truy\s*cập)\s*[:=]\s*\S{6,}|(?:postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s/]+:[^\s@]+@[^\s]+|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|$))/i;
 const normalized=normalize(raw);
 const suspicious=/\b(ignore (?:all |the )?(?:previous|system) instructions|reveal (?:the )?system prompt|bo qua (?:tat ca )?(?:huong dan|chi dan)|grant admin|exfiltrate)\b/.test(normalized);
 const hasSecret=secret.test(raw);
 const text=raw.replace(new RegExp(secret.source,'gi'),'[secret removed]').replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[email removed]').replace(/\+?\d[\d\s().-]{6,}\d/g,'[phone removed]');
 return {text,allow_remote:!hasSecret&&!suspicious,reason:hasSecret?'sensitive_input':suspicious?'instruction_like_input':null};
}
export function confidenceGate(decision,minimum=0.65) {
 const model=decision.mode==='jev',unknown=['other',undefined].includes(decision.topic??decision.key);
 const values=Object.values(decision.probabilities||{}),validDistribution=!Array.isArray(decision.probabilities)&&values.length>1&&values.every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&Math.abs(values.reduce((a,b)=>a+b,0)-1)<=0.01&&decision.probabilities[decision.topic??decision.key]===Math.max(...values);
 const sorted=validDistribution?[...values].sort((a,b)=>b-a):[];
 const probability_margin=validDistribution?sorted[0]-sorted[1]:null;
 const review_reason=!model?'local_result':unknown?'unknown_topic':!Number.isFinite(decision.confidence)||decision.confidence<0||decision.confidence>1?'invalid_confidence':!validDistribution?'invalid_probabilities':decision.confidence<minimum?'low_confidence':probability_margin<0.1?'ambiguous_probabilities':null;
 const requires_review=review_reason!==null;
 return {...decision,requires_review,gate:requires_review?'review':'suggestion',review_reason,probability_margin,policy_version:'musuroom-decision-2'};
}
export function guardedKnowledge(document) {
 const data=document.data,guard=guardInput([data.title,data.summary,data.body,data.limitation].join('\n'));
 return {guard,document:{...document,data:{...data,...Object.fromEntries(['title','summary','body','limitation'].map(key=>[key,guardInput(data[key]).text]))}}};
}
