import { operation } from '../db/operation.mjs';
import { randomUUID } from 'node:crypto';
import { contactAliases } from '../services/sample-registration.mjs';
export function leadsRepository(db) {
  const byContact = operation(db,'leads.contact',()=>db.prepare('SELECT id,status FROM sample_requests WHERE contact_normalized IN (?,?,?) ORDER BY created_at,id LIMIT 1'));
  const byId = operation(db,'leads.get',()=>db.prepare('SELECT * FROM sample_requests WHERE id=?'));
  return {
    async register(input) {
      const existing = await byContact.get(...contactAliases(input.contact_normalized));
      if (existing) return { id: existing.id, status: existing.status, repeated: true };
      const id = randomUUID();
      const result=await operation(db,'leads.insert',()=>db.prepare(`INSERT INTO sample_requests(id,full_name,contact,contact_normalized,organization_type,dietary_preference,shipping_address,consent_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(contact_normalized) DO NOTHING`)).run(id, input.full_name, input.contact, input.contact_normalized, input.organization_type, input.dietary_preference, input.shipping_address, new Date().toISOString());
      if(!result.changes)return {...await byContact.get(...contactAliases(input.contact_normalized)),repeated:true};
      return { id, status: 'PENDING', repeated: false };
    },
    list(status, limit, offset) {
      return status ? operation(db,'leads.byStatus',()=>db.prepare('SELECT id,full_name,contact,organization_type,dietary_preference,shipping_address,status,consent_at,created_at,updated_at FROM sample_requests WHERE status=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?')).all(status, limit, offset)
        : operation(db,'leads.list',()=>db.prepare('SELECT id,full_name,contact,organization_type,dietary_preference,shipping_address,status,consent_at,created_at,updated_at FROM sample_requests ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?')).all(limit, offset);
    },
    get: id => byId.get(id),
    async updateStatus(id, status) {
      await operation(db,'leads.update',()=>db.prepare('UPDATE sample_requests SET status=?,updated_at=? WHERE id=?')).run(status,new Date().toISOString(),id);
      return byId.get(id);
    },
    remove: async id => (await operation(db,'leads.delete',()=>db.prepare('DELETE FROM sample_requests WHERE id=?')).run(id)).changes
  };
}
