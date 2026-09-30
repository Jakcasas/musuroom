// One container/replica. Bounded per-IP windows; no raw IPs are stored in the database.
export function rateLimit(limit,error,now=Date.now){
 const buckets=new Map();let cleanedAt=now();
 return(req,res,next)=>{
  const current=now();if(current-cleanedAt>=60000){for(const[ip,b]of buckets)if(b.until<=current)buckets.delete(ip);cleanedAt=current;}
  const ip=req.ip || req.socket?.remoteAddress || 'local';let bucket=buckets.get(ip);
  if(!bucket || bucket.until<=current){if(!bucket && buckets.size>=5000)return res.status(429).set('Retry-After','60').json({error});bucket={count:0,until:current+60000};buckets.set(ip,bucket);}
  if(++bucket.count>limit)return res.status(429).set('Retry-After',String(Math.max(1,Math.ceil((bucket.until-current)/1000)))).json({error});
  next();
 };
}
