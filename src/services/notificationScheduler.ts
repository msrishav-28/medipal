import { Medication, MedicationReminder, NotificationSchedule } from '@/types';
import { notificationService } from './notificationService';

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledReminders = new Map<string, NodeJS.Timeout>();
  private activeSchedules = new Map<string, NotificationSchedule[]>();

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Schedule notifications for a medication
   */
  async scheduleMedicationReminders(medication: Medication): Promise<void> {
    if (!medication.isActive) {
      return;
    }

    // Clear existing schedules for this medication
    await this.clearMedicationSchedules(medication.id);

    const schedules = this.generateSchedules(medication);
    this.activeSchedules.set(medication.id, schedules);

    // Schedule reminders for the next 7 days
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    for (const schedule of schedules) {
      const reminders = this.generateRemindersFromSchedule(medication, schedule, now, endDate);
      for (const reminder of reminders) {
        await this.scheduleReminder(reminder);
      }
    }
  }

  /**
   * Generate notification schedules from medication data
   */
  private generateSchedules(medication: Medication): NotificationSchedule[] {
    const schedules: NotificationSchedule[] = [];
    
    if (medication.scheduleType === 'time-based' && medication.times) {
      for (const time of medication.times) {
        schedules.push({
          id: `${medication.id}-${time}`,
          medicationId: medication.id,
          userId: medication.userId,
          time,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } else if (medication.scheduleType === 'interval-based' && medication.interval) {
      // For interval-based, create a schedule starting from now
      const startTime = medication.startDate || new Date();
      schedules.push({
        id: `${medication.id}-interval`,
        medicationId: medication.id,
        userId: medication.userId,
        time: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return schedules;
  }

  /**
   * Generate reminders from a schedule within a date range
   */
  private generateRemindersFromSchedule(
    medication: Medication,
    schedule: NotificationSchedule,
    startDate: Date,
    endDate: Date
  ): MedicationReminder[] {
    const reminders: MedicationReminder[] = [];
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    if (hours === undefined || minutes === undefined) {
      return reminders; // Invalid time format
    }

    if (medication.scheduleType === 'time-based') {
      // Generate daily reminders
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (schedule.daysOfWeek.includes(dayOfWeek)) {
          const reminderTime = new Date(currentDate);
          reminderTime.setHours(hours, minutes, 0, 0);
          
          // Only schedule future reminders
          if (reminderTime > startDate) {
            reminders.push(this.createReminder(medication, reminderTime));
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (medication.scheduleType === 'interval-based' && medication.interval) {
      // Generate interval-based reminders
      let reminderTime = new Date(startDate);
      reminderTime.setHours(hours, minutes, 0, 0);
      
      while (reminderTime <= endDate) {
        if (reminderTime > startDate) {
          reminders.push(this.createReminder(medication, reminderTime));
        }
        
        reminderTime = new Date(reminderTime.getTime() + medication.interval * 60 * 60 * 1000);
      }
    }

    return reminders;
  }

  /**
   * Create a medication reminder object
   */
  private createReminder(medication: Medication, scheduledTime: Date): MedicationReminder {
    return {
      id: `${medication.id}-${scheduledTime.getTime()}`,
      medicationId: medication.id,
      userId: medication.userId,
      scheduledTime,
      medicationName: medication.name,
      dosage: medication.dosage,
      ...(medication.instructions ? { instructions: medication.instructions } : {}),
      ...(medication.pillImage ? { pillImage: medication.pillImage } : {}),
      snoozeCount: 0,
      maxSnoozes: 3,
      isActive: true,
      createdAt: new Date()
    };
  }

  /**
   * Schedule a single reminder
   */
  private async scheduleReminder(reminder: MedicationReminder): Promise<void> {
    const now = new Date();
    const delay = reminder.scheduledTime.getTime() - now.getTime();
    
    if (delay <= 0) {
      // Past due - show immediately
      await notificationService.scheduleReminder(reminder);
    } else {
      // Schedule for future
      const timeoutId = setTimeout(async () => {
        await notificationService.scheduleReminder(reminder);
        this.scheduledReminders.delete(reminder.id);
      }, delay);

      this.scheduledReminders.set(reminder.id, timeoutId);
    }
  }

  /**
   * Clear all scheduled reminders for a medication
   */
  async clearMedicationSchedules(medicationId: string): Promise<void> {
    // Clear timeouts
    for (const [reminderId, timeoutId] of this.scheduledReminders.entries()) {
      if (reminderId.startsWith(medicationId)) {
        clearTimeout(timeoutId);
        this.scheduledReminders.delete(reminderId);
      }
    }

    // Remove from active schedules
    this.activeSchedules.delete(medicationId);
  }

  /**
   * Reschedule all active medications
   */
  async rescheduleAllMedications(medications: Medication[]): Promise<void> {
    // Clear all existing schedules
    for (const timeoutId of this.scheduledReminders.values()) {
      clearTimeout(timeoutId);
    }
    this.scheduledReminders.clear();
    this.activeSchedules.clear();

    // Schedule all active medications
    for (const medication of medications) {
      if (medication.isActive) {
        await this.scheduleMedicationReminders(medication);
      }
    }
  }

  /**
   * Get upcoming reminders for a user
   */
  getUpcomingReminders(_userId: string, _hours: number = 24): MedicationReminder[] {
    const upcomingReminders: MedicationReminder[] = [];
    
    // This would typically query a database
    // For now, we'll return an empty array as reminders are scheduled in memory
    return upcomingReminders;
  }

  /**
   * Handle medication taken action
   */
  async handleMedicationTaken(reminderId: string, actualTime: Date = new Date()): Promise<void> {
    // Cancel the scheduled reminder
    const timeoutId = this.scheduledReminders.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReminders.delete(reminderId);
    }

    // In a real app, this would update the intake record in the database
    console.log('Medication taken:', { reminderId, actualTime });
  }

  /**
   * Handle medication snooze action
   */
  async handleMedicationSnooze(reminderId: string, minutes: number): Promise<void> {
    // Cancel the current reminder
    const timeoutId = this.scheduledReminders.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReminders.delete(reminderId);
    }

    // Schedule a new reminder for the snooze time
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);

    // In a real app, this would fetch the reminder from the database
    // For now, we'll create a mock reminder
    const medicationId = reminderId.split('-')[0];
    if (!medicationId) {
      return; // Invalid reminder ID
    }
    
    const mockReminder: MedicationReminder = {
      id: `${reminderId}-snooze`,
      medicationId,
      userId: 'user',
      medicationName: 'Medication',
      dosage: '1 pill',
      scheduledTime: snoozeTime,
      snoozeCount: 0,
      maxSnoozes: 3,
      isActive: true,
      createdAt: new Date()
    };
    
    await this.scheduleReminder(mockReminder);
  }

  /**
   * Handle medication skip action
   */
  async handleMedicationSkip(reminderId: string, reason?: string): Promise<void> {
    // Cancel the scheduled reminder
    const timeoutId = this.scheduledReminders.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReminders.delete(reminderId);
    }

    // In a real app, this would update the intake record in the database
    console.log('Medication skipped:', { reminderId, reason });
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    activeSchedules: number;
    scheduledReminders: number;
    medications: string[];
  } {
    return {
      activeSchedules: this.activeSchedules.size,
      scheduledReminders: this.scheduledReminders.size,
      medications: Array.from(this.activeSchedules.keys())
    };
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();
