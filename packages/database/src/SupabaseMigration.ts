/**
 * 🗄️ Supabase Migration System
 * Purpose: Deploy database schemas to Supabase with RLS policies
 * Features: Schema deployment, RLS policies, indexes, triggers
 */

import { createClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './DatabaseSchema';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface MigrationResult {
  success: boolean;
  tablesCreated: string[];
  policiesCreated: string[];
  indexesCreated: string[];
  errors: string[];
}

export class SupabaseMigration {
  private supabase: any;
  private schema: DatabaseSchema;

  constructor(config: SupabaseConfig) {
    this.supabase = createClient(config.url, config.serviceRoleKey);
    this.schema = new DatabaseSchema();
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
      errors: []
    };

    try {
      console.log('🚀 Starting Supabase schema deployment...');

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

    } catch (error) {
      console.error('❌ Schema deployment failed:', error);
      result.success = false;
      result.errors.push(`Deployment failed: ${error}`);
    }

    return result;
  }

  /**
   * Create all tables
   */
  private async createTables(result: MigrationResult): Promise<void> {
    const tableDefinitions = this.schema.getTableDefinitions();

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
        console.error(`Table creation error: ${error}`);
        result.errors.push(`Table creation error: ${error}`);
      }
    }
  }

  /**
   * Create all indexes
   */
  private async createIndexes(result: MigrationResult): Promise<void> {
    const indexes = this.schema.getIndexes();

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
        console.error(`Index creation error: ${error}`);
        result.errors.push(`Index creation error: ${error}`);
      }
    }
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
        console.error(`RLS policy creation error: ${error}`);
        result.errors.push(`RLS policy creation error: ${error}`);
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
        console.error(`Trigger creation error: ${error}`);
        result.errors.push(`Trigger creation error: ${error}`);
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
    return [
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
      // Check if tables exist
      const { data: tables, error: tablesError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        throw new Error(`Failed to check tables: ${tablesError.message}`);
      }

      // Check if RLS is enabled
      const { data: policies, error: policiesError } = await this.supabase
        .from('pg_policies')
        .select('tablename, policyname');

      if (policiesError) {
        throw new Error(`Failed to check policies: ${policiesError.message}`);
      }

      // Check if indexes exist
      const { data: indexes, error: indexesError } = await this.supabase
        .from('pg_indexes')
        .select('tablename, indexname')
        .eq('schemaname', 'public');

      if (indexesError) {
        throw new Error(`Failed to check indexes: ${indexesError.message}`);
      }

      return {
        tablesExist: tables.length > 0,
        policiesExist: policies.length > 0,
        indexesExist: indexes.length > 0,
        details: {
          tables: tables.map(t => t.table_name),
          policies: policies.map(p => `${p.tablename}.${p.policyname}`),
          indexes: indexes.map(i => `${i.tablename}.${i.indexname}`)
        }
      };

    } catch (error) {
      console.error('Verification failed:', error);
      return {
        tablesExist: false,
        policiesExist: false,
        indexesExist: false,
        details: { error: error.message }
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
        'cache_entries', 'audit_logs', 'security_events', 'secure_storage'
      ];

      for (const table of tables) {
        try {
          await this.supabase.rpc('exec_sql', { sql: `DROP TABLE IF EXISTS ${table} CASCADE;` });
        } catch (error) {
          console.warn(`Failed to drop table ${table}: ${error}`);
        }
      }

      console.log('✅ Rollback completed');
      return true;

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }
}

export default SupabaseMigration;
