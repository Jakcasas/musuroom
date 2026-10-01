CREATE TABLE knowledge_decision_reviews (
 article_id TEXT PRIMARY KEY REFERENCES knowledge_articles(id) ON DELETE CASCADE,
 source_revision INTEGER NOT NULL CHECK(source_revision>0),
 content_hash TEXT NOT NULL CHECK(length(content_hash)=64),
 decision_version TEXT NOT NULL,
 decision_json TEXT NOT NULL CHECK(json_valid(decision_json)),
 review_status TEXT NOT NULL CHECK(review_status IN ('pending','confirmed','rejected')),
 updated_at TEXT NOT NULL,
 reviewed_at TEXT
) STRICT;
