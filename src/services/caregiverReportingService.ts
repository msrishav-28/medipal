import { db, DatabaseIntakeRecord } from './database';
import { caregiverNotificationService } from './caregiverNotificationService';
import { IntakeRecord, Medication } from '../types';

export interface AdherenceStats {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  adherenceRate: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface MedicationAdherence {
  medication: Medication;
  stats: AdherenceStats;
  recentIntakes: IntakeRecord[];
}

export interface PatientReport {
  patientId: string;
  patientName: string;
  period: {
    start: Date;
    end: Date;
  };
  overallAdherence: AdherenceStats;
  medicationBreakdown: MedicationAdherence[];
  missedDoseAlerts: number;
  criticalAlerts: number;
  generatedAt: Date;
}

/**
 * Service for generating caregiver reports
 */
class CaregiverReportingService {
  /**
   * Calculate adherence statistics for a period
   */
  private calculateAdherence(intakes: IntakeRecord[], startDate: Date, endDate: Date): AdherenceStats {
    const takenDoses = intakes.filter(i => i.status === 'taken').length;
    const missedDoses = intakes.filter(i => i.status === 'missed').length;
    const skippedDoses = intakes.filter(i => i.status === 'skipped').length;
    const totalDoses = intakes.length;

    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    return {
      totalDoses,
      takenDoses,
      missedDoses,
      skippedDoses,
      adherenceRate,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  /**
   * Get intake records for a period
   */
  private async getIntakesForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IntakeRecord[]> {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const dbIntakes = await db.intakeRecords
      .where('userId')
      .equals(userId)
      .and((record: DatabaseIntakeRecord) => {
        const scheduledTime = record.scheduledTime;
        return scheduledTime >= startTime && scheduledTime <= endTime;
      })
      .toArray();

    return dbIntakes.map((i: DatabaseIntakeRecord) => {
      const intake: IntakeRecord = {
        id: i.id,
        medicationId: i.medicationId,
        userId: i.userId,
        scheduledTime: new Date(i.scheduledTime),
        status: i.status,
        snoozeCount: i.snoozeCount,
        confirmedBy: i.confirmedBy,
        createdAt: new Date(i.createdAt)
      };
      if (i.skipReason) {
        intake.skipReason = i.skipReason;
      }
      if (i.location) {
        intake.location = i.location;
      }
      if (i.actualTime) {
        intake.actualTime = new Date(i.actualTime);
      }
      return intake;
    });
  }

  /**
   * Generate a weekly adherence report
   */
  async generateWeeklyReport(patientId: string): Promise<PatientReport> {
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return await this.generateReport(patientId, startDate, endDate);
  }

  /**
   * Generate a monthly adherence report
   */
  async generateMonthlyReport(patientId: string): Promise<PatientReport> {
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return await this.generateReport(patientId, startDate, endDate);
  }

  /**
   * Generate a custom period report
   */
  async generateReport(patientId: string, startDate: Date, endDate: Date): Promise<PatientReport> {
    // Get patient information
    const user = await db.users.get(patientId);
    if (!user) {
      throw new Error('Patient not found');
    }

    // Get all intake records for the period
    const allIntakes = await this.getIntakesForPeriod(patientId, startDate, endDate);

    // Calculate overall adherence
    const overallAdherence = this.calculateAdherence(allIntakes, startDate, endDate);

    // Get active medications
    const medications = await db.medications
      .where('userId')
      .equals(patientId)
      .and((med: any) => med.isActive)
      .toArray();

    // Calculate adherence per medication
    const medicationBreakdown: MedicationAdherence[] = [];

    for (const dbMed of medications) {
      const medication: Medication = {
        id: dbMed.id,
        userId: dbMed.userId,
        name: dbMed.name,
        dosage: dbMed.dosage,
        form: dbMed.form,
        scheduleType: dbMed.scheduleType,
        startDate: new Date(dbMed.startDate),
        refillReminder: dbMed.refillReminder,
        totalPills: dbMed.totalPills,
        remainingPills: dbMed.remainingPills,
        isActive: dbMed.isActive,
        createdAt: new Date(dbMed.createdAt),
        updatedAt: new Date(dbMed.updatedAt)
      };

      if (dbMed.times) {
        medication.times = dbMed.times;
      }
      if (dbMed.interval) {
        medication.interval = dbMed.interval;
      }
      if (dbMed.instructions) {
        medication.instructions = dbMed.instructions;
      }
      if (dbMed.pillImage) {
        medication.pillImage = dbMed.pillImage;
      }
      if (dbMed.endDate) {
        medication.endDate = new Date(dbMed.endDate);
      }

      const medIntakes = allIntakes.filter(i => i.medicationId === medication.id);
      const stats = this.calculateAdherence(medIntakes, startDate, endDate);

      // Get recent intakes (last 5)
      const recentIntakes = medIntakes
        .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())
        .slice(0, 5);

      medicationBreakdown.push({
        medication,
        stats,
        recentIntakes
      });
    }

    // Count alerts (this would come from notifications in a real implementation)
    const missedDoseAlerts = allIntakes.filter(i => i.status === 'missed').length;
    const criticalAlerts = 0; // Would count critical notifications

    const report: PatientReport = {
      patientId,
      patientName: user.name,
      period: {
        start: startDate,
        end: endDate
      },
      overallAdherence,
      medicationBreakdown,
      missedDoseAlerts,
      criticalAlerts,
      generatedAt: new Date()
    };

    return report;
  }

  /**
   * Send weekly report to all caregivers
   */
  async sendWeeklyReportToCaregivers(patientId: string): Promise<void> {
    const report = await this.generateWeeklyReport(patientId);

    // Send notification to caregivers
    await caregiverNotificationService.sendWeeklyReport(
      patientId,
      report.overallAdherence.adherenceRate,
      report.overallAdherence.missedDoses,
      report.overallAdherence.totalDoses
    );
  }

  /**
   * Get patient status summary (for caregiver dashboard)
   */
  async getPatientStatus(patientId: string): Promise<{
    adherenceToday: number;
    adherenceWeek: number;
    missedToday: number;
    upcomingDoses: number;
    lastUpdate: Date;
  }> {
    // Today's adherence
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayIntakes = await this.getIntakesForPeriod(patientId, todayStart, todayEnd);
    const todayStats = this.calculateAdherence(todayIntakes, todayStart, todayEnd);

    // Week's adherence
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekIntakes = await this.getIntakesForPeriod(patientId, weekStart, new Date());
    const weekStats = this.calculateAdherence(weekIntakes, weekStart, new Date());

    // Upcoming doses (next 24 hours)
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const upcomingIntakes = await this.getIntakesForPeriod(patientId, new Date(), tomorrow);
    // Count scheduled doses (not yet taken/missed/skipped)
    const upcomingDoses = upcomingIntakes.length;

    return {
      adherenceToday: todayStats.adherenceRate,
      adherenceWeek: weekStats.adherenceRate,
      missedToday: todayStats.missedDoses,
      upcomingDoses,
      lastUpdate: new Date()
    };
  }

  /**
   * Export report as JSON
   */
  async exportReportJSON(report: PatientReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as formatted text
   */
  async exportReportText(report: PatientReport): Promise<string> {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push(`MEDICATION ADHERENCE REPORT`);
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Patient: ${report.patientName}`);
    lines.push(`Period: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}`);
    lines.push(`Generated: ${report.generatedAt.toLocaleString()}`);
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('OVERALL ADHERENCE');
    lines.push('-'.repeat(60));
    lines.push(`Adherence Rate: ${report.overallAdherence.adherenceRate.toFixed(1)}%`);
    lines.push(`Total Doses: ${report.overallAdherence.totalDoses}`);
    lines.push(`Taken: ${report.overallAdherence.takenDoses}`);
    lines.push(`Missed: ${report.overallAdherence.missedDoses}`);
    lines.push(`Skipped: ${report.overallAdherence.skippedDoses}`);
    lines.push('');

    if (report.medicationBreakdown.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('MEDICATION BREAKDOWN');
      lines.push('-'.repeat(60));

      for (const med of report.medicationBreakdown) {
        lines.push('');
        lines.push(`${med.medication.name} (${med.medication.dosage})`);
        lines.push(`  Adherence: ${med.stats.adherenceRate.toFixed(1)}%`);
        lines.push(`  Taken: ${med.stats.takenDoses}/${med.stats.totalDoses}`);
        lines.push(`  Missed: ${med.stats.missedDoses}`);
      }
    }

    lines.push('');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}

export const caregiverReportingService = new CaregiverReportingService();
