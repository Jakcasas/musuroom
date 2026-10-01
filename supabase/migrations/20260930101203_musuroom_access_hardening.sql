-- Cover the evidence foreign key without changing existing data.
CREATE INDEX IF NOT EXISTS idx_product_samples_evidence
ON public.product_samples(evidence_document_id);

-- Private audit sequence is used only by the application server.
REVOKE ALL ON SEQUENCE public.access_audit_id_seq FROM PUBLIC;

-- Supabase may provision rls_auto_enable() as an event-trigger function.
-- Keep the function and its trigger; remove browser roles' EXECUTE grants.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON SEQUENCE public.access_audit_id_seq FROM anon;
    IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
      REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
    END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON SEQUENCE public.access_audit_id_seq FROM authenticated;
    IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
      REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
    END IF;
  END IF;
END $$;
INSERT INTO public.schema_migrations(version) VALUES('pg-002-access-hardening') ON CONFLICT(version) DO NOTHING;
