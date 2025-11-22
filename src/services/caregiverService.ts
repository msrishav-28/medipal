import { Caregiver, AccessCode, CaregiverActivity } from '@/types';
import { caregiverRepository } from './caregiverRepository';
import { db } from './database';

export class CaregiverService {
  private static instance: CaregiverService;

  private constructor() {}

  static getInstance(): CaregiverService {
    if (!CaregiverService.instance) {
      CaregiverService.instance = new CaregiverService();
    }
    return CaregiverService.instance;
  }

  /**
   * Generate a unique 6-character access code
   */
  generateAccessCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new access code for a patient
   */
  async createAccessCode(patientId: string): Promise<AccessCode> {
    const code = this.generateAccessCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

    const accessCode: AccessCode = {
      id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code,
      patientId,
      expiresAt,
      isUsed: false,
      createdAt: new Date()
    };

    // Store in database
    await caregiverRepository.addAccessCode(accessCode);

    return accessCode;
  }

  /**
   * Validate and use an access code
   */
  async validateAccessCode(code: string): Promise<AccessCode | null> {
    const accessCode = await caregiverRepository.getAccessCodeByCode(code);

    if (!accessCode) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(accessCode.expiresAt)) {
      return null;
    }

    // Check if already used
    if (accessCode.isUsed) {
      return null;
    }

    return accessCode;
  }

  /**
   * Mark access code as used
   */
  async markAccessCodeUsed(accessCodeId: string, caregiverId: string): Promise<void> {
    await caregiverRepository.updateAccessCode(accessCodeId, {
      isUsed: true,
      caregiverId
    } as any);
  }

  /**
   * Register a new caregiver
   */
  async registerCaregiver(
    accessCode: string,
    caregiverData: {
      name: string;
      email: string;
      phone?: string;
      relationship: string;
    }
  ): Promise<Caregiver> {
    // Validate access code
    const validCode = await this.validateAccessCode(accessCode);
    
    if (!validCode) {
      throw new Error('Invalid or expired access code');
    }

    const phone = caregiverData.phone ?? undefined;

    const caregiver: Caregiver = {
      id: `caregiver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId: validCode.patientId,
      name: caregiverData.name,
      email: caregiverData.email,
      ...(phone && { phone }),
      relationship: caregiverData.relationship,
      accessLevel: 'view', // Default to view-only
      isActive: true,
      notificationPreferences: {
        missedDose: true,
        criticalMedication: true,
        weeklyReport: true,
        smsEnabled: !!caregiverData.phone,
        emailEnabled: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save caregiver
    await caregiverRepository.addCaregiver(caregiver);

    // Mark access code as used
    await this.markAccessCodeUsed(validCode.id, caregiver.id);

    return caregiver;
  }

  /**
   * Get all caregivers for a patient
   */
  async getCaregiversForPatient(patientId: string): Promise<Caregiver[]> {
    return await caregiverRepository.getCaregiverByPatient(patientId);
  }

  /**
   * Get caregiver by ID
   */
  async getCaregiverById(caregiverId: string): Promise<Caregiver | undefined> {
    return await caregiverRepository.getCaregiver(caregiverId);
  }

  /**
   * Update caregiver access level
   */
  async updateAccessLevel(
    caregiverId: string,
    accessLevel: 'view' | 'manage'
  ): Promise<void> {
    await caregiverRepository.updateCaregiver(caregiverId, {
      accessLevel,
      updatedAt: new Date()
    });
  }

  /**
   * Update caregiver notification preferences
   */
  async updateNotificationPreferences(
    caregiverId: string,
    preferences: Partial<Caregiver['notificationPreferences']>
  ): Promise<void> {
    const caregiver = await this.getCaregiverById(caregiverId);
    if (!caregiver) {
      throw new Error('Caregiver not found');
    }

    await caregiverRepository.updateCaregiver(caregiverId, {
      notificationPreferences: {
        ...caregiver.notificationPreferences,
        ...preferences
      },
      updatedAt: new Date()
    });
  }

  /**
   * Deactivate caregiver access
   */
  async deactivateCaregiver(caregiverId: string): Promise<void> {
    await caregiverRepository.updateCaregiver(caregiverId, {
      isActive: false,
      updatedAt: new Date()
    });
  }

  /**
   * Reactivate caregiver access
   */
  async reactivateCaregiver(caregiverId: string): Promise<void> {
    await caregiverRepository.updateCaregiver(caregiverId, {
      isActive: true,
      updatedAt: new Date()
    });
  }

  /**
   * Log caregiver activity
   */
  async logActivity(
    caregiverId: string,
    patientId: string,
    action: CaregiverActivity['action'],
    details?: string
  ): Promise<void> {
    const activity: CaregiverActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      caregiverId,
      patientId,
      action,
      details: details ?? undefined,
      timestamp: new Date()
    };

    await caregiverRepository.addActivity(activity);

    // Update last access time
    await caregiverRepository.updateCaregiver(caregiverId, {
      lastAccess: new Date()
    });
  }

  /**
   * Get caregiver activity log
   */
  async getActivityLog(
    caregiverId: string,
    limit: number = 50
  ): Promise<CaregiverActivity[]> {
    return await caregiverRepository.getActivitiesByCaregiver(caregiverId, limit);
  }

  /**
   * Get patient activity for caregiver
   */
  async getPatientActivity(
    patientId: string,
    limit: number = 50
  ): Promise<CaregiverActivity[]> {
    return await caregiverRepository.getActivitiesByPatient(patientId, limit);
  }

  /**
   * Check if caregiver has permission for action
   */
  async hasPermission(
    caregiverId: string,
    requiredLevel: 'view' | 'manage'
  ): Promise<boolean> {
    const caregiver = await this.getCaregiverById(caregiverId);
    
    if (!caregiver || !caregiver.isActive) {
      return false;
    }

    if (requiredLevel === 'view') {
      return true; // All active caregivers can view
    }

    return caregiver.accessLevel === 'manage';
  }

  /**
   * Generate share link with access code
   */
  async generateShareLink(patientId: string): Promise<{ code: string; link: string; expiresAt: Date }> {
    const accessCode = await this.createAccessCode(patientId);
    
    // In a real app, this would be the actual app URL
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/caregiver/register?code=${accessCode.code}`;

    return {
      code: accessCode.code,
      link,
      expiresAt: accessCode.expiresAt
    };
  }

  /**
   * Clean up expired access codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    const now = new Date();
    const expiredCodes = await db.accessCodes
      .where('expiresAt')
      .below(now)
      .toArray();

    for (const code of expiredCodes) {
      await db.accessCodes.delete(code.id);
    }

    return expiredCodes.length;
  }
}

export const caregiverService = CaregiverService.getInstance();
