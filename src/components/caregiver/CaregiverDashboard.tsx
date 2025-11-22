import { useEffect, useState } from 'react';
import { caregiverService } from '../../services/caregiverService';
import { Caregiver, CaregiverActivity } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading caregivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Caregiver Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Manage who has access to help you with your medications
          </p>
        </div>
        <Button
          onClick={handleGenerateCode}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add Caregiver
        </Button>
      </div>

      {/* Caregivers List */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">
            Active Caregivers ({caregivers.filter(c => c.isActive).length})
          </h3>
        </div>
        <div className="p-4">
          {caregivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You haven't added any caregivers yet.
              </p>
              <Button
                onClick={handleGenerateCode}
                variant="secondary"
              >
                Add Your First Caregiver
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {caregivers.map((caregiver) => (
                <div
                  key={caregiver.id}
                  className={`p-4 border rounded-lg ${
                    caregiver.isActive ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {caregiver.name}
                        </h3>
                        <Badge
                          variant={caregiver.isActive ? 'success' : 'secondary'}
                        >
                          {caregiver.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge
                          variant={caregiver.accessLevel === 'manage' ? 'warning' : 'info'}
                        >
                          {caregiver.accessLevel === 'manage' ? 'Can Manage' : 'View Only'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{caregiver.email}</p>
                        {caregiver.phone && <p>{caregiver.phone}</p>}
                        <p className="text-gray-500">{caregiver.relationship}</p>
                        {caregiver.lastAccess && (
                          <p className="text-xs text-gray-400">
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
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="view">View Only</option>
                            <option value="manage">Can Manage</option>
                          </select>
                          <Button
                            onClick={() => handleDeactivateCaregiver(caregiver.id)}
                            variant="secondary"
                            size="sm"
                          >
                            Deactivate
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleReactivateCaregiver(caregiver.id)}
                          variant="secondary"
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
      </Card>

      {/* Activity Log */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Recent Activity</h3>
        </div>
        <div className="p-4">
          {activities.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              No activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const caregiver = caregivers.find(c => c.id === activity.caregiverId);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {caregiver?.name || 'Unknown caregiver'} - {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-600 mt-1">
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
      </Card>
    </div>
  );
}
