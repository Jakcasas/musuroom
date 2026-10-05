CREATE SCHEMA IF NOT EXISTS extensions;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_available_extensions WHERE name='vector') THEN
  CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
  CREATE TABLE public.research_vectors (
   record_id TEXT PRIMARY KEY REFERENCES public.research_records(id),
   source_revision INTEGER NOT NULL CHECK(source_revision>0),
   model TEXT NOT NULL CHECK(length(model) BETWEEN 1 AND 100),
   embedding extensions.vector(384) NOT NULL
  );
  ALTER TABLE public.research_vectors ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.research_vectors FROM PUBLIC;
DO $roles$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.research_vectors FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.research_vectors FROM authenticated; END IF; END $roles$;
 END IF;
END $$;
INSERT INTO public.schema_migrations(version) VALUES('pg-008-research-vectors') ON CONFLICT(version) DO NOTHING;
