const key='musuroom-survey-draft-v1';
export function draftStore(storage,now=Date.now){return{
 read(){try{const raw=storage.getItem(key);if(!raw||raw.length>16000)return null;const d=JSON.parse(raw);if(!d?.input?.submission_key||!Number.isFinite(d.saved_at)||now()-d.saved_at>7*86400000){storage.removeItem(key);return null;}return d.input;}catch{return null;}},
 save(input){const value=JSON.stringify({saved_at:now(),input});if(value.length>16000)throw Error('Phiếu quá dài để lưu trên máy.');storage.setItem(key,value);},
 clear(){storage.removeItem(key);}
};}
