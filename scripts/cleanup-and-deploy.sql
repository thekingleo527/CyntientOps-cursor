-- 🧹 Cleanup and Deploy Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- First, drop all existing tables in the correct order (respecting foreign keys)
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS clock_in CASCADE;
DROP TABLE IF EXISTS photo_evidence CASCADE;
DROP TABLE IF EXISTS compliance CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create buildings table
CREATE TABLE buildings (
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
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) >= 2),
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'manager', 'supervisor')),
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Off', 'On Break')),
  phone TEXT CHECK (length(phone) >= 10),
  email TEXT CHECK (email LIKE '%@%.%'),
  skills TEXT, -- JSON array of skills
  certifications TEXT, -- JSON array of certifications
  hourly_rate REAL CHECK (hourly_rate >= 0.0),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
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

-- Create tasks table
CREATE TABLE tasks (
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
CREATE TABLE user_sessions (
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
CREATE TABLE compliance (
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
CREATE TABLE photo_evidence (
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
CREATE TABLE clock_in (
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

-- Create audit_logs table
CREATE TABLE audit_logs (
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
CREATE TABLE security_events (
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

-- Create performance indexes
CREATE INDEX idx_tasks_building ON tasks(assigned_building_id);
CREATE INDEX idx_tasks_worker ON tasks(assigned_worker_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_compliance_building ON compliance(building_id);
CREATE INDEX idx_clock_in_worker ON clock_in(worker_id);
CREATE INDEX idx_clock_in_building ON clock_in(building_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

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

-- Verify deployment
SELECT 'Deployment completed successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
