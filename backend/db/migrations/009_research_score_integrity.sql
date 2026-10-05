CREATE TRIGGER research_record_integrity BEFORE UPDATE ON research_records BEGIN
 SELECT CASE WHEN NEW.kind<>OLD.kind OR (OLD.kind='rubric' AND
  (NEW.data_json<>OLD.data_json OR NEW.title<>OLD.title OR NEW.revision<>OLD.revision OR NEW.published<>OLD.published))
  THEN RAISE(ABORT,'research_record_immutable') END;
 SELECT CASE WHEN (NEW.data_json<>OLD.data_json OR NEW.title<>OLD.title OR NEW.published<>OLD.published) AND NEW.revision<=OLD.revision
  THEN RAISE(ABORT,'research_record_revision_required') END;
END;

CREATE TRIGGER research_score_insert BEFORE INSERT ON research_scores BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM research_records WHERE id=NEW.rubric_id AND kind='rubric')
  OR NOT EXISTS(SELECT 1 FROM research_records WHERE id=NEW.sample_id AND kind='sample')
  THEN RAISE(ABORT,'research_score_record_kinds') END;
 SELECT CASE WHEN NEW.sample_revision<1 OR NEW.sample_revision<>(SELECT revision FROM research_records WHERE id=NEW.sample_id)
  THEN RAISE(ABORT,'research_score_sample_revision') END;
 SELECT CASE WHEN json_type(NEW.scores_json)<>'array' OR json_array_length(NEW.scores_json) NOT BETWEEN 1 AND 10
  OR json_array_length(NEW.scores_json)<>(SELECT json_array_length(data_json,'$.criteria') FROM research_records WHERE id=NEW.rubric_id)
  OR EXISTS(SELECT 1 FROM json_each(NEW.scores_json) WHERE type NOT IN ('integer','real') OR value<0 OR value>10)
  THEN RAISE(ABORT,'research_score_values') END;
 SELECT CASE WHEN coalesce((SELECT json_type(data_json,'$.criteria') FROM research_records WHERE id=NEW.rubric_id),'')<>'array'
  OR EXISTS(SELECT 1 FROM research_records r,json_each(r.data_json,'$.criteria') c WHERE r.id=NEW.rubric_id AND
   (coalesce(json_type(c.value,'$.weight'),'')<>'integer' OR json_extract(c.value,'$.weight') NOT BETWEEN 1 AND 100))
  OR coalesce((SELECT sum(json_extract(c.value,'$.weight')) FROM research_records r,json_each(r.data_json,'$.criteria') c WHERE r.id=NEW.rubric_id),0)<>100
  THEN RAISE(ABORT,'research_score_weights') END;
 SELECT CASE WHEN abs(NEW.total-(SELECT round(sum(v.value*json_extract(r.data_json,'$.criteria['||v.key||'].weight')/10.0),2)
  FROM json_each(NEW.scores_json) v, research_records r WHERE r.id=NEW.rubric_id))>0.001
  THEN RAISE(ABORT,'research_score_total') END;
END;
CREATE TRIGGER research_score_update BEFORE UPDATE ON research_scores BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM research_records WHERE id=NEW.rubric_id AND kind='rubric')
  OR NOT EXISTS(SELECT 1 FROM research_records WHERE id=NEW.sample_id AND kind='sample')
  THEN RAISE(ABORT,'research_score_record_kinds') END;
 SELECT CASE WHEN NEW.sample_revision<1 OR NEW.sample_revision<>(SELECT revision FROM research_records WHERE id=NEW.sample_id)
  THEN RAISE(ABORT,'research_score_sample_revision') END;
 SELECT CASE WHEN json_type(NEW.scores_json)<>'array' OR json_array_length(NEW.scores_json) NOT BETWEEN 1 AND 10
  OR json_array_length(NEW.scores_json)<>(SELECT json_array_length(data_json,'$.criteria') FROM research_records WHERE id=NEW.rubric_id)
  OR EXISTS(SELECT 1 FROM json_each(NEW.scores_json) WHERE type NOT IN ('integer','real') OR value<0 OR value>10)
  THEN RAISE(ABORT,'research_score_values') END;
 SELECT CASE WHEN coalesce((SELECT json_type(data_json,'$.criteria') FROM research_records WHERE id=NEW.rubric_id),'')<>'array'
  OR EXISTS(SELECT 1 FROM research_records r,json_each(r.data_json,'$.criteria') c WHERE r.id=NEW.rubric_id AND
   (coalesce(json_type(c.value,'$.weight'),'')<>'integer' OR json_extract(c.value,'$.weight') NOT BETWEEN 1 AND 100))
  OR coalesce((SELECT sum(json_extract(c.value,'$.weight')) FROM research_records r,json_each(r.data_json,'$.criteria') c WHERE r.id=NEW.rubric_id),0)<>100
  THEN RAISE(ABORT,'research_score_weights') END;
 SELECT CASE WHEN abs(NEW.total-(SELECT round(sum(v.value*json_extract(r.data_json,'$.criteria['||v.key||'].weight')/10.0),2)
  FROM json_each(NEW.scores_json) v, research_records r WHERE r.id=NEW.rubric_id))>0.001
  THEN RAISE(ABORT,'research_score_total') END;
END;
