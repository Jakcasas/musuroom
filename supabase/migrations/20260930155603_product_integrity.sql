-- Reject arrays, empty measurement records and unsupported keys at the database boundary.
ALTER TABLE public.product_samples
  ADD CONSTRAINT product_metrics_object CHECK (jsonb_typeof(metrics_json::jsonb)='object'),
  ADD CONSTRAINT product_nutrition_object CHECK (jsonb_typeof(nutrition_json::jsonb)='object'),
  ADD CONSTRAINT product_measurements_required CHECK (metrics_json::jsonb<>'{}'::jsonb OR nutrition_json::jsonb<>'{}'::jsonb),
  ADD CONSTRAINT product_metrics_supported CHECK ((metrics_json::jsonb - ARRAY['moisture_percent','water_activity','cielab_l','cielab_a','cielab_b','solubility_percent'])='{}'::jsonb),
  ADD CONSTRAINT product_nutrition_supported CHECK ((nutrition_json::jsonb - ARRAY['energy_kcal','protein_g','fat_g','carbohydrate_g','sodium_mg'])='{}'::jsonb);
