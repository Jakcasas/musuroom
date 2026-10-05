-- Preserve old scores for comparison; validate every new score or correction.
ALTER TABLE public.research_scores ADD CONSTRAINT research_scores_shape
 CHECK (sample_revision > 0 AND jsonb_typeof(scores_json::jsonb) = 'array'
        AND jsonb_array_length(scores_json::jsonb) BETWEEN 1 AND 10);

CREATE FUNCTION public.musuroom_validate_research_score() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $function$
DECLARE rubric jsonb; current_revision integer; values_json jsonb; entry jsonb;
        criterion jsonb; i integer := 0; weight_sum numeric := 0; expected numeric := 0; weight numeric;
BEGIN
 SELECT data_json::jsonb INTO rubric FROM public.research_records WHERE id=NEW.rubric_id AND kind='rubric';
 SELECT revision INTO current_revision FROM public.research_records WHERE id=NEW.sample_id AND kind='sample' FOR SHARE;
 IF rubric IS NULL OR current_revision IS NULL THEN
  RAISE EXCEPTION 'Invalid research record kinds' USING ERRCODE='23514', CONSTRAINT='research_score_record_kinds';
 END IF;
 IF NEW.sample_revision <> current_revision THEN
  RAISE EXCEPTION 'Sample revision changed' USING ERRCODE='23514', CONSTRAINT='research_score_sample_revision';
 END IF;
 values_json := NEW.scores_json::jsonb;
 IF jsonb_typeof(values_json) IS DISTINCT FROM 'array' OR jsonb_typeof(rubric->'criteria') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Invalid research score structure' USING ERRCODE='23514';
 END IF;
 IF jsonb_array_length(values_json) NOT BETWEEN 1 AND 10 OR jsonb_array_length(values_json) <> jsonb_array_length(rubric->'criteria') THEN
  RAISE EXCEPTION 'Score count must match rubric' USING ERRCODE='23514';
 END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(values_json) LOOP
  criterion := rubric->'criteria'->i;
  IF jsonb_typeof(entry) <> 'number' OR jsonb_typeof(criterion->'weight') IS DISTINCT FROM 'number' THEN
   RAISE EXCEPTION 'Scores and weights must be numbers' USING ERRCODE='23514';
  END IF;
  weight := (criterion->>'weight')::numeric;
  IF entry::text::numeric NOT BETWEEN 0 AND 10 OR weight NOT BETWEEN 1 AND 100 OR weight <> trunc(weight) THEN
   RAISE EXCEPTION 'Score or weight outside allowed range' USING ERRCODE='23514';
  END IF;
  weight_sum := weight_sum + weight;
  expected := expected + entry::text::numeric * weight / 10;
  i := i + 1;
 END LOOP;
 IF weight_sum <> 100 OR abs(NEW.total::numeric-round(expected,2)) > 0.001 THEN
  RAISE EXCEPTION 'Weighted score total does not match rubric' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;
CREATE TRIGGER research_score_integrity BEFORE INSERT OR UPDATE ON public.research_scores
 FOR EACH ROW EXECUTE FUNCTION public.musuroom_validate_research_score();

CREATE FUNCTION public.musuroom_preserve_research_record() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $function$
BEGIN
 IF NEW.kind <> OLD.kind OR (OLD.kind='rubric' AND
  (NEW.data_json<>OLD.data_json OR NEW.title<>OLD.title OR NEW.revision<>OLD.revision OR NEW.published<>OLD.published)) THEN
  RAISE EXCEPTION 'Research kind and saved rubric are immutable' USING ERRCODE='23514';
 END IF;
 IF (NEW.data_json<>OLD.data_json OR NEW.title<>OLD.title OR NEW.published<>OLD.published) AND NEW.revision<=OLD.revision THEN
  RAISE EXCEPTION 'Changed research record must advance its revision' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;
CREATE TRIGGER research_record_integrity BEFORE UPDATE ON public.research_records
 FOR EACH ROW EXECUTE FUNCTION public.musuroom_preserve_research_record();
REVOKE ALL ON FUNCTION public.musuroom_validate_research_score(), public.musuroom_preserve_research_record() FROM PUBLIC;
DO $roles$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON FUNCTION public.musuroom_validate_research_score(), public.musuroom_preserve_research_record() FROM anon;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON FUNCTION public.musuroom_validate_research_score(), public.musuroom_preserve_research_record() FROM authenticated;
 END IF;
END $roles$;
INSERT INTO public.schema_migrations(version) VALUES('pg-009-research-score-integrity') ON CONFLICT(version) DO NOTHING;
