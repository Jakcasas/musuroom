import { randomUUID } from 'node:crypto';
export function leadsRepository(db) {
  const byContact = db.prepare('SELECT id,status FROM sample_requests WHERE contact_normalized=?');
  const byId = db.prepare('SELECT * FROM sample_requests WHERE id=?');
  return {
    async register(input) {
      const existing = await byContact.get(input.contact_normalized);
      if (existing) return { id: existing.id, status: existing.status, repeated: true };
      const id = randomUUID();
      const result=await db.prepare(`INSERT INTO sample_requests(id,full_name,contact,contact_normalized,organization_type,dietary_preference,shipping_address,consent_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(contact_normalized) DO NOTHING`).run(id, input.full_name, input.contact, input.contact_normalized, input.organization_type, input.dietary_preference, input.shipping_address, new Date().toISOString());
      if(!result.changes)return {...await byContact.get(input.contact_normalized),repeated:true};
      return { id, status: 'PENDING', repeated: false };
    },
    list(status, limit, offset) {
      return status ? db.prepare('SELECT id,full_name,contact,organization_type,dietary_preference,shipping_address,status,consent_at,created_at,updated_at FROM sample_requests WHERE status=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(status, limit, offset)
        : db.prepare('SELECT id,full_name,contact,organization_type,dietary_preference,shipping_address,status,consent_at,created_at,updated_at FROM sample_requests ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(limit, offset);
    },
    get: id => byId.get(id),
    async updateStatus(id, status) {
      await db.prepare('UPDATE sample_requests SET status=?,updated_at=? WHERE id=?').run(status,new Date().toISOString(),id);
      return byId.get(id);
    },
    remove: async id => (await db.prepare('DELETE FROM sample_requests WHERE id=?').run(id)).changes
  };
}
