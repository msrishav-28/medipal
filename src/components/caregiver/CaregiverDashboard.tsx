import { useEffect, useState } from 'react';
import { caregiverService } from '../../services/caregiverService';
import { Caregiver, CaregiverActivity } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useUser } from '../../hooks/useUser';

interface CaregiverDashboardProps {
  patientId?: string;
  onGenerateCode?: () => void;
}

export function CaregiverDashboard({ patientId, onGenerateCode }: CaregiverDashboardProps) {
  const userQuery = useUser('');
  const effectivePatientId = patientId || userQuery.data?.id || '';

  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [activities, setActivities] = useState<CaregiverActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaregivers();
    loadActivities();
  }, [effectivePatientId]);

  const loadCaregivers = async () => {
    try {
      setLoading(true);
      const data = await caregiverService.getCaregiversForPatient(effectivePatientId);
      setCaregivers(data);
    } catch (error) {
      console.error('Error loading caregivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await caregiverService.getPatientActivity(effectivePatientId, 20);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleUpdateAccessLevel = async (caregiverId: string, accessLevel: 'view' | 'manage') => {
    try {
      await caregiverService.updateAccessLevel(caregiverId, accessLevel);
      await loadCaregivers();
    } catch (error) {
      console.error('Error updating access level:', error);
    }
  };

  const handleDeactivateCaregiver = async (caregiverId: string) => {
    if (!confirm('Are you sure you want to deactivate this caregiver?')) {
      return;
    }

    try {
      await caregiverService.deactivateCaregiver(caregiverId);
      await loadCaregivers();
    } catch (error) {
      console.error('Error deactivating caregiver:', error);
    }
  };

  const handleReactivateCaregiver = async (caregiverId: string) => {
    try {
      await caregiverService.reactivateCaregiver(caregiverId);
      await loadCaregivers();
    } catch (error) {
      console.error('Error reactivating caregiver:', error);
    }
  };

  const handleGenerateCode = () => {
    if (onGenerateCode) {
      onGenerateCode();
    } else {
      alert('Please implement the access code generator flow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading caregivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Caregiver Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Manage who has access to help you with your medications
          </p>
        </div>
        <Button
          onClick={handleGenerateCode}
          className="shadow-lg shadow-primary/25"
        >
          Add Caregiver
        </Button>
      </div>

      {/* Caregivers List */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-lg text-foreground">
            Active Caregivers ({caregivers.filter(c => c.isActive).length})
          </h3>
        </div>
        <div className="p-4">
          {caregivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven't added any caregivers yet.
              </p>
              <Button
                onClick={handleGenerateCode}
                variant="outline"
              >
                Add Your First Caregiver
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {caregivers.map((caregiver) => (
                <div
                  key={caregiver.id}
                  className={`p-4 border border-white/10 rounded-xl transition-colors ${caregiver.isActive ? 'bg-white/5' : 'bg-black/20 opacity-70'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {caregiver.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${caregiver.isActive
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                          }`}>
                          {caregiver.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${caregiver.accessLevel === 'manage'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                          {caregiver.accessLevel === 'manage' ? 'Can Manage' : 'View Only'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{caregiver.email}</p>
                        {caregiver.phone && <p>{caregiver.phone}</p>}
                        <p className="italic">{caregiver.relationship}</p>
                        {caregiver.lastAccess && (
                          <p className="text-xs text-neutral-500">
                            Last access: {new Date(caregiver.lastAccess).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {caregiver.isActive ? (
                        <>
                          <select
                            value={caregiver.accessLevel}
                            onChange={(e) =>
                              handleUpdateAccessLevel(
                                caregiver.id,
                                e.target.value as 'view' | 'manage'
                              )
                            }
                            className="text-sm border border-white/10 rounded px-2 py-1 bg-black/20 text-foreground focus:ring-primary focus:border-primary"
                          >
                            <option value="view">View Only</option>
                            <option value="manage">Can Manage</option>
                          </select>
                          <Button
                            onClick={() => handleDeactivateCaregiver(caregiver.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            Deactivate
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleReactivateCaregiver(caregiver.id)}
                          variant="ghost"
                          size="sm"
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Activity Log */}
      <GlassCard>
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-lg text-foreground">Recent Activity</h3>
        </div>
        <div className="p-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const caregiver = caregivers.find(c => c.id === activity.caregiverId);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {caregiver?.name || 'Unknown caregiver'} - {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {typeof activity.details === 'string'
                            ? activity.details
                            : JSON.stringify(activity.details)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
