import { randomUUID } from 'node:crypto';
import { criteria } from '../services/sensory-metrics.mjs';
export function sensoryRepository(db) {
  const getByKey = db.prepare('SELECT * FROM sensory_evaluations WHERE session_code=? AND sample_code=? AND submission_key=?');
  const insert = db.prepare(`INSERT INTO sensory_evaluations(id,session_code,sample_code,submission_key,tester_type,color_score,aroma_score,umami_taste_score,aftertaste_score,overall_acceptance,comments) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`);
  const list = db.prepare('SELECT * FROM sensory_evaluations WHERE session_code=? AND sample_code=? ORDER BY created_at,id');
  const distribution = db.prepare(db.dialect === 'postgres' ? 'SELECT * FROM public.musuroom_sensory_distribution(?,?)' : `
    WITH selected AS (
      SELECT tester_type,${criteria.map(c => c.key).join(',')}
      FROM sensory_evaluations WHERE session_code=? AND sample_code=?
    ), observations AS (
      ${criteria.map(c => `SELECT '${c.key}' AS criterion,${c.key} AS score,NULL AS tester_type FROM selected`).join(' UNION ALL ')}
      UNION ALL SELECT 'tester_type',NULL,tester_type FROM selected
    )
    SELECT criterion,score,tester_type,COUNT(*) AS n FROM observations GROUP BY criterion,score,tester_type
  `);
  return {
    async submit(input) {
      const existing = input.submission_key ? await getByKey.get(input.session_code, input.sample_code, input.submission_key) : null;
      if (existing) {
        const same = ['tester_type','color_score','aroma_score','umami_taste_score','aftertaste_score','overall_acceptance','comments'].every(key => existing[key] === input[key]);
        return same ? { row: existing, repeated: true } : { conflict: true };
      }
      const id = randomUUID();
      const result=await insert.run(id, input.session_code, input.sample_code, input.submission_key, input.tester_type, input.color_score, input.aroma_score, input.umami_taste_score, input.aftertaste_score, input.overall_acceptance, input.comments);
      if(!result.changes){const row=await getByKey.get(input.session_code,input.sample_code,input.submission_key);const same=row && ['tester_type','color_score','aroma_score','umami_taste_score','aftertaste_score','overall_acceptance','comments'].every(key=>row[key]===input[key]);return same?{row,repeated:true}:{conflict:true};}
      return { row: await db.prepare('SELECT * FROM sensory_evaluations WHERE id=?').get(id), repeated: false };
    },
    list: (sessionCode, sampleCode) => list.all(sessionCode, sampleCode),
    distribution: (sessionCode, sampleCode) => distribution.all(sessionCode, sampleCode)
  };
}
