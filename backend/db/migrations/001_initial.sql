CREATE TABLE sources (
  id INTEGER PRIMARY KEY,
  citation TEXT NOT NULL,
  url TEXT NOT NULL CHECK(url LIKE 'https://%' OR url LIKE 'index.html#%'),
  publication_year INTEGER NOT NULL CHECK(publication_year BETWEEN 1800 AND 2200),
  evidence_type TEXT NOT NULL,
  access_scope TEXT NOT NULL,
  reviewed_at TEXT NOT NULL
) STRICT;
CREATE TABLE knowledge_articles (
  id TEXT PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  application TEXT NOT NULL,
  limitation TEXT NOT NULL,
  tags_json TEXT NOT NULL CHECK(json_valid(tags_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX idx_articles_category ON knowledge_articles(category);
CREATE INDEX idx_articles_source ON knowledge_articles(source_id);
CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
  mass_kg REAL NOT NULL CHECK(mass_kg > 0 AND mass_kg <= 1000000),
  reject_percent REAL NOT NULL CHECK(reject_percent BETWEEN 0 AND 100),
  initial_moisture_percent REAL NOT NULL CHECK(initial_moisture_percent >= 0 AND initial_moisture_percent < 100),
  final_moisture_percent REAL NOT NULL CHECK(final_moisture_percent >= 0 AND final_moisture_percent <= initial_moisture_percent),
  loss_percent REAL NOT NULL CHECK(loss_percent BETWEEN 0 AND 100),
  accepted_kg REAL NOT NULL CHECK(accepted_kg >= 0),
  powder_kg REAL NOT NULL CHECK(powder_kg >= 0),
  yield_percent REAL NOT NULL CHECK(yield_percent BETWEEN 0 AND 100),
  formula_version TEXT NOT NULL DEFAULT 'mass-balance-1',
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 2000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX idx_batches_created ON batches(created_at DESC);
