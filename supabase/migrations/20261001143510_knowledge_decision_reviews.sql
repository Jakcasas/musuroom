CREATE TABLE public.knowledge_decision_reviews (
 article_id TEXT PRIMARY KEY REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
 source_revision BIGINT NOT NULL CHECK(source_revision>0),
 content_hash TEXT NOT NULL CHECK(length(content_hash)=64),
 decision_version TEXT NOT NULL,
 decision_json TEXT NOT NULL CHECK(jsonb_typeof(decision_json::jsonb)='object'),
 review_status TEXT NOT NULL CHECK(review_status IN ('pending','confirmed','rejected')),
 updated_at TEXT NOT NULL,
 reviewed_at TEXT
);
ALTER TABLE public.knowledge_decision_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.knowledge_decision_reviews FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.knowledge_decision_reviews FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.knowledge_decision_reviews FROM authenticated; END IF;
END $$;
INSERT INTO public.schema_migrations(version) VALUES('pg-006-knowledge-decision-reviews') ON CONFLICT(version) DO NOTHING;
