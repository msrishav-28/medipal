import React, { useState, useEffect } from 'react';
import { caregiverReportingService } from '../../services';
import Card from '../ui/Card';

interface PatientStatus {
  adherenceToday: number;
  adherenceWeek: number;
  missedToday: number;
  upcomingDoses: number;
  lastUpdate: Date;
}

interface PatientStatusCardProps {
  patientId: string;
  patientName: string;
}

export const PatientStatusCard: React.FC<PatientStatusCardProps> = ({
  patientId,
  patientName
}) => {
  const [status, setStatus] = useState<PatientStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, [patientId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const patientStatus = await caregiverReportingService.getPatientStatus(patientId);
      setStatus(patientStatus);
    } catch (err) {
      console.error('Failed to load patient status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const weekAdherenceColor = status.adherenceWeek >= 80 ? 'text-green-500' : 'text-red-500';
  const weekAdherenceBgColor = status.adherenceWeek >= 80 ? 'bg-green-100' : 'bg-red-100';
  const needsAttention = status.adherenceWeek < 80 || status.missedToday > 0;

  return (
    <Card className={`p-4 ${needsAttention ? 'border-2 border-red-500' : ''}`}>
      {needsAttention && (
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-md mb-3 text-sm font-medium">
          ⚠️ Needs Attention
        </div>
      )}
      
      <h3 className="text-lg font-bold mb-3">{patientName}</h3>
      
      <div className="space-y-3">
        {/* Weekly Adherence */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Weekly Adherence</span>
          <div className={`px-3 py-1 rounded-full ${weekAdherenceBgColor} ${weekAdherenceColor} font-semibold`}>
            {status.adherenceWeek.toFixed(1)}%
          </div>
        </div>

        {/* Today's Adherence */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Today's Adherence</span>
          <span className={`font-semibold ${status.adherenceToday >= 80 ? 'text-green-500' : 'text-gray-700'}`}>
            {status.adherenceToday.toFixed(1)}%
          </span>
        </div>

        {/* Missed Today */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Missed Today</span>
          <span className={`font-semibold ${status.missedToday > 0 ? 'text-red-500' : 'text-gray-700'}`}>
            {status.missedToday}
          </span>
        </div>

        {/* Upcoming Doses */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Upcoming (24h)</span>
          <span className="font-semibold text-gray-700">{status.upcomingDoses}</span>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Last updated: {new Date(status.lastUpdate).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};

