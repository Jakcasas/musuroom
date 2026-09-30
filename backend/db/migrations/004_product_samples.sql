CREATE TABLE product_samples (
 id TEXT PRIMARY KEY, sample_code TEXT NOT NULL UNIQUE CHECK(length(sample_code) BETWEEN 3 AND 50),
 label TEXT NOT NULL CHECK(length(label) BETWEEN 2 AND 120), origin TEXT NOT NULL CHECK(length(origin) BETWEEN 2 AND 500),
 process_notes TEXT NOT NULL DEFAULT '' CHECK(length(process_notes)<=2000),
 metrics_json TEXT NOT NULL CHECK(json_valid(metrics_json)), nutrition_json TEXT NOT NULL CHECK(json_valid(nutrition_json)),
 measured_at TEXT NOT NULL, evidence_document_id TEXT NOT NULL REFERENCES quality_documents(id),
 publication_status TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(publication_status IN ('PRIVATE','PUBLIC')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
