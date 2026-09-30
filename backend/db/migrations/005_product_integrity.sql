-- SQLite counterpart of pg-004-product-integrity. Existing records are preserved.
CREATE TRIGGER product_integrity_insert BEFORE INSERT ON product_samples
BEGIN
  SELECT CASE WHEN json_type(NEW.metrics_json)<>'object' OR json_type(NEW.nutrition_json)<>'object'
    THEN RAISE(ABORT,'product_measurements_must_be_objects') END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM json_each(NEW.metrics_json)) AND NOT EXISTS(SELECT 1 FROM json_each(NEW.nutrition_json))
    THEN RAISE(ABORT,'product_measurements_required') END;
  SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.metrics_json) WHERE key NOT IN ('moisture_percent','water_activity','cielab_l','cielab_a','cielab_b','solubility_percent'))
    OR EXISTS(SELECT 1 FROM json_each(NEW.nutrition_json) WHERE key NOT IN ('energy_kcal','protein_g','fat_g','carbohydrate_g','sodium_mg'))
    THEN RAISE(ABORT,'unsupported_product_measurement') END;
END;
CREATE TRIGGER product_integrity_update BEFORE UPDATE OF metrics_json,nutrition_json ON product_samples
BEGIN
  SELECT CASE WHEN json_type(NEW.metrics_json)<>'object' OR json_type(NEW.nutrition_json)<>'object'
    THEN RAISE(ABORT,'product_measurements_must_be_objects') END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM json_each(NEW.metrics_json)) AND NOT EXISTS(SELECT 1 FROM json_each(NEW.nutrition_json))
    THEN RAISE(ABORT,'product_measurements_required') END;
  SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.metrics_json) WHERE key NOT IN ('moisture_percent','water_activity','cielab_l','cielab_a','cielab_b','solubility_percent'))
    OR EXISTS(SELECT 1 FROM json_each(NEW.nutrition_json) WHERE key NOT IN ('energy_kcal','protein_g','fat_g','carbohydrate_g','sodium_mg'))
    THEN RAISE(ABORT,'unsupported_product_measurement') END;
END;
