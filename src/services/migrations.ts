import { db } from './database';

export interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export class MigrationManager {
  private migrations: Migration[] = [];

  constructor() {
    this.registerMigrations();
  }

  private registerMigrations() {
    // Migration 1: Initial schema
    this.migrations.push({
      version: 1,
      description: 'Initial database schema with users, medications, and intake records',
      up: async () => {
        // This is handled by Dexie schema definition
        console.log('Initial schema created');
      }
    });

    // Future migrations can be added here
    // Example:
    // this.migrations.push({
    //   version: 2,
    //   description: 'Add new fields to medication table',
    //   up: async () => {
    //     // Migration logic here
    //   },
    //   down: async () => {
    //     // Rollback logic here
    //   }
    // });
  }

  async getCurrentVersion(): Promise<number> {
    try {
      const versionInfo = await db.open();
      return versionInfo.verno;
    } catch (error) {
      console.error('Error getting database version:', error);
      return 0;
    }
  }

  async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        await migration.up();
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  async rollbackToVersion(targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse(); // Rollback in reverse order

    for (const migration of migrationsToRollback) {
      if (migration.down) {
        try {
          console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
          await migration.down();
          console.log(`Migration ${migration.version} rolled back successfully`);
        } catch (error) {
          console.error(`Rollback of migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        console.warn(`Migration ${migration.version} has no rollback function`);
      }
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      await db.delete();
      console.log('Database reset successfully');
      // Reopen the database to recreate schema
      await db.open();
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  async exportData(): Promise<string> {
    try {
      const users = await db.users.toArray();
      const medications = await db.medications.toArray();
      const intakeRecords = await db.intakeRecords.toArray();

      const exportData = {
        version: await this.getCurrentVersion(),
        timestamp: new Date().toISOString(),
        data: {
          users,
          medications,
          intakeRecords
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonData);
      
      // Clear existing data
      await db.transaction('rw', [db.users, db.medications, db.intakeRecords], async () => {
        await db.users.clear();
        await db.medications.clear();
        await db.intakeRecords.clear();

        // Import new data
        if (importData.data.users?.length > 0) {
          await db.users.bulkAdd(importData.data.users);
        }
        if (importData.data.medications?.length > 0) {
          await db.medications.bulkAdd(importData.data.medications);
        }
        if (importData.data.intakeRecords?.length > 0) {
          await db.intakeRecords.bulkAdd(importData.data.intakeRecords);
        }
      });

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

export const migrationManager = new MigrationManager();