import { db, DatabaseIntakeRecord } from './database';
import { IntakeRecord } from '@/types';

export class IntakeRepository {
  // Convert database intake record to domain intake record
  private toDomainIntakeRecord(dbRecord: DatabaseIntakeRecord): IntakeRecord {
    const result: any = {
      id: dbRecord.id,
      status: dbRecord.status,
      userId: dbRecord.userId,
      medicationId: dbRecord.medicationId,
      scheduledTime: new Date(dbRecord.scheduledTime),
      createdAt: new Date(dbRecord.createdAt),
      snoozeCount: dbRecord.snoozeCount,
      confirmedBy: dbRecord.confirmedBy
    };
    
    // Conditionally add optional fields
    if (dbRecord.actualTime !== undefined) {
      result.actualTime = new Date(dbRecord.actualTime);
    }
    if (dbRecord.location !== undefined) {
      result.location = dbRecord.location;
    }
    if (dbRecord.skipReason !== undefined) {
      result.skipReason = dbRecord.skipReason;
    }
    
    return result as IntakeRecord;
  }

  // Convert domain intake record to database intake record
  private toDatabaseIntakeRecord(record: Omit<IntakeRecord, 'id'>): Omit<DatabaseIntakeRecord, 'id'> {
    const result: any = {
      status: record.status,
      userId: record.userId,
      medicationId: record.medicationId,
      scheduledTime: record.scheduledTime.getTime(),
      createdAt: record.createdAt.getTime(),
      snoozeCount: record.snoozeCount,
      confirmedBy: record.confirmedBy
    };
    
    // Conditionally add optional fields
    if (record.actualTime !== undefined) {
      result.actualTime = record.actualTime.getTime();
    }
    if (record.location !== undefined) {
      result.location = record.location;
    }
    if (record.skipReason !== undefined) {
      result.skipReason = record.skipReason;
    }
    
    return result as Omit<DatabaseIntakeRecord, 'id'>;
  }

  async create(recordData: Omit<IntakeRecord, 'id' | 'createdAt'>): Promise<IntakeRecord> {
    const id = crypto.randomUUID();
    const recordToCreate: IntakeRecord = {
      id,
      ...recordData,
      createdAt: new Date()
    };

    const dbRecord = this.toDatabaseIntakeRecord(recordToCreate);
    await db.intakeRecords.add({ ...dbRecord, id });
    const createdRecord = await db.intakeRecords.get(id);
    
    if (!createdRecord) {
      throw new Error('Failed to create intake record');
    }

    return this.toDomainIntakeRecord(createdRecord);
  }

  async getById(id: string): Promise<IntakeRecord | null> {
    const record = await db.intakeRecords.get(id);
    return record ? this.toDomainIntakeRecord(record) : null;
  }

  async getByMedicationId(medicationId: string): Promise<IntakeRecord[]> {
    const records = await db.intakeRecords
      .where('medicationId')
      .equals(medicationId)
      .reverse()
      .sortBy('scheduledTime');
    
    return records.map(record => this.toDomainIntakeRecord(record));
  }

  async getByUserId(userId: string): Promise<IntakeRecord[]> {
    const records = await db.intakeRecords
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('scheduledTime');
    
    return records.map(record => this.toDomainIntakeRecord(record));
  }

  async getByDateRange(userId: string, startDate: Date, endDate: Date): Promise<IntakeRecord[]> {
    const records = await db.intakeRecords
      .where('userId')
      .equals(userId)
      .and(record => 
        record.scheduledTime >= startDate.getTime() && 
        record.scheduledTime <= endDate.getTime()
      )
      .sortBy('scheduledTime');
    
    return records.map(record => this.toDomainIntakeRecord(record));
  }

  async getTodaysRecords(userId: string): Promise<IntakeRecord[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return this.getByDateRange(userId, startOfDay, endOfDay);
  }

  async getMissedDoses(userId: string, hoursBack: number = 24): Promise<IntakeRecord[]> {
    const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    
    const records = await db.intakeRecords
      .where('userId')
      .equals(userId)
      .and(record => 
        record.scheduledTime >= cutoffTime.getTime() && 
        record.status === 'missed'
      )
      .sortBy('scheduledTime');
    
    return records.map(record => this.toDomainIntakeRecord(record));
  }

  async update(id: string, updates: Partial<Omit<IntakeRecord, 'id' | 'createdAt'>>): Promise<IntakeRecord | null> {
    const updateData: any = { ...updates };

    // Convert Date objects to timestamps if present
    if (updates.scheduledTime) {
      updateData.scheduledTime = updates.scheduledTime.getTime();
    }
    if (updates.actualTime) {
      updateData.actualTime = updates.actualTime.getTime();
    }

    await db.intakeRecords.update(id, updateData);
    const updatedRecord = await db.intakeRecords.get(id);
    
    return updatedRecord ? this.toDomainIntakeRecord(updatedRecord) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db.intakeRecords.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async markAsTaken(id: string, actualTime?: Date): Promise<IntakeRecord | null> {
    return this.update(id, {
      status: 'taken',
      actualTime: actualTime || new Date()
    });
  }

  async markAsSkipped(id: string, reason?: string): Promise<IntakeRecord | null> {
    const updates: any = {
      status: 'skipped'
    };
    if (reason !== undefined) {
      updates.skipReason = reason;
    }
    return this.update(id, updates);
  }

  async markAsMissed(id: string): Promise<IntakeRecord | null> {
    return this.update(id, {
      status: 'missed'
    });
  }

  async calculateAdherenceRate(userId: string, days: number = 30): Promise<number> {
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const endDate = new Date();
    
    const records = await this.getByDateRange(userId, startDate, endDate);
    
    if (records.length === 0) return 0;
    
    const takenCount = records.filter(record => record.status === 'taken').length;
    return (takenCount / records.length) * 100;
  }

  async getStreakData(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakType: 'daily' | 'weekly';
  }> {
    // Get records for the last 90 days to calculate streaks
    const startDate = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
    const endDate = new Date();
    
    const records = await this.getByDateRange(userId, startDate, endDate);
    
    // Group records by date
    const recordsByDate = new Map<string, IntakeRecord[]>();
    records.forEach(record => {
      const dateKey = record.scheduledTime.toDateString();
      if (!recordsByDate.has(dateKey)) {
        recordsByDate.set(dateKey, []);
      }
      recordsByDate.get(dateKey)!.push(record);
    });

    // Calculate daily adherence for each date
    const dailyAdherence: { date: string; adherent: boolean }[] = [];
    
    for (const [dateKey, dayRecords] of recordsByDate) {
      const takenCount = dayRecords.filter(r => r.status === 'taken').length;
      const adherenceRate = takenCount / dayRecords.length;
      
      dailyAdherence.push({
        date: dateKey,
        adherent: adherenceRate >= 0.8 // 80% adherence threshold
      });
    }

    // Sort by date
    dailyAdherence.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate current streak (from most recent date backwards)
    let currentStreak = 0;
    for (let i = dailyAdherence.length - 1; i >= 0; i--) {
      const day = dailyAdherence[i];
      if (day && day.adherent) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const day of dailyAdherence) {
      if (day.adherent) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      streakType: 'daily'
    };
  }

  async getAdherenceStatistics(userId: string, days: number = 30): Promise<{
    adherenceRate: number;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    skippedDoses: number;
    onTimeRate: number; // Percentage taken within 30 minutes of scheduled time
  }> {
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const endDate = new Date();
    
    const records = await this.getByDateRange(userId, startDate, endDate);
    
    const totalDoses = records.length;
    const takenDoses = records.filter(r => r.status === 'taken').length;
    const missedDoses = records.filter(r => r.status === 'missed').length;
    const skippedDoses = records.filter(r => r.status === 'skipped').length;
    
    // Calculate on-time rate (taken within 30 minutes of scheduled time)
    const onTimeDoses = records.filter(record => {
      if (record.status !== 'taken' || !record.actualTime) return false;
      
      const timeDiff = Math.abs(record.actualTime.getTime() - record.scheduledTime.getTime());
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      return timeDiff <= thirtyMinutes;
    }).length;

    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
    const onTimeRate = takenDoses > 0 ? (onTimeDoses / takenDoses) * 100 : 0;

    return {
      adherenceRate,
      totalDoses,
      takenDoses,
      missedDoses,
      skippedDoses,
      onTimeRate
    };
  }

  async getIntakeHistory(userId: string, limit: number = 50): Promise<IntakeRecord[]> {
    const records = await db.intakeRecords
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
    
    return records
      .slice(0, limit)
      .map(record => this.toDomainIntakeRecord(record));
  }
}

export const intakeRepository = new IntakeRepository();