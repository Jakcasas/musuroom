// One half-open probe after cooldown; no request payload or credentials retained.
export function circuitBreaker({now=Date.now,threshold=3,cooldown=30000}={}){
 let failures=0,until=0,probe=false;
 return {
  enter(){if(until>now()||probe)return false;if(until)probe=true;return true;},
  settle(reason){probe=false;if(!reason){failures=0;until=0;return;}if(['jev_auth_failed','jev_rate_limited','provider_unavailable','invalid_response'].includes(reason)){failures++;if(reason==='jev_auth_failed'||failures>=threshold)until=now()+(reason==='jev_auth_failed'?300000:Math.min(120000,cooldown*2**Math.min(2,failures-threshold)));}},
  retryAfter(){return Math.max(1,Math.ceil((until-now())/1000));}
 };
}
