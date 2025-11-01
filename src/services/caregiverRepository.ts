import { Caregiver, AccessCode, CaregiverActivity } from '@/types';
import { databaseService, DatabaseCaregiver, DatabaseAccessCode, DatabaseCaregiverActivity } from './database';

/**
 * Repository for caregiver data with automatic Date/number conversion
 */
export class CaregiverRepository {
  /**
   * Convert database caregiver to domain model
   */
  private toCaregiver(dbCaregiver: DatabaseCaregiver): Caregiver {
    return {
      ...dbCaregiver,
      accessCodeExpiry: dbCaregiver.accessCodeExpiry ? new Date(dbCaregiver.accessCodeExpiry) : undefined,
      lastAccess: dbCaregiver.lastAccess ? new Date(dbCaregiver.lastAccess) : undefined,
      createdAt: new Date(dbCaregiver.createdAt),
      updatedAt: new Date(dbCaregiver.updatedAt)
    };
  }

  /**
   * Convert domain caregiver to database model
   */
  private toDatabase(caregiver: Partial<Caregiver>): Partial<DatabaseCaregiver> {
    const db: any = { ...caregiver };
    if (caregiver.accessCodeExpiry) db.accessCodeExpiry = caregiver.accessCodeExpiry.getTime();
    if (caregiver.lastAccess) db.lastAccess = caregiver.lastAccess.getTime();
    if (caregiver.createdAt) db.createdAt = caregiver.createdAt.getTime();
    if (caregiver.updatedAt) db.updatedAt = caregiver.updatedAt.getTime();
    return db;
  }

  /**
   * Convert database access code to domain model
   */
  private toAccessCode(dbCode: DatabaseAccessCode): AccessCode {
    return {
      ...dbCode,
      expiresAt: new Date(dbCode.expiresAt),
      createdAt: new Date(dbCode.createdAt)
    };
  }

  /**
   * Convert domain access code to database model
   */
  private toAccessCodeDB(code: AccessCode): DatabaseAccessCode {
    return {
      ...code,
      expiresAt: code.expiresAt.getTime(),
      createdAt: code.createdAt.getTime()
    };
  }

  /**
   * Convert database activity to domain model
   */
  private toActivity(dbActivity: DatabaseCaregiverActivity): CaregiverActivity {
    return {
      ...dbActivity,
      timestamp: new Date(dbActivity.timestamp)
    };
  }

  /**
   * Convert domain activity to database model
   */
  private toActivityDB(activity: CaregiverActivity): DatabaseCaregiverActivity {
    return {
      ...activity,
      timestamp: activity.timestamp.getTime()
    };
  }

  // Caregiver operations
  async addCaregiver(caregiver: Caregiver): Promise<string> {
    return await databaseService.caregivers.add(this.toDatabase(caregiver) as DatabaseCaregiver);
  }

  async getCaregiver(id: string): Promise<Caregiver | undefined> {
    const db = await databaseService.caregivers.get(id);
    return db ? this.toCaregiver(db) : undefined;
  }

  async getCaregiverByPatient(patientId: string): Promise<Caregiver[]> {
    const dbCaregivers = await databaseService.caregivers
      .where('patientId')
      .equals(patientId)
      .and((c: any) => c.isActive)
      .toArray();
    return dbCaregivers.map(c => this.toCaregiver(c));
  }

  async updateCaregiver(id: string, updates: Partial<Caregiver>): Promise<number> {
    return await databaseService.caregivers.update(id, this.toDatabase(updates));
  }

  // Access code operations
  async addAccessCode(code: AccessCode): Promise<string> {
    return await databaseService.accessCodes.add(this.toAccessCodeDB(code));
  }

  async getAccessCodeByCode(code: string): Promise<AccessCode | undefined> {
    const db = await databaseService.accessCodes.where('code').equals(code).first();
    return db ? this.toAccessCode(db) : undefined;
  }

  async updateAccessCode(id: string, updates: Partial<AccessCode>): Promise<number> {
    const dbUpdates: any = { ...updates };
    if (updates.expiresAt) dbUpdates.expiresAt = updates.expiresAt.getTime();
    if (updates.createdAt) dbUpdates.createdAt = updates.createdAt.getTime();
    return await databaseService.accessCodes.update(id, dbUpdates);
  }

  async deleteAccessCode(id: string): Promise<void> {
    await databaseService.accessCodes.delete(id);
  }

  async getExpiredCodes(before: Date): Promise<AccessCode[]> {
    const timestamp = before.getTime();
    const dbCodes = await databaseService.accessCodes
      .where('expiresAt')
      .below(timestamp)
      .toArray();
    return dbCodes.map(c => this.toAccessCode(c));
  }

  // Activity operations
  async addActivity(activity: CaregiverActivity): Promise<string> {
    return await databaseService.caregiverActivities.add(this.toActivityDB(activity));
  }

  async getActivitiesByCaregiver(caregiverId: string, limit: number = 50): Promise<CaregiverActivity[]> {
    const dbActivities = await databaseService.caregiverActivities
      .where('caregiverId')
      .equals(caregiverId)
      .reverse()
      .limit(limit)
      .toArray();
    return dbActivities.map(a => this.toActivity(a));
  }

  async getActivitiesByPatient(patientId: string, limit: number = 50): Promise<CaregiverActivity[]> {
    const dbActivities = await databaseService.caregiverActivities
      .where('patientId')
      .equals(patientId)
      .reverse()
      .limit(limit)
      .toArray();
    return dbActivities.map(a => this.toActivity(a));
  }
}

export const caregiverRepository = new CaregiverRepository();
