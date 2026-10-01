import { normalize } from '../../dist/core.js';
// Heuristics reduce exposure; authentication and authorization remain deterministic.
export function guardInput(value) {
 const raw=String(value??'');
 const secret=/(?:Bearer\s+[A-Za-z0-9._-]{12,}|(?:api[_ -]?key|password|mat khau)\s*[:=]\s*\S{6,})/i;
 const normalized=normalize(raw);
 const suspicious=/\b(ignore (?:all |the )?(?:previous|system) instructions|reveal (?:the )?system prompt|bo qua (?:tat ca )?(?:huong dan|chi dan)|grant admin|exfiltrate)\b/.test(normalized);
 const hasSecret=secret.test(raw);
 const text=raw.replace(new RegExp(secret.source,'gi'),'[secret removed]').replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[email removed]').replace(/\+?\d[\d\s().-]{6,}\d/g,'[phone removed]');
 return {text,allow_remote:!hasSecret&&!suspicious,reason:hasSecret?'sensitive_input':suspicious?'instruction_like_input':null};
}
export function confidenceGate(decision,minimum=0.65) {
 const model=decision.mode==='jev',unknown=['other',undefined].includes(decision.topic??decision.key);
 const requires_review=!model||unknown||!Number.isFinite(decision.confidence)||decision.confidence<minimum;
 return {...decision,requires_review,gate:requires_review?'review':'suggestion',policy_version:'musuroom-decision-1'};
}
export function guardedKnowledge(document) {
 const data=document.data,guard=guardInput([data.title,data.summary,data.body,data.limitation].join('\n'));
 return {guard,document:{...document,data:{...data,...Object.fromEntries(['title','summary','body','limitation'].map(key=>[key,guardInput(data[key]).text]))}}};
}
