import { operation } from '../db/operation.mjs';
import { randomUUID } from 'node:crypto';
export function batchRepository(db) {
  return {
    list: (limit, offset) => operation(db,'batches.list',()=>db.prepare('SELECT * FROM batches ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?')).all(limit, offset),
    get: id => operation(db,'batches.get',()=>db.prepare('SELECT * FROM batches WHERE id=?')).get(id),
    create: async (input, result) => {
      const id = randomUUID();
      await operation(db,'batches.insert',()=>db.prepare(`INSERT INTO batches(id,name,mass_kg,reject_percent,initial_moisture_percent,final_moisture_percent,loss_percent,accepted_kg,powder_kg,yield_percent,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)).run(id, input.name, input.mass, input.reject, input.initial, input.final, input.loss, result.accepted, result.powder, result.yield, input.notes || '');
      return operation(db,'batches.get',()=>db.prepare('SELECT * FROM batches WHERE id=?')).get(id);
    }
  };
}
