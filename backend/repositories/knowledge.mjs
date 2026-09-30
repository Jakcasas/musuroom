import { searchArticles } from '../../dist/core.js';
export function knowledgeRepository(db) {
  const query = db.prepare(`SELECT a.*, s.citation, s.url, s.publication_year, s.evidence_type, s.access_scope, s.reviewed_at FROM knowledge_articles a JOIN sources s ON a.source_id=s.id ORDER BY s.id,a.id`);
  const all = async () => (await query.all()).map(r => ({ id: r.id, ref: r.source_id, title: r.title, category: r.category, summary: r.summary, body: r.body, application: r.application, limitation: r.limitation, tags: JSON.parse(r.tags_json), source: r.citation, url: r.url, year: String(r.publication_year), type: r.evidence_type, access: r.access_scope, reviewedAt: r.reviewed_at }));
  return { all, search: async (q, category) => searchArticles(await all(), q, category), get: async id => (await all()).find(a => a.id === id) };
}
