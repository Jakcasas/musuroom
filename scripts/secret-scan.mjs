export function containsPrivateMaterial(content,secrets=[]){
 const bytes=Buffer.isBuffer(content)?content:Buffer.from(content);
 return secrets.some(secret=>typeof secret==='string'&&secret.length>12&&bytes.includes(Buffer.from(secret)))||/\bjev_[A-Za-z0-9_-]{24,}\b/.test(bytes.toString('utf8'));
}
