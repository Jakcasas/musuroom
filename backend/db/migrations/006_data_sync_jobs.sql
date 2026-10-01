-- Transactional outbox: identifiers only; no credentials, contacts or comments.
CREATE TABLE data_sync_jobs (
 job_key TEXT PRIMARY KEY, resource_type TEXT NOT NULL CHECK(resource_type IN ('knowledge','sensory','product')),
 resource_id TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
 synced_revision INTEGER NOT NULL DEFAULT 0 CHECK(synced_revision>=0),
 attempts INTEGER NOT NULL DEFAULT 0, last_error_code TEXT,
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX idx_data_sync_pending ON data_sync_jobs(job_key) WHERE synced_revision<revision;
CREATE TABLE data_sync_state (
 id TEXT PRIMARY KEY CHECK(id='mongo'), lock_owner TEXT NOT NULL DEFAULT '', lease_until INTEGER NOT NULL DEFAULT 0,
 last_completed_at TEXT, last_error_code TEXT, last_synced_count INTEGER NOT NULL DEFAULT 0
) STRICT;
INSERT INTO data_sync_state(id) VALUES('mongo');
CREATE TRIGGER sync_knowledge_insert AFTER INSERT ON knowledge_articles BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('knowledge:'||NEW.id,'knowledge',NEW.id) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_knowledge_update AFTER UPDATE ON knowledge_articles BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('knowledge:'||NEW.id,'knowledge',NEW.id) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_knowledge_delete AFTER DELETE ON knowledge_articles BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('knowledge:'||OLD.id,'knowledge',OLD.id) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_product_insert AFTER INSERT ON product_samples BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('product:'||NEW.id,'product',NEW.id) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_product_update AFTER UPDATE ON product_samples BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('product:'||NEW.id,'product',NEW.id) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_product_delete AFTER DELETE ON product_samples BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('product:'||OLD.id,'product',OLD.id) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_sensory_insert AFTER INSERT ON sensory_evaluations BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('sensory:'||NEW.session_code||':'||NEW.sample_code,'sensory',NEW.session_code||':'||NEW.sample_code) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_sensory_update AFTER UPDATE ON sensory_evaluations BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('sensory:'||OLD.session_code||':'||OLD.sample_code,'sensory',OLD.session_code||':'||OLD.sample_code) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('sensory:'||NEW.session_code||':'||NEW.sample_code,'sensory',NEW.session_code||':'||NEW.sample_code) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_sensory_delete AFTER DELETE ON sensory_evaluations BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) VALUES('sensory:'||OLD.session_code||':'||OLD.sample_code,'sensory',OLD.session_code||':'||OLD.sample_code) ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_source_update AFTER UPDATE ON sources BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) SELECT 'knowledge:'||id,'knowledge',id FROM (SELECT id FROM knowledge_articles WHERE source_id=NEW.id) WHERE 1 ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
CREATE TRIGGER sync_evidence_update AFTER UPDATE ON quality_documents BEGIN
 INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) SELECT 'product:'||id,'product',id FROM (SELECT id FROM product_samples WHERE evidence_document_id=NEW.id) WHERE 1 ON CONFLICT(job_key) DO UPDATE SET revision=revision+1,attempts=0,last_error_code=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
END;
INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) SELECT 'knowledge:'||id,'knowledge',id FROM knowledge_articles;
INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) SELECT DISTINCT 'sensory:'||session_code||':'||sample_code,'sensory',session_code||':'||sample_code FROM sensory_evaluations;
INSERT INTO data_sync_jobs(job_key,resource_type,resource_id) SELECT 'product:'||id,'product',id FROM product_samples;
