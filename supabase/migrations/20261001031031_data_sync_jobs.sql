-- Identifiers only. Server owns both the SQL source and MongoDB projections.
CREATE TABLE public.data_sync_jobs (
 job_key TEXT PRIMARY KEY, resource_type TEXT NOT NULL CHECK(resource_type IN ('knowledge','sensory','product')),
 resource_id TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
 synced_revision INTEGER NOT NULL DEFAULT 0 CHECK(synced_revision>=0),
 attempts INTEGER NOT NULL DEFAULT 0, last_error_code TEXT,
 updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
);
CREATE INDEX idx_data_sync_pending ON public.data_sync_jobs(job_key) WHERE synced_revision<revision;
CREATE TABLE public.data_sync_state (
 id TEXT PRIMARY KEY CHECK(id='mongo'),lock_owner TEXT NOT NULL DEFAULT '',lease_until BIGINT NOT NULL DEFAULT 0,
 last_completed_at TEXT,last_error_code TEXT,last_synced_count INTEGER NOT NULL DEFAULT 0
);
INSERT INTO public.data_sync_state(id) VALUES('mongo');
ALTER TABLE public.data_sync_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.data_sync_state FROM PUBLIC;
ALTER TABLE public.data_sync_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.data_sync_jobs FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE public.data_sync_jobs,public.data_sync_state FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE public.data_sync_jobs,public.data_sync_state FROM authenticated; END IF;
END $$;
CREATE FUNCTION public.musuroom_enqueue_sync(p_type text,p_id text) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 INSERT INTO public.data_sync_jobs(job_key,resource_type,resource_id) VALUES(p_type||':'||p_id,p_type,p_id)
 ON CONFLICT(job_key) DO UPDATE SET revision=public.data_sync_jobs.revision+1,attempts=0,last_error_code=NULL,
 updated_at=to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;
CREATE FUNCTION public.musuroom_queue_changed_data() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item record;
BEGIN
 IF TG_TABLE_NAME='knowledge_articles' THEN
  PERFORM public.musuroom_enqueue_sync('knowledge',CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END);
 ELSIF TG_TABLE_NAME='sources' THEN
  FOR item IN SELECT id FROM public.knowledge_articles WHERE source_id=NEW.id LOOP PERFORM public.musuroom_enqueue_sync('knowledge',item.id); END LOOP;
 ELSIF TG_TABLE_NAME='sensory_evaluations' THEN
  IF TG_OP<>'INSERT' THEN PERFORM public.musuroom_enqueue_sync('sensory',OLD.session_code||':'||OLD.sample_code); END IF;
  IF TG_OP<>'DELETE' THEN PERFORM public.musuroom_enqueue_sync('sensory',NEW.session_code||':'||NEW.sample_code); END IF;
 ELSIF TG_TABLE_NAME='product_samples' THEN
  PERFORM public.musuroom_enqueue_sync('product',CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END);
 ELSIF TG_TABLE_NAME='quality_documents' THEN
  FOR item IN SELECT id FROM public.product_samples WHERE evidence_document_id=NEW.id LOOP PERFORM public.musuroom_enqueue_sync('product',item.id); END LOOP;
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.musuroom_enqueue_sync(text,text),public.musuroom_queue_changed_data() FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON FUNCTION public.musuroom_enqueue_sync(text,text),public.musuroom_queue_changed_data() FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON FUNCTION public.musuroom_enqueue_sync(text,text),public.musuroom_queue_changed_data() FROM authenticated; END IF;
END $$;
CREATE TRIGGER sync_knowledge AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.musuroom_queue_changed_data();
CREATE TRIGGER sync_source AFTER UPDATE ON public.sources FOR EACH ROW EXECUTE FUNCTION public.musuroom_queue_changed_data();
CREATE TRIGGER sync_sensory AFTER INSERT OR UPDATE OR DELETE ON public.sensory_evaluations FOR EACH ROW EXECUTE FUNCTION public.musuroom_queue_changed_data();
CREATE TRIGGER sync_product AFTER INSERT OR UPDATE OR DELETE ON public.product_samples FOR EACH ROW EXECUTE FUNCTION public.musuroom_queue_changed_data();
CREATE TRIGGER sync_evidence AFTER UPDATE ON public.quality_documents FOR EACH ROW EXECUTE FUNCTION public.musuroom_queue_changed_data();
INSERT INTO public.data_sync_jobs(job_key,resource_type,resource_id) SELECT 'knowledge:'||id,'knowledge',id FROM public.knowledge_articles;
INSERT INTO public.data_sync_jobs(job_key,resource_type,resource_id) SELECT DISTINCT 'sensory:'||session_code||':'||sample_code,'sensory',session_code||':'||sample_code FROM public.sensory_evaluations;
INSERT INTO public.data_sync_jobs(job_key,resource_type,resource_id) SELECT 'product:'||id,'product',id FROM public.product_samples;


INSERT INTO public.schema_migrations(version) VALUES('pg-005-data-sync-jobs') ON CONFLICT(version) DO NOTHING;
