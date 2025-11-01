import { Caregiver, AccessCode, CaregiverActivity } from '@/types';
import { db, DatabaseCaregiver, DatabaseAccessCode, DatabaseCaregiverActivity } from './database';

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
    return await db.caregivers.add(this.toDatabase(caregiver) as DatabaseCaregiver);
  }

  async getCaregiver(id: string): Promise<Caregiver | undefined> {
    const dbCaregiver = await db.caregivers.get(id);
    return dbCaregiver ? this.toCaregiver(dbCaregiver) : undefined;
  }

  async getCaregiverByPatient(patientId: string): Promise<Caregiver[]> {
    const dbCaregivers = await db.caregivers
      .where('patientId')
      .equals(patientId)
      .and((c: DatabaseCaregiver) => c.isActive)
      .toArray();
    return dbCaregivers.map((c: DatabaseCaregiver) => this.toCaregiver(c));
  }

  async updateCaregiver(id: string, updates: Partial<Caregiver>): Promise<number> {
    return await db.caregivers.update(id, this.toDatabase(updates));
  }

  // Access code operations
  async addAccessCode(code: AccessCode): Promise<string> {
    return await db.accessCodes.add(this.toAccessCodeDB(code));
  }

  async getAccessCodeByCode(code: string): Promise<AccessCode | undefined> {
    const dbCode = await db.accessCodes.where('code').equals(code).first();
    return dbCode ? this.toAccessCode(dbCode) : undefined;
  }

  async updateAccessCode(id: string, updates: Partial<AccessCode>): Promise<number> {
    const dbUpdates: any = { ...updates };
    if (updates.expiresAt) dbUpdates.expiresAt = updates.expiresAt.getTime();
    if (updates.createdAt) dbUpdates.createdAt = updates.createdAt.getTime();
    return await db.accessCodes.update(id, dbUpdates);
  }

  async deleteAccessCode(id: string): Promise<void> {
    await db.accessCodes.delete(id);
  }

  async getExpiredCodes(before: Date): Promise<AccessCode[]> {
    const timestamp = before.getTime();
    const dbCodes = await db.accessCodes
      .where('expiresAt')
      .below(timestamp)
      .toArray();
    return dbCodes.map((c: DatabaseAccessCode) => this.toAccessCode(c));
  }

  // Activity operations
  async addActivity(activity: CaregiverActivity): Promise<string> {
    return await db.caregiverActivities.add(this.toActivityDB(activity));
  }

  async getActivitiesByCaregiver(caregiverId: string, limit: number = 50): Promise<CaregiverActivity[]> {
    const dbActivities = await db.caregiverActivities
      .where('caregiverId')
      .equals(caregiverId)
      .reverse()
      .limit(limit)
      .toArray();
    return dbActivities.map((a: DatabaseCaregiverActivity) => this.toActivity(a));
  }

  async getActivitiesByPatient(patientId: string, limit: number = 50): Promise<CaregiverActivity[]> {
    const dbActivities = await db.caregiverActivities
      .where('patientId')
      .equals(patientId)
      .reverse()
      .limit(limit)
      .toArray();
    return dbActivities.map((a: DatabaseCaregiverActivity) => this.toActivity(a));
  }
}

export const caregiverRepository = new CaregiverRepository();
