import { db, DatabaseMedication } from './database';
import { Medication } from '@/types';

export class MedicationRepository {
  // Convert database medication to domain medication
  private toDomainMedication(dbMedication: DatabaseMedication): Medication {
    const result: any = {
      id: dbMedication.id,
      name: dbMedication.name,
      dosage: dbMedication.dosage,
      form: dbMedication.form,
      userId: dbMedication.userId,
      scheduleType: dbMedication.scheduleType,
      startDate: new Date(dbMedication.startDate),
      createdAt: new Date(dbMedication.createdAt),
      updatedAt: new Date(dbMedication.updatedAt),
      totalPills: dbMedication.totalPills,
      remainingPills: dbMedication.remainingPills,
      isActive: dbMedication.isActive
    };
    
    // Conditionally add optional fields
    if (dbMedication.times !== undefined) {
      result.times = dbMedication.times;
    }
    if (dbMedication.interval !== undefined) {
      result.interval = dbMedication.interval;
    }
    if (dbMedication.instructions !== undefined) {
      result.instructions = dbMedication.instructions;
    }
    if (dbMedication.pillImage !== undefined) {
      result.pillImage = dbMedication.pillImage;
    }
    if (dbMedication.endDate !== undefined) {
      result.endDate = new Date(dbMedication.endDate);
    }
    
    return result as Medication;
  }

  // Convert domain medication to database medication
  private toDatabaseMedication(medication: Omit<Medication, 'id'>): Omit<DatabaseMedication, 'id'> {
    const result: any = {
      name: medication.name,
      dosage: medication.dosage,
      form: medication.form,
      userId: medication.userId,
      scheduleType: medication.scheduleType,
      startDate: medication.startDate.getTime(),
      createdAt: medication.createdAt.getTime(),
      updatedAt: medication.updatedAt.getTime(),
      totalPills: medication.totalPills,
      remainingPills: medication.remainingPills,
      isActive: medication.isActive
    };
    
    // Conditionally add optional fields
    if (medication.times !== undefined) {
      result.times = medication.times;
    }
    if (medication.interval !== undefined) {
      result.interval = medication.interval;
    }
    if (medication.instructions !== undefined) {
      result.instructions = medication.instructions;
    }
    if (medication.pillImage !== undefined) {
      result.pillImage = medication.pillImage;
    }
    if (medication.endDate !== undefined) {
      result.endDate = medication.endDate.getTime();
    }
    
    return result as Omit<DatabaseMedication, 'id'>;
  }

  async create(medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    const now = new Date();
    const id = crypto.randomUUID();
    const medicationToCreate: Medication = {
      id,
      ...medicationData,
      createdAt: now,
      updatedAt: now
    };

    const dbMedication = this.toDatabaseMedication(medicationToCreate);
    await db.medications.add({ ...dbMedication, id });
    const createdMedication = await db.medications.get(id);
    
    if (!createdMedication) {
      throw new Error('Failed to create medication');
    }

    return this.toDomainMedication(createdMedication);
  }

  async getById(id: string): Promise<Medication | null> {
    const medication = await db.medications.get(id);
    return medication ? this.toDomainMedication(medication) : null;
  }

  async getByUserId(userId: string): Promise<Medication[]> {
    const medications = await db.medications.where('userId').equals(userId).toArray();
    return medications.map(med => this.toDomainMedication(med));
  }

  async getActiveMedications(userId: string): Promise<Medication[]> {
    const medications = await db.medications
      .where('userId')
      .equals(userId)
      .and(med => med.isActive)
      .toArray();
    
    return medications.map(med => this.toDomainMedication(med));
  }

  async getAll(): Promise<Medication[]> {
    const medications = await db.medications.toArray();
    return medications.map(med => this.toDomainMedication(med));
  }

  async update(id: string, updates: Partial<Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Medication | null> {
    const updateData: any = {
      ...updates,
      updatedAt: Date.now()
    };

    // Convert Date objects to timestamps if present
    if (updates.startDate) {
      updateData.startDate = updates.startDate.getTime();
    }
    if (updates.endDate) {
      updateData.endDate = updates.endDate.getTime();
    }

    await db.medications.update(id, updateData);
    const updatedMedication = await db.medications.get(id);
    
    return updatedMedication ? this.toDomainMedication(updatedMedication) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db.medications.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async deactivate(id: string): Promise<Medication | null> {
    return this.update(id, { isActive: false });
  }

  async getMedicationsDueForRefill(userId: string, daysAhead: number = 7): Promise<Medication[]> {
    const medications = await this.getActiveMedications(userId);
    const cutoffDate = Date.now() + (daysAhead * 24 * 60 * 60 * 1000);
    
    return medications.filter(med => {
      const daysRemaining = med.remainingPills / (med.totalPills / 30); // Rough calculation
      const refillDate = Date.now() + (daysRemaining * 24 * 60 * 60 * 1000);
      return refillDate <= cutoffDate;
    });
  }
}

export const medicationRepository = new MedicationRepository();