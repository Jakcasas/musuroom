import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { articles } from '../../dist/knowledge-data.js';
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 5000 });
  try {
    db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP) STRICT');
    const directory = resolve(import.meta.dirname, 'migrations');
    for (const name of readdirSync(directory).filter(x => x.endsWith('.sql')).sort()) {
      if (db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(name)) continue;
      db.exec('BEGIN IMMEDIATE');
      try { db.exec(readFileSync(resolve(directory, name), 'utf8')); db.prepare('INSERT INTO schema_migrations(version) VALUES (?)').run(name); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    seedDatabase(db);
    return db;
  } catch (error) { db.close(); throw error; }
}
export function seedDatabase(db) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const source = db.prepare('INSERT OR IGNORE INTO sources(id,citation,url,publication_year,evidence_type,access_scope,reviewed_at) VALUES(?,?,?,?,?,?,?)');
    const article = db.prepare('INSERT OR IGNORE INTO knowledge_articles(id,source_id,title,category,summary,body,application,limitation,tags_json) VALUES(?,?,?,?,?,?,?,?,?)');
    for (const a of articles) {
      source.run(a.ref, a.source, a.url, Number(a.year), a.type, a.access, '2026-09-30');
      article.run(a.id, a.ref, a.title, a.category, a.summary, a.body, a.application, a.limitation, JSON.stringify(a.tags));
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
