CREATE TABLE schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text);
CREATE TABLE sources (
  id INTEGER PRIMARY KEY,
  citation TEXT NOT NULL,
  url TEXT NOT NULL CHECK(url LIKE 'https://%' OR url LIKE 'index.html#%'),
  publication_year INTEGER NOT NULL CHECK(publication_year BETWEEN 1800 AND 2200),
  evidence_type TEXT NOT NULL,
  access_scope TEXT NOT NULL,
  reviewed_at TEXT NOT NULL
);
CREATE TABLE knowledge_articles (
  id TEXT PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  application TEXT NOT NULL,
  limitation TEXT NOT NULL,
  tags_json TEXT NOT NULL CHECK(jsonb_typeof(tags_json::jsonb) IS NOT NULL),
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);
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
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);
CREATE INDEX idx_batches_created ON batches(created_at DESC);

CREATE TABLE sensory_evaluations (
  id TEXT PRIMARY KEY,
  session_code TEXT NOT NULL CHECK(length(session_code) BETWEEN 3 AND 50),
  sample_code TEXT NOT NULL CHECK(length(sample_code) BETWEEN 3 AND 50),
  submission_key TEXT,
  tester_type TEXT NOT NULL CHECK(tester_type IN ('JUDGE','STUDENT','CONSUMER','OTHER')),
  color_score INTEGER NOT NULL CHECK(color_score BETWEEN 1 AND 9),
  aroma_score INTEGER NOT NULL CHECK(aroma_score BETWEEN 1 AND 9),
  umami_taste_score INTEGER NOT NULL CHECK(umami_taste_score BETWEEN 1 AND 9),
  aftertaste_score INTEGER NOT NULL CHECK(aftertaste_score BETWEEN 1 AND 9),
  overall_acceptance INTEGER NOT NULL CHECK(overall_acceptance BETWEEN 1 AND 9),
  comments TEXT NOT NULL DEFAULT '' CHECK(length(comments) <= 1000),
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);
CREATE INDEX idx_sensory_session_sample ON sensory_evaluations(session_code,sample_code,created_at DESC);
CREATE UNIQUE INDEX idx_sensory_submission_key ON sensory_evaluations(session_code,sample_code,submission_key) WHERE submission_key IS NOT NULL;

CREATE TABLE sample_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL CHECK(length(full_name) BETWEEN 2 AND 100),
  contact TEXT NOT NULL CHECK(length(contact) BETWEEN 5 AND 100),
  contact_normalized TEXT NOT NULL UNIQUE,
  organization_type TEXT NOT NULL CHECK(organization_type IN ('INDIVIDUAL','RESTAURANT','FOOD_BUSINESS','OTHER')),
  dietary_preference TEXT NOT NULL DEFAULT 'NONE' CHECK(dietary_preference IN ('NONE','VEGAN','LOW_SODIUM','FAMILY','OTHER')),
  shipping_address TEXT NOT NULL DEFAULT '' CHECK(length(shipping_address) <= 300),
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','FEEDBACK_RECEIVED','CANCELLED')),
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);
CREATE INDEX idx_sample_requests_status_created ON sample_requests(status,created_at DESC);

CREATE TABLE judge_accounts (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 2 AND 100),
 role TEXT NOT NULL CHECK(role IN ('JUDGE','ADMIN')), enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
 secret_salt TEXT NOT NULL, secret_hash TEXT NOT NULL, expires_at BIGINT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);
CREATE TABLE auth_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES judge_accounts(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL, created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, last_seen BIGINT NOT NULL
);
CREATE INDEX idx_sessions_account ON auth_sessions(account_id);
CREATE INDEX idx_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE quality_documents (
 id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 200),
 doc_type TEXT NOT NULL CHECK(doc_type IN ('BRIEF','SOP','COGS','COA','MEDIA','REPORT')),
 file_name TEXT NOT NULL UNIQUE, mime TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK(size_bytes>0),
 sha256 TEXT NOT NULL, evidence_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(evidence_status IN ('DRAFT','FINAL')),
 created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);
CREATE TABLE access_audit (
 id BIGSERIAL PRIMARY KEY, account_id TEXT, action TEXT NOT NULL, resource_id TEXT,
 created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

CREATE TABLE product_samples (
 id TEXT PRIMARY KEY, sample_code TEXT NOT NULL UNIQUE CHECK(length(sample_code) BETWEEN 3 AND 50),
 label TEXT NOT NULL CHECK(length(label) BETWEEN 2 AND 120), origin TEXT NOT NULL CHECK(length(origin) BETWEEN 2 AND 500),
 process_notes TEXT NOT NULL DEFAULT '' CHECK(length(process_notes)<=2000),
 metrics_json TEXT NOT NULL CHECK(jsonb_typeof(metrics_json::jsonb) IS NOT NULL), nutrition_json TEXT NOT NULL CHECK(jsonb_typeof(nutrition_json::jsonb) IS NOT NULL),
 measured_at TEXT NOT NULL, evidence_document_id TEXT NOT NULL REFERENCES quality_documents(id),
 publication_status TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(publication_status IN ('PRIVATE','PUBLIC')),
 created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
);

-- Server-side Postgres connection only. No browser/anon access policies.
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE sources FROM PUBLIC;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE knowledge_articles FROM PUBLIC;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE batches FROM PUBLIC;
ALTER TABLE sensory_evaluations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE sensory_evaluations FROM PUBLIC;
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE sample_requests FROM PUBLIC;
ALTER TABLE judge_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE judge_accounts FROM PUBLIC;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE auth_sessions FROM PUBLIC;
ALTER TABLE quality_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE quality_documents FROM PUBLIC;
ALTER TABLE access_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE access_audit FROM PUBLIC;
ALTER TABLE product_samples ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE product_samples FROM PUBLIC;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE schema_migrations FROM PUBLIC;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE sources,knowledge_articles,batches,sensory_evaluations,sample_requests,judge_accounts,auth_sessions,quality_documents,access_audit,product_samples,schema_migrations FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE sources,knowledge_articles,batches,sensory_evaluations,sample_requests,judge_accounts,auth_sessions,quality_documents,access_audit,product_samples,schema_migrations FROM authenticated; END IF; END $$;
INSERT INTO schema_migrations(version) VALUES('pg-001-musuroom-1');
