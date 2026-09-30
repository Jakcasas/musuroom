import { randomUUID } from 'node:crypto';
export function leadsRepository(db) {
  const byContact = db.prepare('SELECT id,status FROM sample_requests WHERE contact_normalized=?');
  const byId = db.prepare('SELECT * FROM sample_requests WHERE id=?');
  return {
    register(input) {
      const existing = byContact.get(input.contact_normalized);
      if (existing) return { id: existing.id, status: existing.status, repeated: true };
      const id = randomUUID();
      db.prepare(`INSERT INTO sample_requests(id,full_name,contact,contact_normalized,organization_type,dietary_preference,shipping_address,consent_at) VALUES(?,?,?,?,?,?,?,?)`).run(id, input.full_name, input.contact, input.contact_normalized, input.organization_type, input.dietary_preference, input.shipping_address, new Date().toISOString());
      return { id, status: 'PENDING', repeated: false };
    },
    list(status, limit, offset) {
      return status ? db.prepare('SELECT id,full_name,contact,organization_type,dietary_preference,shipping_address,status,consent_at,created_at,updated_at FROM sample_requests WHERE status=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(status, limit, offset)
        : db.prepare('SELECT id,full_name,contact,organization_type,dietary_preference,shipping_address,status,consent_at,created_at,updated_at FROM sample_requests ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(limit, offset);
    },
    get: id => byId.get(id),
    updateStatus(id, status) {
      db.prepare("UPDATE sample_requests SET status=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(status, id);
      return byId.get(id);
    },
    remove: id => db.prepare('DELETE FROM sample_requests WHERE id=?').run(id).changes
  };
}
