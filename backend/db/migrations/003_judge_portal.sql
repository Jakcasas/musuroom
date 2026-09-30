CREATE TABLE judge_accounts (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 2 AND 100),
 role TEXT NOT NULL CHECK(role IN ('JUDGE','ADMIN')), enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
 secret_salt TEXT NOT NULL, secret_hash TEXT NOT NULL, expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE auth_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES judge_accounts(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, last_seen INTEGER NOT NULL
) STRICT;
CREATE INDEX idx_sessions_account ON auth_sessions(account_id);
CREATE INDEX idx_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE quality_documents (
 id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 200),
 doc_type TEXT NOT NULL CHECK(doc_type IN ('BRIEF','SOP','COGS','COA','MEDIA','REPORT')),
 file_name TEXT NOT NULL UNIQUE, mime TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK(size_bytes>0),
 sha256 TEXT NOT NULL, evidence_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(evidence_status IN ('DRAFT','FINAL')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE access_audit (
 id INTEGER PRIMARY KEY, account_id TEXT, action TEXT NOT NULL, resource_id TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
