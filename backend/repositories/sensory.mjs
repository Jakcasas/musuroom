import { randomUUID } from 'node:crypto';
export function sensoryRepository(db) {
  const getByKey = db.prepare('SELECT * FROM sensory_evaluations WHERE session_code=? AND sample_code=? AND submission_key=?');
  const insert = db.prepare(`INSERT INTO sensory_evaluations(id,session_code,sample_code,submission_key,tester_type,color_score,aroma_score,umami_taste_score,aftertaste_score,overall_acceptance,comments) VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
  const list = db.prepare('SELECT * FROM sensory_evaluations WHERE session_code=? AND sample_code=? ORDER BY created_at,id');
  return {
    submit(input) {
      const existing = input.submission_key ? getByKey.get(input.session_code, input.sample_code, input.submission_key) : null;
      if (existing) {
        const same = ['tester_type','color_score','aroma_score','umami_taste_score','aftertaste_score','overall_acceptance','comments'].every(key => existing[key] === input[key]);
        return same ? { row: existing, repeated: true } : { conflict: true };
      }
      const id = randomUUID();
      insert.run(id, input.session_code, input.sample_code, input.submission_key, input.tester_type, input.color_score, input.aroma_score, input.umami_taste_score, input.aftertaste_score, input.overall_acceptance, input.comments);
      return { row: db.prepare('SELECT * FROM sensory_evaluations WHERE id=?').get(id), repeated: false };
    },
    list: (sessionCode, sampleCode) => list.all(sessionCode, sampleCode)
  };
}
