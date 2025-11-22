import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database';
import { createTestUser, createTestMedication, createTestIntakeRecord } from '@/test/testUtils';

describe('Database', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    try {
      await db.users.clear();
      await db.medications.clear();
      await db.intakeRecords.clear();
    } catch (error) {
      // If clearing fails, delete and recreate the database
      await db.delete();
      await db.open();
    }
  });

  describe('Users table', () => {
    it('should create and retrieve a user', async () => {
      const testUser = createTestUser();
      const dbUser = {
        ...testUser,
        createdAt: testUser.createdAt.getTime(),
        updatedAt: testUser.updatedAt.getTime(),
      };

      await db.users.add(dbUser);
      const retrievedUser = await db.users.get(testUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.name).toBe(testUser.name);
      expect(retrievedUser?.age).toBe(testUser.age);
    });

    it('should automatically set timestamps on creation', async () => {
      const testUser = createTestUser();
      const dbUser = {
        ...testUser,
        createdAt: testUser.createdAt.getTime(),
        updatedAt: testUser.updatedAt.getTime(),
      };

      const beforeCreate = Date.now();
      await db.users.add(dbUser);
      const afterCreate = Date.now();

      const retrievedUser = await db.users.get(testUser.id);
      expect(retrievedUser?.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(retrievedUser?.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(retrievedUser?.updatedAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(retrievedUser?.updatedAt).toBeLessThanOrEqual(afterCreate);
    });

    it('should update timestamps on modification', async () => {
      const testUser = createTestUser();
      const dbUser = {
        ...testUser,
        createdAt: testUser.createdAt.getTime(),
        updatedAt: testUser.updatedAt.getTime(),
      };

      await db.users.add(dbUser);
      const originalUser = await db.users.get(testUser.id);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const beforeUpdate = Date.now();
      await db.users.update(testUser.id, { name: 'Updated Name' });
      const afterUpdate = Date.now();

      const updatedUser = await db.users.get(testUser.id);
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.updatedAt).toBeGreaterThan(originalUser!.updatedAt);
      expect(updatedUser?.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
      expect(updatedUser?.updatedAt).toBeLessThanOrEqual(afterUpdate);
    });
  });

  describe('Medications table', () => {
    it('should create and retrieve a medication', async () => {
      const testMedication = createTestMedication();
      const dbMedication = {
        ...testMedication,
        startDate: testMedication.startDate.getTime(),
        endDate: testMedication.endDate?.getTime(),
        createdAt: testMedication.createdAt.getTime(),
        updatedAt: testMedication.updatedAt.getTime(),
      };

      await db.medications.add(dbMedication);
      const retrievedMedication = await db.medications.get(testMedication.id);

      expect(retrievedMedication).toBeDefined();
      expect(retrievedMedication?.name).toBe(testMedication.name);
      expect(retrievedMedication?.dosage).toBe(testMedication.dosage);
      expect(retrievedMedication?.userId).toBe(testMedication.userId);
    });

    it('should filter medications by userId', async () => {
      const user1Medication = createTestMedication({ userId: 'user-1' });
      const user2Medication = createTestMedication({ userId: 'user-2', name: 'Aspirin' });

      await db.medications.add({
        ...user1Medication,
        startDate: user1Medication.startDate.getTime(),
        createdAt: user1Medication.createdAt.getTime(),
        updatedAt: user1Medication.updatedAt.getTime(),
      });

      await db.medications.add({
        ...user2Medication,
        startDate: user2Medication.startDate.getTime(),
        createdAt: user2Medication.createdAt.getTime(),
        updatedAt: user2Medication.updatedAt.getTime(),
      });

      const user1Medications = await db.medications.where('userId').equals('user-1').toArray();
      const user2Medications = await db.medications.where('userId').equals('user-2').toArray();

      expect(user1Medications).toHaveLength(1);
      expect(user1Medications[0].name).toBe('Metformin');
      expect(user2Medications).toHaveLength(1);
      expect(user2Medications[0].name).toBe('Aspirin');
    });

    it('should filter active medications', async () => {
      const activeMedication = createTestMedication({ isActive: true });
      const inactiveMedication = createTestMedication({ 
        name: 'Inactive Med', 
        isActive: false 
      });

      await db.medications.add({
        ...activeMedication,
        startDate: activeMedication.startDate.getTime(),
        createdAt: activeMedication.createdAt.getTime(),
        updatedAt: activeMedication.updatedAt.getTime(),
      });

      await db.medications.add({
        ...inactiveMedication,
        startDate: inactiveMedication.startDate.getTime(),
        createdAt: inactiveMedication.createdAt.getTime(),
        updatedAt: inactiveMedication.updatedAt.getTime(),
      });

      const activeMedications = await db.medications
        .where('userId')
        .equals('test-user-1')
        .and(med => med.isActive)
        .toArray();

      expect(activeMedications).toHaveLength(1);
      expect(activeMedications[0].name).toBe('Metformin');
    });
  });

  describe('Intake Records table', () => {
    it('should create and retrieve an intake record', async () => {
      const testRecord = createTestIntakeRecord();
      const dbRecord = {
        ...testRecord,
        scheduledTime: testRecord.scheduledTime.getTime(),
        actualTime: testRecord.actualTime?.getTime(),
        createdAt: testRecord.createdAt.getTime(),
      };

      await db.intakeRecords.add(dbRecord);
      const retrievedRecord = await db.intakeRecords.get(testRecord.id);

      expect(retrievedRecord).toBeDefined();
      expect(retrievedRecord?.medicationId).toBe(testRecord.medicationId);
      expect(retrievedRecord?.userId).toBe(testRecord.userId);
      expect(retrievedRecord?.status).toBe(testRecord.status);
    });

    it('should filter records by medicationId', async () => {
      const record1 = createTestIntakeRecord({ medicationId: 'med-1' });
      const record2 = createTestIntakeRecord({ medicationId: 'med-2' });

      await db.intakeRecords.add({
        ...record1,
        scheduledTime: record1.scheduledTime.getTime(),
        createdAt: record1.createdAt.getTime(),
      });

      await db.intakeRecords.add({
        ...record2,
        scheduledTime: record2.scheduledTime.getTime(),
        createdAt: record2.createdAt.getTime(),
      });

      const med1Records = await db.intakeRecords
        .where('medicationId')
        .equals('med-1')
        .toArray();

      expect(med1Records).toHaveLength(1);
      expect(med1Records[0].medicationId).toBe('med-1');
    });

    it('should filter records by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const todayRecord = createTestIntakeRecord({ 
        scheduledTime: today 
      });
      const yesterdayRecord = createTestIntakeRecord({ 
        scheduledTime: yesterday 
      });

      await db.intakeRecords.add({
        ...todayRecord,
        scheduledTime: todayRecord.scheduledTime.getTime(),
        createdAt: todayRecord.createdAt.getTime(),
      });

      await db.intakeRecords.add({
        ...yesterdayRecord,
        scheduledTime: yesterdayRecord.scheduledTime.getTime(),
        createdAt: yesterdayRecord.createdAt.getTime(),
      });

      const todayRecords = await db.intakeRecords
        .where('scheduledTime')
        .between(today.getTime(), tomorrow.getTime())
        .toArray();

      expect(todayRecords).toHaveLength(1);
    });
  });
});