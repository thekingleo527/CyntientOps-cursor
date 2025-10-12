/**
 * 🗄️ Supabase Migration System
 * Purpose: Deploy database schemas to Supabase with RLS policies
 * Features: Schema deployment, RLS policies, indexes, triggers
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './DatabaseSchema';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  schema?: string;
}

export interface MigrationResult {
  success: boolean;
  tablesCreated: string[];
  policiesCreated: string[];
  indexesCreated: string[];
  extensionsEnabled: string[];
  errors: string[];
}

export class SupabaseMigration {
  private supabase: SupabaseClient;
  private schema: DatabaseSchema;
  private schemaName: string;

  constructor(config?: SupabaseConfig) {
    const url =
      config?.url ??
      process.env.SUPABASE_URL ??
      process.env.SUPABASE_PROJECT_URL ??
      process.env.SUPABASE_URL_INTERNAL;
    const serviceRoleKey =
      config?.serviceRoleKey ??
      process.env.SERVICE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_KEY;

    if (!url) {
      throw new Error('Supabase URL is required (set SUPABASE_URL)');
    }

    if (!serviceRoleKey) {
      throw new Error(
        'Supabase service role key is required (set SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY)'
      );
    }

    this.supabase = createClient(url, serviceRoleKey);
    this.schema = new DatabaseSchema();
    this.schemaName = config?.schema ?? 'public';
  }

  private getKnowledgePolicies(): Array<{ name: string; sql: string }> {
    return [
      {
        name: 'enable_rls_knowledge_documents',
        sql: 'ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_knowledge_chunks',
        sql: 'ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_knowledge_ingest_jobs',
        sql: 'ALTER TABLE knowledge_ingest_jobs ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_nova_conversations',
        sql: 'ALTER TABLE nova_conversations ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_nova_messages',
        sql: 'ALTER TABLE nova_messages ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_nova_tool_logs',
        sql: 'ALTER TABLE nova_tool_logs ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'knowledge_documents_select_policy',
        sql: `CREATE POLICY "Authenticated users can read knowledge documents" ON knowledge_documents
              FOR SELECT USING (auth.uid() IS NOT NULL);`
      },
      {
        name: 'knowledge_documents_manage_policy',
        sql: `CREATE POLICY "Admins can manage knowledge documents" ON knowledge_documents
              FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
              WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'knowledge_chunks_select_policy',
        sql: `CREATE POLICY "Authenticated users can read knowledge chunks" ON knowledge_chunks
              FOR SELECT USING (auth.uid() IS NOT NULL);`
      },
      {
        name: 'knowledge_chunks_manage_policy',
        sql: `CREATE POLICY "Admins can manage knowledge chunks" ON knowledge_chunks
              FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
              WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'knowledge_ingest_jobs_manage_policy',
        sql: `CREATE POLICY "Admins can manage ingest jobs" ON knowledge_ingest_jobs
              FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
              WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'nova_conversations_select_policy',
        sql: `CREATE POLICY "Users can read own conversations" ON nova_conversations
              FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'nova_conversations_manage_policy',
        sql: `CREATE POLICY "Users can manage own conversations" ON nova_conversations
              FOR ALL USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
              WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'nova_messages_select_policy',
        sql: `CREATE POLICY "Users can read conversation messages" ON nova_messages
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM nova_conversations
                  WHERE nova_conversations.id = nova_messages.conversation_id
                  AND (nova_conversations.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
                )
              );`
      },
      {
        name: 'nova_messages_manage_policy',
        sql: `CREATE POLICY "Users can create conversation messages" ON nova_messages
              FOR INSERT WITH CHECK (
                EXISTS (
                  SELECT 1 FROM nova_conversations
                  WHERE nova_conversations.id = conversation_id
                  AND (nova_conversations.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
                )
              );`
      },
      {
        name: 'nova_tool_logs_select_policy',
        sql: `CREATE POLICY "Users can read tool logs for conversations" ON nova_tool_logs
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM nova_conversations
                  WHERE nova_conversations.id = nova_tool_logs.conversation_id
                  AND (nova_conversations.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'))
                )
              );`
      },
      {
        name: 'nova_tool_logs_manage_policy',
        sql: `CREATE POLICY "Admins can manage tool logs" ON nova_tool_logs
              FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
              WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      }
    ];
  }

  /**
   * Deploy all database schemas to Supabase
   */
  async deploySchemas(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      tablesCreated: [],
      policiesCreated: [],
      indexesCreated: [],
      extensionsEnabled: [],
      errors: []
    };

    try {
      console.log('🚀 Starting Supabase schema deployment...');

      await this.setupExtensions(result);

      // Create tables
      await this.createTables(result);
      
      // Create indexes
      await this.createIndexes(result);
      
      // Create RLS policies
      await this.createRLSPolicies(result);
      
      // Create triggers
      await this.createTriggers(result);

      console.log('✅ Supabase schema deployment completed');
      console.log(`📊 Created ${result.tablesCreated.length} tables`);
      console.log(`🔒 Created ${result.policiesCreated.length} RLS policies`);
      console.log(`📈 Created ${result.indexesCreated.length} indexes`);
      if (result.extensionsEnabled.length) {
        console.log(`🧩 Enabled extensions: ${result.extensionsEnabled.join(', ')}`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Schema deployment failed:', message);
      result.success = false;
      result.errors.push(`Deployment failed: ${message}`);
    }

    return result;
  }

  /**
   * Ensure required Postgres extensions are enabled
   */
  private async setupExtensions(result: MigrationResult): Promise<void> {
    const extensions = [
      {
        name: 'uuid-ossp',
        sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
      },
      {
        name: 'pg_trgm',
        sql: 'CREATE EXTENSION IF NOT EXISTS "pg_trgm";'
      },
      {
        name: 'vector',
        sql: 'CREATE EXTENSION IF NOT EXISTS "vector";'
      }
    ];

    for (const extension of extensions) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: extension.sql });

        if (error && !error.message.includes('already exists')) {
          console.error(`Failed to enable extension ${extension.name}: ${error.message}`);
          result.errors.push(`Extension ${extension.name} failed: ${error.message}`);
          result.success = false;
        } else {
          result.extensionsEnabled.push(extension.name);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Extension ${extension.name} error: ${message}`);
        result.errors.push(`Extension ${extension.name} error: ${message}`);
        result.success = false;
      }
    }
  }

  /**
   * Create all tables
   */
  private async createTables(result: MigrationResult): Promise<void> {
    const tableDefinitions = [
      ...this.schema.getTableDefinitions(),
      ...this.getKnowledgeTableDefinitions()
    ];

    for (const tableSQL of tableDefinitions) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: tableSQL });
        
        if (error) {
          console.error(`Failed to create table: ${error.message}`);
          result.errors.push(`Table creation failed: ${error.message}`);
        } else {
          // Extract table name from SQL
          const tableName = this.extractTableName(tableSQL);
          if (tableName) {
            result.tablesCreated.push(tableName);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Table creation error: ${message}`);
        result.errors.push(`Table creation error: ${message}`);
      }
    }
  }

  /**
   * Supabase-specific tables for Nova knowledge + conversations
   */
  private getKnowledgeTableDefinitions(): string[] {
    return [
      `
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
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          token_count INTEGER DEFAULT 0,
          embedding DOUBLE PRECISION[],
          similarity_threshold REAL DEFAULT 0.35,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS knowledge_ingest_jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
          source_type TEXT NOT NULL,
          source_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          error TEXT,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          created_by UUID,
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS nova_conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title TEXT,
          context JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          last_message_at TIMESTAMPTZ
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS nova_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES nova_conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
          content TEXT NOT NULL,
          citations JSONB DEFAULT '[]'::jsonb,
          tool_name TEXT,
          tool_payload JSONB,
          latency_ms INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS nova_tool_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES nova_conversations(id) ON DELETE SET NULL,
          message_id UUID REFERENCES nova_messages(id) ON DELETE SET NULL,
          tool_name TEXT NOT NULL,
          request JSONB NOT NULL,
          response JSONB,
          status TEXT DEFAULT 'success',
          duration_ms INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    ];
  }

  /**
   * Create all indexes
   */
  private async createIndexes(result: MigrationResult): Promise<void> {
    const indexes = [
      ...this.schema.getIndexes(),
      ...this.getKnowledgeIndexes()
    ];

    for (const indexSQL of indexes) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: indexSQL });
        
        if (error) {
          console.error(`Failed to create index: ${error.message}`);
          result.errors.push(`Index creation failed: ${error.message}`);
        } else {
          result.indexesCreated.push(indexSQL);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Index creation error: ${message}`);
        result.errors.push(`Index creation error: ${message}`);
      }
    }
  }

  private getKnowledgeIndexes(): string[] {
    return [
      'CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source ON knowledge_documents(source_type, source_id);',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_documents_updated_at ON knowledge_documents(updated_at);',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON knowledge_chunks(document_id, chunk_index);',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_ingest_status ON knowledge_ingest_jobs(status, started_at);',
      'CREATE INDEX IF NOT EXISTS idx_nova_conversations_user ON nova_conversations(user_id, updated_at);',
      'CREATE INDEX IF NOT EXISTS idx_nova_messages_conversation ON nova_messages(conversation_id, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_nova_tool_logs_conversation ON nova_tool_logs(conversation_id, created_at);'
    ];
  }

  /**
   * Create Row Level Security policies
   */
  private async createRLSPolicies(result: MigrationResult): Promise<void> {
    const policies = this.getRLSPolicies();

    for (const policy of policies) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: policy.sql });
        
        if (error) {
          console.error(`Failed to create RLS policy: ${error.message}`);
          result.errors.push(`RLS policy creation failed: ${error.message}`);
        } else {
          result.policiesCreated.push(policy.name);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`RLS policy creation error: ${message}`);
        result.errors.push(`RLS policy creation error: ${message}`);
      }
    }
  }

  /**
   * Create database triggers
   */
  private async createTriggers(result: MigrationResult): Promise<void> {
    const triggers = this.getTriggers();

    for (const trigger of triggers) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: trigger.sql });
        
        if (error) {
          console.error(`Failed to create trigger: ${error.message}`);
          result.errors.push(`Trigger creation failed: ${error.message}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Trigger creation error: ${message}`);
        result.errors.push(`Trigger creation error: ${message}`);
      }
    }
  }

  /**
   * Extract table name from CREATE TABLE SQL
   */
  private extractTableName(sql: string): string | null {
    const match = sql.match(/CREATE TABLE.*?(\w+)\s*\(/i);
    return match ? match[1] : null;
  }

  /**
   * Get RLS policies for all tables
   */
  private getRLSPolicies(): Array<{ name: string; sql: string }> {
    const policies = [
      // Enable RLS on all tables
      {
        name: 'enable_rls_buildings',
        sql: 'ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_workers',
        sql: 'ALTER TABLE workers ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_tasks',
        sql: 'ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_user_sessions',
        sql: 'ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_clock_in',
        sql: 'ALTER TABLE clock_in ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_photo_evidence',
        sql: 'ALTER TABLE photo_evidence ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'enable_rls_compliance',
        sql: 'ALTER TABLE compliance ENABLE ROW LEVEL SECURITY;'
      },

      // Buildings policies
      {
        name: 'buildings_select_policy',
        sql: `CREATE POLICY "Users can view buildings" ON buildings
              FOR SELECT USING (true);`
      },
      {
        name: 'buildings_insert_policy',
        sql: `CREATE POLICY "Admins can insert buildings" ON buildings
              FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');`
      },
      {
        name: 'buildings_update_policy',
        sql: `CREATE POLICY "Admins can update buildings" ON buildings
              FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');`
      },
      {
        name: 'buildings_delete_policy',
        sql: `CREATE POLICY "Admins can delete buildings" ON buildings
              FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');`
      },

      // Workers policies
      {
        name: 'workers_select_policy',
        sql: `CREATE POLICY "Users can view workers" ON workers
              FOR SELECT USING (true);`
      },
      {
        name: 'workers_insert_policy',
        sql: `CREATE POLICY "Admins can insert workers" ON workers
              FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');`
      },
      {
        name: 'workers_update_policy',
        sql: `CREATE POLICY "Workers can update own profile" ON workers
              FOR UPDATE USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');`
      },

      // Tasks policies
      {
        name: 'tasks_select_policy',
        sql: `CREATE POLICY "Users can view tasks" ON tasks
              FOR SELECT USING (true);`
      },
      {
        name: 'tasks_insert_policy',
        sql: `CREATE POLICY "Admins and managers can insert tasks" ON tasks
              FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'tasks_update_policy',
        sql: `CREATE POLICY "Assigned workers can update tasks" ON tasks
              FOR UPDATE USING (assigned_worker_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },

      // User sessions policies
      {
        name: 'user_sessions_select_policy',
        sql: `CREATE POLICY "Users can view own sessions" ON user_sessions
              FOR SELECT USING (user_id = auth.uid());`
      },
      {
        name: 'user_sessions_insert_policy',
        sql: `CREATE POLICY "Users can create own sessions" ON user_sessions
              FOR INSERT WITH CHECK (user_id = auth.uid());`
      },
      {
        name: 'user_sessions_update_policy',
        sql: `CREATE POLICY "Users can update own sessions" ON user_sessions
              FOR UPDATE USING (user_id = auth.uid());`
      },

      // Clock in policies
      {
        name: 'clock_in_select_policy',
        sql: `CREATE POLICY "Workers can view own clock records" ON clock_in
              FOR SELECT USING (worker_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'manager'));`
      },
      {
        name: 'clock_in_insert_policy',
        sql: `CREATE POLICY "Workers can clock in/out" ON clock_in
              FOR INSERT WITH CHECK (worker_id = auth.uid());`
      },

      // Photo evidence policies
      {
        name: 'photo_evidence_select_policy',
        sql: `CREATE POLICY "Users can view photo evidence" ON photo_evidence
              FOR SELECT USING (true);`
      },
      {
        name: 'photo_evidence_insert_policy',
        sql: `CREATE POLICY "Workers can upload photos" ON photo_evidence
              FOR INSERT WITH CHECK (worker_id = auth.uid());`
      },

      // Compliance policies
      {
        name: 'compliance_select_policy',
        sql: `CREATE POLICY "Users can view compliance data" ON compliance
              FOR SELECT USING (true);`
      },
      {
        name: 'compliance_insert_policy',
        sql: `CREATE POLICY "Admins can insert compliance data" ON compliance
              FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');`
      }
    ];

    return [
      ...policies,
      ...this.getKnowledgePolicies()
    ];
  }

  /**
   * Get database triggers
   */
  private getTriggers(): Array<{ name: string; sql: string }> {
    return [
      // Update timestamp trigger
      {
        name: 'update_timestamp_trigger',
        sql: `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `
      },
      {
        name: 'buildings_update_timestamp',
        sql: `
          CREATE TRIGGER update_buildings_updated_at
          BEFORE UPDATE ON buildings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'workers_update_timestamp',
        sql: `
          CREATE TRIGGER update_workers_updated_at
          BEFORE UPDATE ON workers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'tasks_update_timestamp',
        sql: `
          CREATE TRIGGER update_tasks_updated_at
          BEFORE UPDATE ON tasks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'user_sessions_update_timestamp',
        sql: `
          CREATE TRIGGER update_user_sessions_updated_at
          BEFORE UPDATE ON user_sessions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },

      // Audit trail trigger
      {
        name: 'audit_trail_trigger',
        sql: `
          CREATE OR REPLACE FUNCTION audit_trigger_function()
          RETURNS TRIGGER AS $$
          BEGIN
            INSERT INTO audit_logs (
              id, user_id, user_role, action, resource, timestamp, 
              ip_address, user_agent, success, details
            ) VALUES (
              gen_random_uuid(),
              auth.uid(),
              auth.jwt() ->> 'role',
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
          $$ language 'plpgsql';
        `
      },
      {
        name: 'buildings_audit_trigger',
        sql: `
          CREATE TRIGGER buildings_audit_trigger
          AFTER INSERT OR UPDATE OR DELETE ON buildings
          FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        `
      },
      {
        name: 'workers_audit_trigger',
        sql: `
          CREATE TRIGGER workers_audit_trigger
          AFTER INSERT OR UPDATE OR DELETE ON workers
          FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        `
      },
      {
        name: 'tasks_audit_trigger',
        sql: `
          CREATE TRIGGER tasks_audit_trigger
          AFTER INSERT OR UPDATE OR DELETE ON tasks
          FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        `
      },
      {
        name: 'knowledge_documents_update_timestamp',
        sql: `
          CREATE TRIGGER update_knowledge_documents_updated_at
          BEFORE UPDATE ON knowledge_documents
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'knowledge_chunks_update_timestamp',
        sql: `
          CREATE TRIGGER update_knowledge_chunks_updated_at
          BEFORE UPDATE ON knowledge_chunks
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      },
      {
        name: 'nova_conversations_update_timestamp',
        sql: `
          CREATE TRIGGER update_nova_conversations_updated_at
          BEFORE UPDATE ON nova_conversations
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `
      }
    ];
  }

  /**
   * Verify deployment
   */
  async verifyDeployment(): Promise<{
    tablesExist: boolean;
    policiesExist: boolean;
    indexesExist: boolean;
    details: any;
  }> {
    try {
      type TableRow = { table_name: string };
      type PolicyRow = { tablename: string; policyname: string };
      type IndexRow = { tablename: string; indexname: string };

      // Check if tables exist
      const { data: tables, error: tablesError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', this.schemaName);

      if (tablesError) {
        throw new Error(`Failed to check tables: ${tablesError.message}`);
      }

      // Check if RLS is enabled
      const { data: policies, error: policiesError } = await this.supabase
        .from('pg_policies')
        .select('tablename, policyname, schemaname')
        .eq('schemaname', this.schemaName);

      if (policiesError) {
        throw new Error(`Failed to check policies: ${policiesError.message}`);
      }

      // Check if indexes exist
      const { data: indexes, error: indexesError } = await this.supabase
        .from('pg_indexes')
        .select('tablename, indexname')
        .eq('schemaname', this.schemaName);

      if (indexesError) {
        throw new Error(`Failed to check indexes: ${indexesError.message}`);
      }

      const tableRows = (tables ?? []) as TableRow[];
      const policyRows = (policies ?? []) as PolicyRow[];
      const indexRows = (indexes ?? []) as IndexRow[];

      return {
        tablesExist: tableRows.length > 0,
        policiesExist: policyRows.length > 0,
        indexesExist: indexRows.length > 0,
        details: {
          tables: tableRows.map((t: TableRow) => t.table_name),
          policies: policyRows.map((p: PolicyRow) => `${p.tablename}.${p.policyname}`),
          indexes: indexRows.map((i: IndexRow) => `${i.tablename}.${i.indexname}`)
        }
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Verification failed:', error);
      return {
        tablesExist: false,
        policiesExist: false,
        indexesExist: false,
        details: { error: message }
      };
    }
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(): Promise<boolean> {
    try {
      console.log('🔄 Rolling back Supabase deployment...');

      // Drop all tables (this will cascade to indexes, policies, triggers)
      const tables = [
        'buildings', 'workers', 'tasks', 'routines', 'user_sessions',
        'compliance', 'photo_evidence', 'smart_photo_evidence',
        'building_spaces', 'building_inspections', 'work_completion_records',
        'clock_in', 'inventory', 'clients', 'sync_queue', 'time_theft_alerts',
        'ml_models', 'version_history', 'conflict_resolution', 'offline_queue',
        'issues', 'supply_requests', 'building_activity', 'dashboard_updates',
        'cache_entries', 'audit_logs', 'security_events', 'secure_storage',
        'knowledge_chunks', 'knowledge_documents', 'knowledge_ingest_jobs',
        'nova_tool_logs', 'nova_messages', 'nova_conversations'
      ];

      for (const table of tables) {
        try {
          await this.supabase.rpc('exec_sql', { sql: `DROP TABLE IF EXISTS ${table} CASCADE;` });
        } catch (error) {
          console.warn(`Failed to drop table ${table}: ${error instanceof Error ? error.message : error}`);
        }
      }

      console.log('✅ Rollback completed');
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Rollback failed:', message);
      return false;
    }
  }
}

export default SupabaseMigration;
