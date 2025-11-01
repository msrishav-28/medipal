import type { IntakeRecord, Medication } from '@/types';

export interface AdherenceStats {
  overall: number;
  daily: number;
  weekly: number;
  monthly: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  onTimeRate: number;
}

export interface TrendData {
  direction: 'improving' | 'declining' | 'stable';
  change: number; // percentage change
  currentPeriod: number;
  previousPeriod: number;
}

export interface DailyAdherence {
  date: string;
  adherenceRate: number;
  taken: number;
  missed: number;
  skipped: number;
  total: number;
}

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  adherenceRate: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
}

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  metric?: number;
}

/**
 * Calculate overall adherence statistics
 */
export function calculateAdherenceStats(records: IntakeRecord[]): AdherenceStats {
  const totalDoses = records.length;
  const takenDoses = records.filter((r) => r.status === 'taken').length;
  const missedDoses = records.filter((r) => r.status === 'missed').length;
  const skippedDoses = records.filter((r) => r.status === 'skipped').length;

  // Calculate on-time rate (taken within 30 minutes of scheduled time)
  const onTimeDoses = records.filter((record) => {
    if (record.status !== 'taken' || !record.actualTime) return false;

    const timeDiff = Math.abs(
      new Date(record.actualTime).getTime() - new Date(record.scheduledTime).getTime()
    );
    const thirtyMinutes = 30 * 60 * 1000;

    return timeDiff <= thirtyMinutes;
  }).length;

  const overall = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
  const onTimeRate = takenDoses > 0 ? (onTimeDoses / takenDoses) * 100 : 0;

  // Calculate daily adherence (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyRecords = records.filter((r) => new Date(r.scheduledTime) >= oneDayAgo);
  const daily =
    dailyRecords.length > 0
      ? (dailyRecords.filter((r) => r.status === 'taken').length / dailyRecords.length) * 100
      : 0;

  // Calculate weekly adherence (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyRecords = records.filter((r) => new Date(r.scheduledTime) >= oneWeekAgo);
  const weekly =
    weeklyRecords.length > 0
      ? (weeklyRecords.filter((r) => r.status === 'taken').length / weeklyRecords.length) * 100
      : 0;

  // Calculate monthly adherence (last 30 days)
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyRecords = records.filter((r) => new Date(r.scheduledTime) >= oneMonthAgo);
  const monthly =
    monthlyRecords.length > 0
      ? (monthlyRecords.filter((r) => r.status === 'taken').length / monthlyRecords.length) * 100
      : 0;

  return {
    overall,
    daily,
    weekly,
    monthly,
    totalDoses,
    takenDoses,
    missedDoses,
    skippedDoses,
    onTimeRate,
  };
}

/**
 * Calculate trend by comparing two periods
 */
export function calculateTrend(
  records: IntakeRecord[],
  periodDays: number = 7
): TrendData {
  const now = Date.now();
  const periodMs = periodDays * 24 * 60 * 60 * 1000;

  // Current period
  const currentPeriodStart = new Date(now - periodMs);
  const currentRecords = records.filter(
    (r) => new Date(r.scheduledTime) >= currentPeriodStart
  );
  const currentPeriod =
    currentRecords.length > 0
      ? (currentRecords.filter((r) => r.status === 'taken').length / currentRecords.length) * 100
      : 0;

  // Previous period
  const previousPeriodStart = new Date(now - periodMs * 2);
  const previousPeriodEnd = currentPeriodStart;
  const previousRecords = records.filter(
    (r) =>
      new Date(r.scheduledTime) >= previousPeriodStart &&
      new Date(r.scheduledTime) < previousPeriodEnd
  );
  const previousPeriod =
    previousRecords.length > 0
      ? (previousRecords.filter((r) => r.status === 'taken').length / previousRecords.length) *
        100
      : 0;

  // Calculate change
  const change = currentPeriod - previousPeriod;

  let direction: 'improving' | 'declining' | 'stable' = 'stable';
  if (change > 5) direction = 'improving';
  else if (change < -5) direction = 'declining';

  return {
    direction,
    change,
    currentPeriod,
    previousPeriod,
  };
}

/**
 * Group records by day and calculate daily adherence
 */
export function getDailyAdherence(records: IntakeRecord[], days: number = 30): DailyAdherence[] {
  const result: DailyAdherence[] = [];
  const recordsByDate: Record<string, IntakeRecord[]> = {};

  // Group by date
  records.forEach((record) => {
    const date = new Date(record.scheduledTime);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0] || '';

    if (!recordsByDate[dateKey]) {
      recordsByDate[dateKey] = [];
    }
    recordsByDate[dateKey]!.push(record);
  });

  // Create entries for each day
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0] || '';

    const dayRecords = recordsByDate[dateKey] || [];
    const total = dayRecords.length;
    const taken = dayRecords.filter((r: IntakeRecord) => r.status === 'taken').length;
    const missed = dayRecords.filter((r: IntakeRecord) => r.status === 'missed').length;
    const skipped = dayRecords.filter((r: IntakeRecord) => r.status === 'skipped').length;
    const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

    result.push({
      date: dateKey,
      adherenceRate,
      taken,
      missed,
      skipped,
      total,
    });
  }

  return result;
}

/**
 * Calculate adherence per medication
 */
export function getMedicationAdherence(
  records: IntakeRecord[],
  medications: Medication[]
): MedicationAdherence[] {
  const medicationMap = new Map(medications.map((m) => [m.id, m]));
  const recordsByMed: Record<string, IntakeRecord[]> = {};

  // Group by medication
  records.forEach((record) => {
    if (!recordsByMed[record.medicationId]) {
      recordsByMed[record.medicationId] = [];
    }
    recordsByMed[record.medicationId]!.push(record);
  });

  // Calculate adherence for each medication
  return Object.entries(recordsByMed).map(([medId, medRecords]) => {
    const medication = medicationMap.get(medId);
    const totalDoses = medRecords.length;
    const takenDoses = medRecords.filter((r) => r.status === 'taken').length;
    const missedDoses = medRecords.filter((r) => r.status === 'missed').length;
    const skippedDoses = medRecords.filter((r) => r.status === 'skipped').length;
    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    return {
      medicationId: medId,
      medicationName: medication?.name || 'Unknown',
      adherenceRate,
      totalDoses,
      takenDoses,
      missedDoses,
      skippedDoses,
    };
  });
}

/**
 * Generate insights based on adherence data
 */
export function generateInsights(
  stats: AdherenceStats,
  trend: TrendData,
  dailyData: DailyAdherence[]
): Insight[] {
  const insights: Insight[] = [];

  // Overall adherence insight
  if (stats.overall >= 90) {
    insights.push({
      type: 'success',
      title: 'Excellent Adherence!',
      message: `You've maintained ${stats.overall.toFixed(0)}% adherence. Keep up the great work!`,
      metric: stats.overall,
    });
  } else if (stats.overall >= 75) {
    insights.push({
      type: 'info',
      title: 'Good Adherence',
      message: `Your adherence is at ${stats.overall.toFixed(0)}%. Consider setting more reminders to reach 90%+.`,
      metric: stats.overall,
    });
  } else if (stats.overall >= 50) {
    insights.push({
      type: 'warning',
      title: 'Room for Improvement',
      message: `Your adherence is ${stats.overall.toFixed(0)}%. Try to take medications on time to improve your health outcomes.`,
      metric: stats.overall,
    });
  } else {
    insights.push({
      type: 'error',
      title: 'Low Adherence',
      message: `Your adherence is only ${stats.overall.toFixed(0)}%. Please consult with your healthcare provider.`,
      metric: stats.overall,
    });
  }

  // Trend insight
  if (trend.direction === 'improving') {
    insights.push({
      type: 'success',
      title: 'Positive Trend',
      message: `Your adherence has improved by ${Math.abs(trend.change).toFixed(1)}% recently!`,
      metric: trend.change,
    });
  } else if (trend.direction === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Declining Trend',
      message: `Your adherence has decreased by ${Math.abs(trend.change).toFixed(1)}%. Let's work on getting back on track.`,
      metric: trend.change,
    });
  }

  // Streak insight
  const currentStreak = calculateCurrentStreak(dailyData);
  if (currentStreak >= 7) {
    insights.push({
      type: 'success',
      title: `${currentStreak}-Day Streak!`,
      message: `You've taken all medications on time for ${currentStreak} consecutive days!`,
      metric: currentStreak,
    });
  }

  // On-time rate insight
  if (stats.onTimeRate < 70 && stats.takenDoses > 0) {
    insights.push({
      type: 'info',
      title: 'Timing Opportunity',
      message: `Only ${stats.onTimeRate.toFixed(0)}% of doses were taken within 30 minutes of scheduled time. Try to be more punctual.`,
      metric: stats.onTimeRate,
    });
  }

  // Missed doses insight
  if (stats.missedDoses > 5) {
    insights.push({
      type: 'warning',
      title: 'Missed Doses',
      message: `You have ${stats.missedDoses} missed doses. Consider enabling additional reminder notifications.`,
      metric: stats.missedDoses,
    });
  }

  return insights;
}

/**
 * Calculate current streak of perfect days (100% adherence)
 */
function calculateCurrentStreak(dailyData: DailyAdherence[]): number {
  let streak = 0;

  // Start from the most recent day and work backwards
  for (let i = dailyData.length - 1; i >= 0; i--) {
    const day = dailyData[i];
    if (!day) continue;
    
    if (day.total > 0 && day.adherenceRate === 100) {
      streak++;
    } else if (day.total > 0) {
      // Break streak if there was a day with medications that wasn't 100%
      break;
    }
    // Skip days with no medications
  }

  return streak;
}

/**
 * Get best and worst performing times of day
 */
export function getTimeOfDayAnalysis(records: IntakeRecord[]): {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
} {
  const timeSlots = {
    morning: { taken: 0, total: 0 }, // 5 AM - 12 PM
    afternoon: { taken: 0, total: 0 }, // 12 PM - 5 PM
    evening: { taken: 0, total: 0 }, // 5 PM - 9 PM
    night: { taken: 0, total: 0 }, // 9 PM - 5 AM
  };

  records.forEach((record) => {
    const hour = new Date(record.scheduledTime).getHours();
    let slot: keyof typeof timeSlots;

    if (hour >= 5 && hour < 12) slot = 'morning';
    else if (hour >= 12 && hour < 17) slot = 'afternoon';
    else if (hour >= 17 && hour < 21) slot = 'evening';
    else slot = 'night';

    timeSlots[slot].total++;
    if (record.status === 'taken') {
      timeSlots[slot].taken++;
    }
  });

  return {
    morning: timeSlots.morning.total > 0 ? (timeSlots.morning.taken / timeSlots.morning.total) * 100 : 0,
    afternoon: timeSlots.afternoon.total > 0 ? (timeSlots.afternoon.taken / timeSlots.afternoon.total) * 100 : 0,
    evening: timeSlots.evening.total > 0 ? (timeSlots.evening.taken / timeSlots.evening.total) * 100 : 0,
    night: timeSlots.night.total > 0 ? (timeSlots.night.taken / timeSlots.night.total) * 100 : 0,
  };
}
