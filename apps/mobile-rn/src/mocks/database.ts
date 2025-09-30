/**
 * Mock database module for development
 */

export class DatabaseManager {
  async executeSql(sql: string, params: any[] = []) {
    console.log('Mock SQL:', sql, params);
    return { rows: { length: 0, item: () => null } };
  }
  
  async insert(table: string, data: any) {
    console.log('Mock insert:', table, data);
    return 'mock-id';
  }
  
  async update(table: string, data: any, where: any) {
    console.log('Mock update:', table, data, where);
    return 1;
  }
  
  async delete(table: string, where: any) {
    console.log('Mock delete:', table, where);
    return 1;
  }
  
  async select(table: string, where?: any) {
    console.log('Mock select:', table, where);
    return [];
  }
}

export default new DatabaseManager();
