import { describe, it, expect } from 'vitest';
import {
  exportIntakeRecordsToCSV,
  exportDailyAdherenceToCSV,
  exportMedicationAdherenceToCSV,
  exportAdherenceReportToJSON,
  generateFilename,
} from '../dataExport';
import type { IntakeRecord, Medication } from '@/types';
import type { DailyAdherence, MedicationAdherence, AdherenceStats } from '../analytics';

describe('Data Export Utilities', () => {
  const mockMedications: Medication[] = [
    {
      id: 'med-1',
      userId: 'user-1',
      name: 'Aspirin',
      dosage: '100mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['09:00'],
      refillReminder: 7,
      totalPills: 100,
      remainingPills: 50,
      startDate: new Date('2025-10-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'med-2',
      userId: 'user-1',
      name: 'Vitamin D',
      dosage: '1000 IU',
      form: 'capsule',
      scheduleType: 'time-based',
      times: ['18:00'],
      refillReminder: 7,
      totalPills: 100,
      remainingPills: 50,
      startDate: new Date('2025-10-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockRecords: IntakeRecord[] = [
    {
      id: '1',
      userId: 'user-1',
      medicationId: 'med-1',
      scheduledTime: new Date('2025-10-20T09:00:00'),
      actualTime: new Date('2025-10-20T09:05:00'),
      status: 'taken',
      snoozeCount: 0,
      confirmedBy: 'patient',
      createdAt: new Date(),
    },
    {
      id: '2',
      userId: 'user-1',
      medicationId: 'med-2',
      scheduledTime: new Date('2025-10-20T18:00:00'),
      status: 'missed',
      snoozeCount: 1,
      confirmedBy: 'patient',
      createdAt: new Date(),
    },
  ];

  describe('exportIntakeRecordsToCSV', () => {
    it('generates CSV with correct headers', () => {
      const csv = exportIntakeRecordsToCSV(mockRecords, mockMedications);

      expect(csv).toContain('Date');
      expect(csv).toContain('Time');
      expect(csv).toContain('Medication');
      expect(csv).toContain('Dosage');
      expect(csv).toContain('Status');
      expect(csv).toContain('Scheduled Time');
      expect(csv).toContain('Actual Time');
    });

    it('includes medication data in CSV rows', () => {
      const csv = exportIntakeRecordsToCSV(mockRecords, mockMedications);

      expect(csv).toContain('Aspirin');
      expect(csv).toContain('100mg');
      expect(csv).toContain('taken');
      expect(csv).toContain('Vitamin D');
      expect(csv).toContain('missed');
    });

    it('handles records with unknown medications', () => {
      const recordsWithUnknown: IntakeRecord[] = [
        {
          id: '3',
          userId: 'user-1',
          medicationId: 'unknown-med',
          scheduledTime: new Date('2025-10-20T12:00:00'),
          status: 'taken',
          snoozeCount: 0,
          confirmedBy: 'patient',
          createdAt: new Date(),
        },
      ];

      const csv = exportIntakeRecordsToCSV(recordsWithUnknown, mockMedications);

      expect(csv).toContain('Unknown');
    });

    it('calculates delay in minutes correctly', () => {
      const csv = exportIntakeRecordsToCSV(mockRecords, mockMedications);

      // First record taken 5 minutes late
      expect(csv).toContain('5');
    });
  });

  describe('exportDailyAdherenceToCSV', () => {
    it('generates CSV with correct headers', () => {
      const dailyData: DailyAdherence[] = [
        {
          date: '2025-10-20',
          adherenceRate: 50,
          taken: 1,
          missed: 1,
          skipped: 0,
          total: 2,
        },
      ];

      const csv = exportDailyAdherenceToCSV(dailyData);

      expect(csv).toContain('Date');
      expect(csv).toContain('Adherence Rate (%)');
      expect(csv).toContain('Taken');
      expect(csv).toContain('Missed');
      expect(csv).toContain('Skipped');
      expect(csv).toContain('Total');
    });

    it('includes daily adherence data in rows', () => {
      const dailyData: DailyAdherence[] = [
        {
          date: '2025-10-20',
          adherenceRate: 50,
          taken: 1,
          missed: 1,
          skipped: 0,
          total: 2,
        },
      ];

      const csv = exportDailyAdherenceToCSV(dailyData);

      expect(csv).toContain('2025-10-20');
      expect(csv).toContain('50.00');
      expect(csv).toContain('"1"');
      expect(csv).toContain('"2"');
    });
  });

  describe('exportMedicationAdherenceToCSV', () => {
    it('generates CSV with correct headers', () => {
      const medAdherence: MedicationAdherence[] = [
        {
          medicationId: 'med-1',
          medicationName: 'Aspirin',
          adherenceRate: 75,
          totalDoses: 4,
          takenDoses: 3,
          missedDoses: 1,
          skippedDoses: 0,
        },
      ];

      const csv = exportMedicationAdherenceToCSV(medAdherence);

      expect(csv).toContain('Medication');
      expect(csv).toContain('Adherence Rate (%)');
      expect(csv).toContain('Total Doses');
      expect(csv).toContain('Taken');
      expect(csv).toContain('Missed');
      expect(csv).toContain('Skipped');
    });

    it('includes medication adherence data in rows', () => {
      const medAdherence: MedicationAdherence[] = [
        {
          medicationId: 'med-1',
          medicationName: 'Aspirin',
          adherenceRate: 75,
          totalDoses: 4,
          takenDoses: 3,
          missedDoses: 1,
          skippedDoses: 0,
        },
      ];

      const csv = exportMedicationAdherenceToCSV(medAdherence);

      expect(csv).toContain('Aspirin');
      expect(csv).toContain('75.00');
      expect(csv).toContain('"4"');
      expect(csv).toContain('"3"');
    });
  });

  describe('exportAdherenceReportToJSON', () => {
    it('generates valid JSON', () => {
      const stats: AdherenceStats = {
        overall: 75,
        daily: 75,
        weekly: 75,
        monthly: 75,
        totalDoses: 4,
        takenDoses: 3,
        missedDoses: 1,
        skippedDoses: 0,
        onTimeRate: 66.67,
      };

      const dailyData: DailyAdherence[] = [
        {
          date: '2025-10-20',
          adherenceRate: 50,
          taken: 1,
          missed: 1,
          skipped: 0,
          total: 2,
        },
      ];

      const medicationAdherence: MedicationAdherence[] = [
        {
          medicationId: 'med-1',
          medicationName: 'Aspirin',
          adherenceRate: 75,
          totalDoses: 4,
          takenDoses: 3,
          missedDoses: 1,
          skippedDoses: 0,
        },
      ];

      const json = exportAdherenceReportToJSON({
        stats,
        dailyData,
        medicationAdherence,
        records: mockRecords,
        medications: mockMedications,
        exportDate: new Date('2025-10-28'),
      });

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes all required sections in JSON export', () => {
      const stats: AdherenceStats = {
        overall: 75,
        daily: 75,
        weekly: 75,
        monthly: 75,
        totalDoses: 4,
        takenDoses: 3,
        missedDoses: 1,
        skippedDoses: 0,
        onTimeRate: 66.67,
      };

      const dailyData: DailyAdherence[] = [];
      const medicationAdherence: MedicationAdherence[] = [];

      const json = exportAdherenceReportToJSON({
        stats,
        dailyData,
        medicationAdherence,
        records: mockRecords,
        medications: mockMedications,
        exportDate: new Date('2025-10-28'),
      });

      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('exportDate');
      expect(parsed).toHaveProperty('period');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('dailyAdherence');
      expect(parsed).toHaveProperty('medicationAdherence');
      expect(parsed).toHaveProperty('medications');
      expect(parsed).toHaveProperty('records');
    });

    it('includes summary statistics in JSON', () => {
      const stats: AdherenceStats = {
        overall: 75,
        daily: 75,
        weekly: 75,
        monthly: 75,
        totalDoses: 4,
        takenDoses: 3,
        missedDoses: 1,
        skippedDoses: 0,
        onTimeRate: 66.67,
      };

      const json = exportAdherenceReportToJSON({
        stats,
        dailyData: [],
        medicationAdherence: [],
        records: mockRecords,
        medications: mockMedications,
        exportDate: new Date('2025-10-28'),
      });

      const parsed = JSON.parse(json);

      expect(parsed.summary.overallAdherence).toBe(75);
      expect(parsed.summary.totalDoses).toBe(4);
      expect(parsed.summary.takenDoses).toBe(3);
      expect(parsed.summary.missedDoses).toBe(1);
    });
  });

  describe('generateFilename', () => {
    it('generates filename with prefix and extension', () => {
      const filename = generateFilename('test-report', 'csv');

      expect(filename).toContain('test-report');
      expect(filename).toContain('.csv');
    });

    it('includes current date in filename', () => {
      const filename = generateFilename('report', 'json');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toContain(today);
    });

    it('formats filename correctly', () => {
      const filename = generateFilename('adherence', 'pdf');

      expect(filename).toMatch(/^adherence_\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });
});
