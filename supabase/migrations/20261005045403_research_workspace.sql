CREATE TABLE research_records (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('sample','rubric','clause')),
 identity_key TEXT UNIQUE, title TEXT NOT NULL, data_json TEXT NOT NULL,
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)),
 public_token TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_research_kind ON research_records(kind,published,id);
CREATE TABLE research_scores (
 rubric_id TEXT NOT NULL REFERENCES research_records(id), sample_id TEXT NOT NULL REFERENCES research_records(id),
 judge_id TEXT NOT NULL REFERENCES judge_accounts(id), scores_json TEXT NOT NULL,
 total REAL NOT NULL CHECK(total>=0 AND total<=100), revision INTEGER NOT NULL CHECK(revision>0),
 sample_revision INTEGER NOT NULL, updated_at TEXT NOT NULL,
 PRIMARY KEY(rubric_id,sample_id,judge_id)
);
CREATE INDEX idx_research_score_sample ON research_scores(sample_id);
CREATE INDEX idx_research_score_judge ON research_scores(judge_id);

ALTER TABLE public.research_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.research_records FROM PUBLIC;
DO $roles$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.research_records FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.research_records FROM authenticated; END IF; END $roles$;

ALTER TABLE public.research_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.research_scores FROM PUBLIC;
DO $roles$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.research_scores FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.research_scores FROM authenticated; END IF; END $roles$;
INSERT INTO public.schema_migrations(version) VALUES('pg-007-research-workspace') ON CONFLICT(version) DO NOTHING;
