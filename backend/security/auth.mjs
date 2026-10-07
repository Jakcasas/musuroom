import { operation } from '../db/operation.mjs';
import { randomBytes, randomUUID, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const cookieName = 'musuroom_session';
const digest = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export async function createAccount(db, { name, role = 'JUDGE', days = 7 }) {
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 || !['JUDGE','ADMIN'].includes(role) || !Number.isInteger(days) || days < 1 || days > 30) throw new Error('Invalid access account options');
  const id = randomUUID(); const secret = randomBytes(24).toString('base64url'); const salt = randomBytes(16).toString('hex');
  const hash = (await derive(secret, salt, 64)).toString('hex');
  const expires = Date.now() + days * 86400000;
  await operation(db,'accounts.insert',()=>db.prepare('INSERT INTO judge_accounts(id,display_name,role,secret_salt,secret_hash,expires_at) VALUES(?,?,?,?,?,?)')).run(id, name.trim(), role, salt, hash, expires);
  return { account_id: id, display_name: name.trim(), role, access_code: `${id}.${secret}`, expires_at: new Date(expires).toISOString() };
}
export async function rotateJudgeAccessCode(db,accountId,code) {
  if(typeof code!=='string'||code.length<12||code.length>100||code!==code.trim()||/[\u0000-\u001f\u007f]/.test(code))throw new Error('Judge code must contain 12–100 characters without outer whitespace or control characters.');
  const salt=randomBytes(16).toString('hex'),hash=(await derive(code,salt,64)).toString('hex');
  if(db.dialect==='mongodb')return db.transaction(async()=>{
    const account=await db.operation('accounts.activeJudge').get(accountId,Date.now());
    if(!account)throw new Error('An active JUDGE account is required.');
    await db.operation('accounts.rotate').run(salt,hash,accountId);
    await db.operation('sessions.deleteAccount').run(accountId);
    await db.operation('audit.insert').run(accountId,'JUDGE_CODE_ROTATED');
    return{account_id:account.id,display_name:account.display_name,role:'JUDGE',access_code:code,expires_at:new Date(account.expires_at).toISOString()};
  });
  await db.exec('BEGIN IMMEDIATE');
  try {
    const account=await operation(db,'accounts.activeJudge',()=>db.prepare("SELECT id,display_name,role,expires_at FROM judge_accounts WHERE id=? AND role='JUDGE' AND enabled=1 AND expires_at>?"+(db.dialect==='postgres'?' FOR UPDATE':''))).get(accountId,Date.now());
    if(!account)throw new Error('An active JUDGE account is required.');
    await operation(db,'accounts.rotate',()=>db.prepare("UPDATE judge_accounts SET secret_salt=?,secret_hash=? WHERE id=? AND role='JUDGE'")).run(salt,hash,accountId);
    await operation(db,'sessions.deleteAccount',()=>db.prepare('DELETE FROM auth_sessions WHERE account_id=?')).run(accountId);
    await operation(db,'audit.insert',()=>db.prepare('INSERT INTO access_audit(account_id,action) VALUES(?,?)')).run(accountId,'JUDGE_CODE_ROTATED');
    await db.exec('COMMIT');
    return {account_id:account.id,display_name:account.display_name,role:'JUDGE',access_code:code,expires_at:new Date(account.expires_at).toISOString()};
  } catch(error) {await db.exec('ROLLBACK');throw error;}
}
export async function bootstrapAccessAccounts(db,config) {
  const expires = Date.now() + 30 * 86400000;
  const accounts = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'Ban Giám Khảo Musuroom', role: 'JUDGE', code: config.judgeBootstrapCode, expires },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Quản trị Musuroom', role: 'ADMIN', code: config.adminBootstrapCode, expires }
  ].filter(account => account.code);
  for (const account of accounts) {
    const current=await operation(db,'accounts.get',()=>db.prepare('SELECT * FROM judge_accounts WHERE id=?')).get(account.id);
    // Do not reset expiry, re-enable revoked accounts, or invalidate sessions on
    // each deployment. Only an explicitly changed secret rotates credentials.
    if(current){
      const expected=(await derive(account.code,current.secret_salt,64)).toString('hex');
      if(equal(expected,current.secret_hash))continue;
    }
    const salt = randomBytes(16).toString('hex');
    const hash = (await derive(account.code, salt, 64)).toString('hex');
    await operation(db,'accounts.bootstrap',()=>db.prepare(`INSERT INTO judge_accounts(id,display_name,role,secret_salt,secret_hash,expires_at,enabled)
      VALUES(?,?,?,?,?,?,1)
      ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,role=excluded.role,secret_salt=excluded.secret_salt,secret_hash=excluded.secret_hash,expires_at=excluded.expires_at,enabled=1`)).run(account.id, account.name, account.role, salt, hash, account.expires);
  }
  return accounts.length;
}
export function createSecurity(db, config, now = Date.now) {
  const failures = new Map(); let activeLogins = 0; let cleanedAt=now();
  const name = config.production ? '__Host-musuroom_session' : cookieName;
  const audit = async (id, action, resource = null) => operation(db,'audit.insert',()=>db.prepare('INSERT INTO access_audit(account_id,action,resource_id) VALUES(?,?,?)')).run(id, action, resource);
  function rawToken(req) {
    const value = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1);
    return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  async function getSession(req) {
    const token = rawToken(req); if (!token) return null;
    const row = await operation(db,'sessions.get',()=>db.prepare('SELECT s.*,a.display_name,a.role,a.enabled,a.expires_at AS account_expiry FROM auth_sessions s JOIN judge_accounts a ON a.id=s.account_id WHERE s.token_hash=?')).get(digest(token));
    if (!row) return null;
    if (!row.enabled || row.account_expiry <= now() || row.expires_at <= now() || row.last_seen + config.authIdleMs <= now()) {
      await operation(db,'sessions.delete',()=>db.prepare('DELETE FROM auth_sessions WHERE token_hash=?')).run(row.token_hash); return null;
    }
    await operation(db,'sessions.touch',()=>db.prepare('UPDATE auth_sessions SET last_seen=? WHERE token_hash=?')).run(now(), row.token_hash);
    return row;
  }
  const cookie = token => `${name}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(config.authSessionMs / 1000)}${config.production?'; Secure':''}`;
  const clearCookie = res => res.set('Set-Cookie', `${name}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${config.production?'; Secure':''}`);
  const bearer = req => config.writeToken && /^Bearer /.test(req.headers.authorization || '') && equal(req.headers.authorization.slice(7), config.writeToken);
  const requireRoles = roles => async (req, res, next) => {
    if (bearer(req)) { req.principal = { role: 'ADMIN', account_id: null }; return next(); }
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: 'authentication_required' });
    if (!roles.includes(session.role)) return res.status(403).json({ error: 'insufficient_role' });
    if (!['GET','HEAD'].includes(req.method) && !equal(req.headers['x-csrf-token'] || '', session.csrf_token)) return res.status(403).json({ error: 'csrf_required' });
    req.principal = session; res.set('Cache-Control','no-store'); next();
  };
  const publicSession = session => ({ user: { id: session.account_id, name: session.display_name, role: session.role }, expires_at: new Date(session.expires_at).toISOString(), csrf_token: session.csrf_token });
  async function login(req, res) {
    res.set('Cache-Control','no-store');
    const bucket = req.ip || req.socket.remoteAddress || 'local';
    if(now()-cleanedAt>=60000){for(const[ip,b]of failures)if(b.until<=now())failures.delete(ip);cleanedAt=now();}
    if(!failures.has(bucket) && failures.size>=5000)return res.status(429).set('Retry-After','600').json({error:'login_rate_limit'});
    const failed = failures.get(bucket);
    if (failed && failed.until > now() && failed.count >= config.authLoginLimit) return res.status(429).set('Retry-After','600').json({ error: 'login_rate_limit' });
    if (activeLogins >= 3) return res.status(429).set('Retry-After','5').json({ error: 'login_busy' });
    const value = req.body?.access_code;
    const match = typeof value === 'string' && value.length <= 100 ? value.trim().match(/^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/i) : null;
    const passwordOnlyEnabled=config.defaultJudgeAccountId||config.judgeBootstrapCode||config.adminBootstrapCode;
    const defaultCode=!match&&passwordOnlyEnabled&&typeof value==='string'&&value.trim().length>=12&&value.length<=100&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():null;
    activeLogins++;
    let valid = false; let account;
    try {
      if(match)account = await operation(db,'accounts.get',()=>db.prepare('SELECT * FROM judge_accounts WHERE id=?')).get(match[1]);
      else if(defaultCode) {
        const candidates = [
          config.defaultJudgeAccountId && { id: config.defaultJudgeAccountId, role: 'JUDGE' },
          config.judgeBootstrapCode && { id: '11111111-1111-4111-8111-111111111111', role: 'JUDGE' },
          config.adminBootstrapCode && { id: '22222222-2222-4222-8222-222222222222', role: 'ADMIN' }
        ].filter(Boolean);
        for(const entry of candidates){
          const candidate = await operation(db,'accounts.get',()=>db.prepare('SELECT * FROM judge_accounts WHERE id=?')).get(entry.id);
          const computed = (await derive(defaultCode, candidate?.secret_salt || '00000000000000000000000000000000', 64)).toString('hex');
          if(candidate?.role === entry.role && candidate.enabled && candidate.expires_at > now() && equal(computed, candidate.secret_hash)){account=candidate;valid=true;break;}
        }
      }
      if(match){const computed = (await derive(match[2], account?.secret_salt || '00000000000000000000000000000000', 64)).toString('hex');valid = account && account.enabled && account.expires_at > now() && equal(computed, account.secret_hash);}
    } finally { activeLogins--; }
    if (!valid) {
      const current = failures.get(bucket);
      failures.set(bucket, { count: current && current.until > now() ? current.count + 1 : 1, until: current && current.until > now() ? current.until : now() + 600000 });
      await audit(account?.id || null, 'LOGIN_FAILED');
      return res.status(401).json({ error: 'invalid_or_expired_access_code' });
    }
    failures.delete(bucket);
    const previous = rawToken(req); if (previous) await operation(db,'sessions.delete',()=>db.prepare('DELETE FROM auth_sessions WHERE token_hash=?')).run(digest(previous));
    await operation(db,'sessions.prune',()=>db.prepare('DELETE FROM auth_sessions WHERE expires_at<=? OR last_seen<=?')).run(now(), now() - config.authIdleMs);
    const token = randomBytes(32).toString('base64url'); const csrf = randomBytes(24).toString('base64url');
    const expiry = Math.min(now() + config.authSessionMs, account.expires_at);
    // Recheck the credential snapshot so rotation/revocation during scrypt cannot create a stale session.
    const inserted=await operation(db,'sessions.insert',()=>db.prepare('INSERT INTO auth_sessions(token_hash,account_id,csrf_token,created_at,expires_at,last_seen) SELECT ?,id,?,?,?,? FROM judge_accounts WHERE id=? AND secret_hash=? AND enabled=1 AND expires_at=? AND role=?')).run(digest(token),csrf,now(),expiry,now(),account.id,account.secret_hash,account.expires_at,account.role);
    if(!inserted.changes){await audit(account.id,'LOGIN_FAILED');return res.status(401).json({error:'invalid_or_expired_access_code'});}
    await audit(account.id, 'LOGIN_OK'); res.set('Set-Cookie', cookie(token));
    res.json(publicSession({ account_id: account.id, display_name: account.display_name, role: account.role, expires_at: expiry, csrf_token: csrf }));
  }
  async function session(req, res) {
    res.set('Cache-Control','no-store'); const found = await getSession(req);
    if (!found) { clearCookie(res); return res.status(401).json({ error: 'authentication_required' }); }
    res.json(publicSession(found));
  }
  async function logout(req, res) {
    const token = rawToken(req); if (token) await operation(db,'sessions.delete',()=>db.prepare('DELETE FROM auth_sessions WHERE token_hash=?')).run(digest(token));
    await audit(req.principal.account_id, 'LOGOUT'); clearCookie(res); res.status(204).end();
  }
  return { login, session, logout, audit, requireAdmin: requireRoles(['ADMIN']), requireReviewer: requireRoles(['JUDGE','ADMIN']) };
}
