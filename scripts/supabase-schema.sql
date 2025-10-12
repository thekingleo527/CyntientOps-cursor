-- 🗄️ CyntientOps Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  image_asset_name TEXT,
  number_of_units INTEGER CHECK (number_of_units > 0),
  year_built INTEGER CHECK (year_built >= 1800 AND year_built <= 2030),
  square_footage INTEGER CHECK (square_footage > 0),
  management_company TEXT,
  primary_contact TEXT,
  contact_phone TEXT CHECK (length(contact_phone) >= 10),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  normalized_name TEXT,
  aliases TEXT,
  borough TEXT CHECK (borough IN ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island')),
  compliance_score REAL DEFAULT 0.0 CHECK (compliance_score >= 0.0 AND compliance_score <= 100.0),
  client_id TEXT,
  special_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) >= 2),
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'manager', 'supervisor')),
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Off', 'On Break')),
  phone TEXT CHECK (length(phone) >= 10),
  email TEXT CHECK (email LIKE '%@%.%'),
  password TEXT NOT NULL,
  skills TEXT, -- JSON array of skills
  certifications TEXT, -- JSON array of certifications
  hourly_rate REAL CHECK (hourly_rate >= 0.0),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) >= 3),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Maintenance', 'Cleaning', 'Sanitation', 'Operations', 'Inspection', 'Emergency')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical', 'emergency')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold')),
  assigned_building_id UUID,
  assigned_worker_id UUID,
  due_date TIMESTAMP WITH TIME ZONE CHECK (due_date IS NULL OR due_date > '1900-01-01'),
  completed_at TIMESTAMP WITH TIME ZONE CHECK (completed_at IS NULL OR completed_at > '1900-01-01'),
  estimated_duration INTEGER CHECK (estimated_duration > 0), -- minutes
  actual_duration INTEGER CHECK (actual_duration >= 0), -- minutes
  requires_photo INTEGER DEFAULT 0 CHECK (requires_photo IN (0, 1)),
  photo_evidence TEXT, -- JSON array of photo paths
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (assigned_building_id) REFERENCES buildings(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_worker_id) REFERENCES workers(id) ON DELETE SET NULL
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  session_token TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  permissions TEXT,
  status TEXT DEFAULT 'active',
  profile TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance table
CREATE TABLE IF NOT EXISTS compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID NOT NULL,
  category TEXT NOT NULL, -- HPD, DOB, FDNY, LL97, LL11, DEP
  status TEXT NOT NULL, -- compliant, warning, violation
  score REAL,
  last_inspection TIMESTAMP WITH TIME ZONE,
  next_inspection TIMESTAMP WITH TIME ZONE,
  violations_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create photo_evidence table
CREATE TABLE IF NOT EXISTS photo_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID,
  building_id UUID,
  worker_id UUID,
  photo_path TEXT NOT NULL,
  photo_category TEXT,
  notes TEXT,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_at TIMESTAMP WITH TIME ZONE,
  is_synced INTEGER DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (worker_id) REFERENCES workers(id)
);

-- Create clock_in table
CREATE TABLE IF NOT EXISTS clock_in (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL,
  building_id UUID NOT NULL,
  clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out_time TIMESTAMP WITH TIME ZONE,
  total_hours REAL,
  is_synced INTEGER DEFAULT 0,
  quickbooks_exported INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (worker_id) REFERENCES workers(id),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('login', 'logout', 'access_denied', 'data_access', 'data_modification', 'security_violation')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nova knowledge + conversation tables
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  building_id UUID,
  client_id UUID,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  total_chunks INTEGER DEFAULT 0,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  embedding DOUBLE PRECISION[],
  similarity_threshold REAL DEFAULT 0.35,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_ingest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS nova_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS nova_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES nova_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  tool_name TEXT,
  tool_payload JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nova_tool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES nova_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES nova_messages(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  request JSONB NOT NULL,
  response JSONB,
  status TEXT DEFAULT 'success',
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DSNY + Compliance Support Tables
CREATE TABLE IF NOT EXISTS dsny_schedule_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID,
  borough TEXT,
  community_board TEXT,
  sanitation_district TEXT,
  normalized_address TEXT NOT NULL,
  regular_collection TEXT,
  recycling_collection TEXT,
  organic_collection TEXT,
  snow_priority TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

CREATE TABLE IF NOT EXISTS dsny_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  violation_number TEXT,
  category TEXT,
  description TEXT,
  status TEXT,
  issued_date TIMESTAMP WITH TIME ZONE,
  resolved_date TIMESTAMP WITH TIME ZONE,
  fine_amount REAL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dsny_compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS building_historical_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  metric TEXT NOT NULL,
  metric_date TIMESTAMP WITH TIME ZONE NOT NULL,
  value REAL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT,
  status TEXT DEFAULT 'open',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_building ON tasks(assigned_building_id);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_compliance_building ON compliance(building_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_worker ON clock_in(worker_id);
CREATE INDEX IF NOT EXISTS idx_clock_in_building ON clock_in(building_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source ON knowledge_documents(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_updated_at ON knowledge_documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON knowledge_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_knowledge_ingest_status ON knowledge_ingest_jobs(status, started_at);
CREATE INDEX IF NOT EXISTS idx_nova_conversations_user ON nova_conversations(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_nova_messages_conversation ON nova_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nova_tool_logs_conversation ON nova_tool_logs(conversation_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_documents_source_unique ON knowledge_documents(source_type, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_chunks_document_index_unique ON knowledge_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_dsny_schedule_cache_building ON dsny_schedule_cache(building_id);
CREATE INDEX IF NOT EXISTS idx_dsny_violations_building ON dsny_violations(building_id);
CREATE INDEX IF NOT EXISTS idx_dsny_violations_status ON dsny_violations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_building ON compliance_alerts(building_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);

-- Knowledge maintenance helpers
CREATE OR REPLACE FUNCTION ensure_knowledge_document(
  p_source_type TEXT,
  p_source_id TEXT,
  p_title TEXT,
  p_summary TEXT,
  p_building UUID,
  p_client UUID,
  p_metadata JSONB,
  p_total_chunks INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
BEGIN
  INSERT INTO knowledge_documents (
    id, source_type, source_id, title, summary, building_id, client_id, metadata, total_chunks, updated_at
  ) VALUES (
    gen_random_uuid(), p_source_type, p_source_id, p_title, p_summary, p_building, p_client, p_metadata, p_total_chunks, NOW()
  )
  ON CONFLICT (source_type, source_id) DO UPDATE
    SET title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        building_id = EXCLUDED.building_id,
        client_id = EXCLUDED.client_id,
        metadata = EXCLUDED.metadata,
        total_chunks = EXCLUDED.total_chunks,
        updated_at = NOW()
  RETURNING id INTO v_doc_id;

  RETURN v_doc_id;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_knowledge_chunk(
  p_document_id UUID,
  p_chunk_index INTEGER,
  p_content TEXT,
  p_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO knowledge_chunks (
    id, document_id, chunk_index, content, token_count, metadata, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_document_id, p_chunk_index, p_content, COALESCE(length(p_content), 0), p_metadata, NOW(), NOW()
  )
  ON CONFLICT (document_id, chunk_index) DO UPDATE
    SET content = EXCLUDED.content,
        token_count = EXCLUDED.token_count,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := NULL;
  v_role TEXT := 'service_role';
BEGIN
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN others THEN
    v_user_id := NULL;
  END;

  IF auth.jwt() ? 'role' THEN
    v_role := auth.jwt() ->> 'role';
  END IF;

  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  INSERT INTO audit_logs (
    id,
    user_id,
    user_role,
    action,
    resource,
    timestamp,
    ip_address,
    user_agent,
    success,
    details
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_role,
    TG_OP,
    TG_TABLE_NAME,
    NOW(),
    current_setting('request.headers', true)::json ->> 'x-forwarded-for',
    current_setting('request.headers', true)::json ->> 'user-agent',
    true,
    json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION sync_building_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_summary TEXT;
  v_content TEXT;
BEGIN
  v_summary := format('%s · %s', NEW.name, COALESCE(NEW.address, 'address unknown'));

  v_doc_id := ensure_knowledge_document(
    'building',
    NEW.id::TEXT,
    NEW.name,
    v_summary,
    NEW.id,
    NULLIF(NEW.client_id, '')::uuid,
    jsonb_build_object(
      'latitude', NEW.latitude,
      'longitude', NEW.longitude,
      'borough', NEW.borough,
      'management_company', NEW.management_company,
      'compliance_score', NEW.compliance_score,
      'units', NEW.number_of_units,
      'notes', NEW.special_notes
    )
  );

  v_content := format(
    'Building %s located at %s. Units: %s. Compliance score: %s. Managed by %s. Notes: %s',
    NEW.name,
    COALESCE(NEW.address, 'address unknown'),
    COALESCE(NEW.number_of_units::TEXT, 'unknown'),
    COALESCE(NEW.compliance_score::TEXT, 'unavailable'),
    COALESCE(NEW.management_company, 'unspecified management'),
    COALESCE(NEW.special_notes, 'None')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object(
      'square_footage', NEW.square_footage,
      'year_built', NEW.year_built,
      'contact', NEW.primary_contact,
      'phone', NEW.contact_phone,
      'client_id', NEW.client_id
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_worker_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_summary TEXT;
  v_content TEXT;
BEGIN
  v_summary := format('%s (%s)', NEW.name, COALESCE(NEW.role, 'role unknown'));

  v_doc_id := ensure_knowledge_document(
    'worker',
    NEW.id::TEXT,
    NEW.name,
    v_summary,
    NULL,
    NULL,
    jsonb_build_object(
      'email', NEW.email,
      'phone', NEW.phone,
      'skills', NEW.skills,
      'status', NEW.status,
      'hourly_rate', NEW.hourly_rate
    )
  );

  v_content := format(
    'Worker %s serves as %s. Status: %s. Skills: %s. Contact: %s.',
    NEW.name,
    COALESCE(NEW.role, 'general team member'),
    COALESCE(NEW.status, 'unknown'),
    COALESCE(NEW.skills, 'not specified'),
    COALESCE(NEW.phone, 'no phone on record')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object(
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email', NEW.email
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_task_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_summary TEXT;
  v_content TEXT;
  v_building_name TEXT;
  v_worker_name TEXT;
BEGIN
  IF NEW.assigned_building_id IS NOT NULL THEN
    SELECT name INTO v_building_name FROM buildings WHERE id = NEW.assigned_building_id;
  END IF;
  IF NEW.assigned_worker_id IS NOT NULL THEN
    SELECT name INTO v_worker_name FROM workers WHERE id = NEW.assigned_worker_id;
  END IF;

  v_summary := format('%s task for %s', NEW.category, COALESCE(v_building_name, 'general portfolio'));

  v_doc_id := ensure_knowledge_document(
    'task',
    NEW.id::TEXT,
    COALESCE(NEW.name, 'Task'),
    v_summary,
    NEW.assigned_building_id,
    NULL,
    jsonb_build_object(
      'status', NEW.status,
      'priority', NEW.priority,
      'due_date', NEW.due_date,
      'assigned_worker', v_worker_name
    )
  );

  v_content := format(
    'Task %s (%s priority) assigned to %s. Due: %s. Notes: %s.',
    COALESCE(NEW.name, 'Unnamed task'),
    COALESCE(NEW.priority, 'normal'),
    COALESCE(v_worker_name, 'unassigned'),
    COALESCE(NEW.due_date::TEXT, 'no due date'),
    COALESCE(NEW.notes, 'No additional notes')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object(
      'building', v_building_name,
      'requires_photo', NEW.requires_photo,
      'estimated_duration', NEW.estimated_duration
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_compliance_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_building_name TEXT;
  v_summary TEXT;
  v_content TEXT;
BEGIN
  SELECT name INTO v_building_name FROM buildings WHERE id = NEW.building_id;

  v_summary := format('%s compliance for %s', NEW.category, COALESCE(v_building_name, 'unknown building'));

  v_doc_id := ensure_knowledge_document(
    'compliance',
    NEW.id::TEXT,
    v_summary,
    v_summary,
    NEW.building_id,
    NULL,
    jsonb_build_object(
      'status', NEW.status,
      'violations', NEW.violations_count,
      'last_inspection', NEW.last_inspection,
      'next_inspection', NEW.next_inspection
    )
  );

  v_content := format(
    '%s compliance status for %s: %s. Violations recorded: %s. Notes: %s.',
    NEW.category,
    COALESCE(v_building_name, 'unknown building'),
    COALESCE(NEW.status, 'unspecified'),
    COALESCE(NEW.violations_count::TEXT, '0'),
    COALESCE(NEW.notes, 'None provided')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object(
      'last_inspection', NEW.last_inspection,
      'next_inspection', NEW.next_inspection
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_dsny_schedule_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_building_name TEXT;
  v_summary TEXT;
  v_content TEXT;
BEGIN
  IF NEW.building_id IS NOT NULL THEN
    SELECT name INTO v_building_name FROM buildings WHERE id = NEW.building_id;
  END IF;

  v_summary := format('DSNY schedule for %s', COALESCE(v_building_name, NEW.normalized_address));

  v_doc_id := ensure_knowledge_document(
    'dsny_schedule',
    COALESCE(NEW.building_id::TEXT, NEW.normalized_address),
    v_summary,
    v_summary,
    NEW.building_id,
    NULL,
    jsonb_build_object(
      'borough', NEW.borough,
      'sanitation_district', NEW.sanitation_district
    )
  );

  v_content := format(
    'Regular collection: %s. Recycling: %s. Organics: %s. Snow priority: %s.',
    COALESCE(NEW.regular_collection, 'not provided'),
    COALESCE(NEW.recycling_collection, 'not provided'),
    COALESCE(NEW.organic_collection, 'not provided'),
    COALESCE(NEW.snow_priority, 'standard')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object(
      'community_board', NEW.community_board,
      'last_updated', NEW.last_updated
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_dsny_violation_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_building_name TEXT;
  v_summary TEXT;
  v_content TEXT;
BEGIN
  SELECT name INTO v_building_name FROM buildings WHERE id = NEW.building_id;

  v_summary := format('DSNY violation %s for %s', COALESCE(NEW.violation_number, NEW.id::TEXT), COALESCE(v_building_name, 'unknown building'));

  v_doc_id := ensure_knowledge_document(
    'dsny_violation',
    NEW.id::TEXT,
    v_summary,
    v_summary,
    NEW.building_id,
    NULL,
    jsonb_build_object(
      'status', NEW.status,
      'issued_date', NEW.issued_date,
      'resolved_date', NEW.resolved_date,
      'fine_amount', NEW.fine_amount
    )
  );

  v_content := format(
    'Violation category %s: %s. Status: %s.',
    COALESCE(NEW.category, 'unspecified'),
    COALESCE(NEW.description, 'no description provided'),
    COALESCE(NEW.status, 'open')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object('issued_date', NEW.issued_date, 'resolved_date', NEW.resolved_date)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_compliance_alert_knowledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_building_name TEXT;
  v_summary TEXT;
  v_content TEXT;
BEGIN
  SELECT name INTO v_building_name FROM buildings WHERE id = NEW.building_id;

  v_summary := format('%s alert for %s', NEW.alert_type, COALESCE(v_building_name, 'unknown building'));

  v_doc_id := ensure_knowledge_document(
    'compliance_alert',
    NEW.id::TEXT,
    v_summary,
    v_summary,
    NEW.building_id,
    NULL,
    jsonb_build_object(
      'severity', NEW.severity,
      'status', NEW.status,
      'detected_at', NEW.detected_at,
      'resolved_at', NEW.resolved_at
    )
  );

  v_content := format(
    '%s alert with severity %s. Source: %s. Notes: %s.',
    NEW.alert_type,
    COALESCE(NEW.severity, 'unknown'),
    COALESCE(NEW.source, 'not specified'),
    COALESCE(NEW.description, 'No details provided')
  );

  PERFORM upsert_knowledge_chunk(
    v_doc_id,
    0,
    v_content,
    jsonb_build_object('resolution_notes', NEW.resolution_notes)
  );

  RETURN NEW;
END;
$$;

-- Triggers for automated knowledge maintenance
DROP TRIGGER IF EXISTS trg_buildings_knowledge ON buildings;
CREATE TRIGGER trg_buildings_knowledge
AFTER INSERT OR UPDATE ON buildings
FOR EACH ROW EXECUTE FUNCTION sync_building_knowledge();

DROP TRIGGER IF EXISTS trg_workers_knowledge ON workers;
CREATE TRIGGER trg_workers_knowledge
AFTER INSERT OR UPDATE ON workers
FOR EACH ROW EXECUTE FUNCTION sync_worker_knowledge();

DROP TRIGGER IF EXISTS trg_tasks_knowledge ON tasks;
CREATE TRIGGER trg_tasks_knowledge
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION sync_task_knowledge();

DROP TRIGGER IF EXISTS trg_compliance_knowledge ON compliance;
CREATE TRIGGER trg_compliance_knowledge
AFTER INSERT OR UPDATE ON compliance
FOR EACH ROW EXECUTE FUNCTION sync_compliance_knowledge();

DROP TRIGGER IF EXISTS trg_dsny_schedule_knowledge ON dsny_schedule_cache;
CREATE TRIGGER trg_dsny_schedule_knowledge
AFTER INSERT OR UPDATE ON dsny_schedule_cache
FOR EACH ROW EXECUTE FUNCTION sync_dsny_schedule_knowledge();

DROP TRIGGER IF EXISTS trg_dsny_violation_knowledge ON dsny_violations;
CREATE TRIGGER trg_dsny_violation_knowledge
AFTER INSERT OR UPDATE ON dsny_violations
FOR EACH ROW EXECUTE FUNCTION sync_dsny_violation_knowledge();

DROP TRIGGER IF EXISTS trg_compliance_alerts_knowledge ON compliance_alerts;
CREATE TRIGGER trg_compliance_alerts_knowledge
AFTER INSERT OR UPDATE ON compliance_alerts
FOR EACH ROW EXECUTE FUNCTION sync_compliance_alert_knowledge();

-- Audit triggers with service-role aware defaults
DROP TRIGGER IF EXISTS buildings_audit_trigger ON buildings;
CREATE TRIGGER buildings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON buildings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS workers_audit_trigger ON workers;
CREATE TRIGGER workers_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON workers
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS tasks_audit_trigger ON tasks;
CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS compliance_audit_trigger ON compliance;
CREATE TRIGGER compliance_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON compliance
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS clients_audit_trigger ON clients;
CREATE TRIGGER clients_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS photo_evidence_audit_trigger ON photo_evidence;
CREATE TRIGGER photo_evidence_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON photo_evidence
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS clock_in_audit_trigger ON clock_in;
CREATE TRIGGER clock_in_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON clock_in
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Enable Row Level Security
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova_tool_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view buildings" ON buildings FOR SELECT USING (true);
CREATE POLICY "Admins can insert buildings" ON buildings FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update buildings" ON buildings FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete buildings" ON buildings FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view workers" ON workers FOR SELECT USING (true);
CREATE POLICY "Admins can insert workers" ON workers FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Workers can update own profile" ON workers FOR UPDATE USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Admins and managers can insert tasks" ON tasks FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Assigned workers can update tasks" ON tasks FOR UPDATE USING (assigned_worker_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own sessions" ON user_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON user_sessions FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Workers can view own clock records" ON clock_in FOR SELECT USING (worker_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Workers can clock in/out" ON clock_in FOR INSERT WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Users can view photo evidence" ON photo_evidence FOR SELECT USING (true);
CREATE POLICY "Workers can upload photos" ON photo_evidence FOR INSERT WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Users can view compliance data" ON compliance FOR SELECT USING (true);
CREATE POLICY "Admins can insert compliance data" ON compliance FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can read knowledge documents" ON knowledge_documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage knowledge documents" ON knowledge_documents FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager')) WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Authenticated users can read knowledge chunks" ON knowledge_chunks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage knowledge chunks" ON knowledge_chunks FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager')) WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Admins can manage ingest jobs" ON knowledge_ingest_jobs FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager')) WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Users can read own conversations" ON nova_conversations FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Users can manage own conversations" ON nova_conversations FOR ALL USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager')) WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Users can read conversation messages" ON nova_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM nova_conversations
    WHERE nova_conversations.id = conversation_id
      AND (nova_conversations.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
  )
);

CREATE POLICY "Users can create conversation messages" ON nova_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM nova_conversations
    WHERE nova_conversations.id = conversation_id
      AND (nova_conversations.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
  )
);

CREATE POLICY "Users can read tool logs for conversations" ON nova_tool_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM nova_conversations
    WHERE nova_conversations.id = conversation_id
      AND (nova_conversations.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
  )
);

CREATE POLICY "Admins can manage tool logs" ON nova_tool_logs FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager')) WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clock_in_updated_at BEFORE UPDATE ON clock_in FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_chunks_updated_at BEFORE UPDATE ON knowledge_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nova_conversations_updated_at BEFORE UPDATE ON nova_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
