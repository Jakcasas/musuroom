-- At most 45 score bins + four tester categories per session/sample.
-- No comments, identifiers or contact information enter the aggregate result.
CREATE OR REPLACE FUNCTION public.musuroom_sensory_distribution(p_session text,p_sample text)
RETURNS TABLE(criterion text,score integer,tester_type text,n bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  WITH selected AS MATERIALIZED (
    SELECT s.tester_type,s.color_score,s.aroma_score,s.umami_taste_score,s.aftertaste_score,s.overall_acceptance
    FROM public.sensory_evaluations AS s
    WHERE s.session_code=p_session AND s.sample_code=p_sample
  ), observations AS (
    SELECT 'color_score'::text AS criterion,color_score AS score,NULL::text AS tester_type FROM selected
    UNION ALL SELECT 'aroma_score',aroma_score,NULL::text FROM selected
    UNION ALL SELECT 'umami_taste_score',umami_taste_score,NULL::text FROM selected
    UNION ALL SELECT 'aftertaste_score',aftertaste_score,NULL::text FROM selected
    UNION ALL SELECT 'overall_acceptance',overall_acceptance,NULL::text FROM selected
    UNION ALL SELECT 'tester_type',NULL::integer,tester_type FROM selected
  )
  SELECT o.criterion,o.score,o.tester_type,COUNT(*) FROM observations AS o
  GROUP BY o.criterion,o.score,o.tester_type;
$$;

REVOKE ALL ON FUNCTION public.musuroom_sensory_distribution(text,text) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON FUNCTION public.musuroom_sensory_distribution(text,text) FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON FUNCTION public.musuroom_sensory_distribution(text,text) FROM authenticated;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT EXECUTE ON FUNCTION public.musuroom_sensory_distribution(text,text) TO service_role;
  END IF;
END $$;
