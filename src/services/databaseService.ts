import { db } from './database';
import { migrationManager } from './migrations';
import { userRepository, medicationRepository, intakeRepository } from './index';

export class DatabaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Open the database and run migrations
      await db.open();
      await migrationManager.runMigrations();
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  async getHealthCheck(): Promise<{
    status: 'healthy' | 'error';
    version: number;
    tables: {
      users: number;
      medications: number;
      intakeRecords: number;
    };
  }> {
    try {
      const version = await migrationManager.getCurrentVersion();
      const userCount = await db.users.count();
      const medicationCount = await db.medications.count();
      const intakeRecordCount = await db.intakeRecords.count();

      return {
        status: 'healthy',
        version,
        tables: {
          users: userCount,
          medications: medicationCount,
          intakeRecords: intakeRecordCount
        }
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'error',
        version: 0,
        tables: {
          users: 0,
          medications: 0,
          intakeRecords: 0
        }
      };
    }
  }

  // Convenience methods for accessing repositories
  get users() {
    return userRepository;
  }

  get medications() {
    return medicationRepository;
  }

  get intakeRecords() {
    return intakeRepository;
  }

  get migrations() {
    return migrationManager;
  }
}

export const databaseService = new DatabaseService();