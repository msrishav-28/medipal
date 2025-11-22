import { describe, it, expect, beforeEach, vi } from 'vitest';
import { caregiverService } from '../caregiverService';
import { caregiverRepository } from '../caregiverRepository';
import type { Caregiver, AccessCode } from '../../types';

// Mock the repository and database service
vi.mock('../caregiverRepository', () => ({
  caregiverRepository: {
    addCaregiver: vi.fn(),
    getCaregiver: vi.fn(),
    getCaregiverByPatient: vi.fn(),
    updateCaregiver: vi.fn(),
    addAccessCode: vi.fn(),
    getAccessCodeByCode: vi.fn(),
    updateAccessCode: vi.fn(),
    addActivity: vi.fn(),
    getActivitiesByCaregiver: vi.fn(),
    getActivitiesByPatient: vi.fn(),
  }
}));

vi.mock('../database', () => ({
  databaseService: {
    accessCodes: {
      where: vi.fn().mockReturnValue({
        below: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      }),
      delete: vi.fn()
    }
  }
}));

describe('caregiverService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAccessCode', () => {
    it('should generate a 6-character alphanumeric code', () => {
      const code = caregiverService.generateAccessCode();
      
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        codes.add(caregiverService.generateAccessCode());
      }
      
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('createAccessCode', () => {
    it('should create a new access code with 24-hour expiry', async () => {
      vi.mocked(caregiverRepository.addAccessCode).mockResolvedValue('access-1');

      const result = await caregiverService.createAccessCode('patient-1');

      expect(result.patientId).toBe('patient-1');
      expect(result.code).toHaveLength(6);
      expect(result.isUsed).toBe(false);
      expect(caregiverRepository.addAccessCode).toHaveBeenCalled();
    });
  });

  describe('validateAccessCode', () => {
    it('should return access code when valid', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 12);

      const mockAccessCode: AccessCode = {
        id: 'access-1',
        code: 'ABC123',
        patientId: 'patient-1',
        expiresAt: futureDate,
        isUsed: false,
        createdAt: new Date()
      };

      vi.mocked(caregiverRepository.getAccessCodeByCode).mockResolvedValue(mockAccessCode);

      const result = await caregiverService.validateAccessCode('ABC123');

      expect(result).toEqual(mockAccessCode);
    });

    it('should return null when code is expired', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const mockAccessCode: AccessCode = {
        id: 'access-1',
        code: 'ABC123',
        patientId: 'patient-1',
        expiresAt: pastDate,
        isUsed: false,
        createdAt: new Date()
      };

      vi.mocked(caregiverRepository.getAccessCodeByCode).mockResolvedValue(mockAccessCode);

      const result = await caregiverService.validateAccessCode('ABC123');

      expect(result).toBeNull();
    });
  });

  describe('registerCaregiver', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 12);

    const mockAccessCode: AccessCode = {
      id: 'access-1',
      code: 'ABC123',
      patientId: 'patient-1',
      expiresAt: futureDate,
      isUsed: false,
      createdAt: new Date()
    };

    it('should successfully register a new caregiver', async () => {
      vi.mocked(caregiverRepository.getAccessCodeByCode).mockResolvedValue(mockAccessCode);
      vi.mocked(caregiverRepository.addCaregiver).mockResolvedValue('caregiver-1');
      vi.mocked(caregiverRepository.updateAccessCode).mockResolvedValue(1);

      const result = await caregiverService.registerCaregiver('ABC123', {
        name: 'John Doe',
        email: 'john@example.com',
        relationship: 'spouse'
      });

      expect(result.patientId).toBe('patient-1');
      expect(result.name).toBe('John Doe');
      expect(result.accessLevel).toBe('view');
      expect(caregiverRepository.addCaregiver).toHaveBeenCalled();
    });

    it('should throw error with invalid access code', async () => {
      vi.mocked(caregiverRepository.getAccessCodeByCode).mockResolvedValue(undefined);

      await expect(
        caregiverService.registerCaregiver('INVALID', {
          name: 'John Doe',
          email: 'john@example.com',
          relationship: 'spouse'
        })
      ).rejects.toThrow('Invalid or expired access code');
    });
  });

  describe('hasPermission', () => {
    it('should return true for active caregiver with view permission', async () => {
      const mockCaregiver: Caregiver = {
        id: 'caregiver-1',
        patientId: 'patient-1',
        name: 'John Doe',
        email: 'john@example.com',
        relationship: 'spouse',
        accessLevel: 'view',
        notificationPreferences: {
          missedDose: true,
          criticalMedication: true,
          weeklyReport: true,
          smsEnabled: false,
          emailEnabled: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(caregiverRepository.getCaregiver).mockResolvedValue(mockCaregiver);

      const result = await caregiverService.hasPermission('caregiver-1', 'view');

      expect(result).toBe(true);
    });

    it('should return false for inactive caregiver', async () => {
      const mockCaregiver: Caregiver = {
        id: 'caregiver-1',
        patientId: 'patient-1',
        name: 'John Doe',
        email: 'john@example.com',
        relationship: 'spouse',
        accessLevel: 'view',
        notificationPreferences: {
          missedDose: true,
          criticalMedication: true,
          weeklyReport: true,
          smsEnabled: false,
          emailEnabled: true
        },
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(caregiverRepository.getCaregiver).mockResolvedValue(mockCaregiver);

      const result = await caregiverService.hasPermission('caregiver-1', 'view');

      expect(result).toBe(false);
    });
  });

  describe('updateAccessLevel', () => {
    it('should update caregiver access level', async () => {
      vi.mocked(caregiverRepository.updateCaregiver).mockResolvedValue(1);

      await caregiverService.updateAccessLevel('caregiver-1', 'manage');

      expect(caregiverRepository.updateCaregiver).toHaveBeenCalledWith(
        'caregiver-1',
        expect.objectContaining({
          accessLevel: 'manage'
        })
      );
    });
  });

  describe('deactivateCaregiver', () => {
    it('should deactivate caregiver', async () => {
      vi.mocked(caregiverRepository.updateCaregiver).mockResolvedValue(1);

      await caregiverService.deactivateCaregiver('caregiver-1');

      expect(caregiverRepository.updateCaregiver).toHaveBeenCalledWith(
        'caregiver-1',
        expect.objectContaining({
          isActive: false
        })
      );
    });
  });

  describe('logActivity', () => {
    it('should log caregiver activity', async () => {
      vi.mocked(caregiverRepository.addActivity).mockResolvedValue('activity-1');
      vi.mocked(caregiverRepository.updateCaregiver).mockResolvedValue(1);

      await caregiverService.logActivity(
        'caregiver-1',
        'patient-1',
        'view_dashboard',
        'Viewed dashboard'
      );

      expect(caregiverRepository.addActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          caregiverId: 'caregiver-1',
          patientId: 'patient-1',
          action: 'view_dashboard'
        })
      );
    });
  });
});
