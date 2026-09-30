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
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
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
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX idx_sample_requests_status_created ON sample_requests(status,created_at DESC);
