import { DatabaseSchema } from '../DatabaseSchema';

describe('Database schema parity', () => {
  test('includes expected core tables', () => {
    const ddl = new DatabaseSchema().getTableDefinitions().join('\n');
    const mustHave = [
      'CREATE TABLE IF NOT EXISTS buildings',
      'CREATE TABLE IF NOT EXISTS workers',
      'CREATE TABLE IF NOT EXISTS routine_tasks',
      'CREATE TABLE IF NOT EXISTS worker_building_assignments',
      'CREATE TABLE IF NOT EXISTS clock_sessions',
      'CREATE TABLE IF NOT EXISTS task_completions',
      'CREATE TABLE IF NOT EXISTS clients',
      'CREATE TABLE IF NOT EXISTS sync_queue',
      'CREATE TABLE IF NOT EXISTS dsny_violations',
    ];
    for (const token of mustHave) {
      expect(ddl).toContain(token);
    }
  });
});

