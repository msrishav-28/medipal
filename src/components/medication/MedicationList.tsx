import React, { useState, useMemo } from 'react';
import { Medication } from '@/types';
import { Input, Button, Card } from '@/components/ui';
import MedicationCard from './MedicationCard';
import { cn } from '@/utils/cn';

interface MedicationListProps {
  medications: Medication[];
  loading?: boolean;
  onMedicationTaken?: (id: string) => void;
  onMedicationEdit?: (id: string) => void;
  onAddMedication?: () => void;
  cardSize?: 'compact' | 'standard' | 'expanded';
  showActions?: boolean;
  className?: string;
}

type SortOption = 'name' | 'nextDose' | 'refillStatus' | 'dateAdded';
type FilterOption = 'all' | 'active' | 'needRefill' | 'inactive';

const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  loading = false,
  onMedicationTaken,
  onMedicationEdit,
  onAddMedication,
  cardSize = 'standard',
  showActions = true,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Filter and sort medications
  const filteredAndSortedMedications = useMemo(() => {
    let filtered = medications;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.name.toLowerCase().includes(query) ||
          med.dosage.toLowerCase().includes(query) ||
          med.form.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter((med) => med.isActive);
        break;
      case 'needRefill':
        filtered = filtered.filter(
          (med) => med.remainingPills <= med.refillReminder
        );
        break;
      case 'inactive':
        filtered = filtered.filter((med) => !med.isActive);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        
        case 'nextDose':
          // Sort by next dose time (active medications first)
          if (!a.isActive && b.isActive) return 1;
          if (a.isActive && !b.isActive) return -1;
          
          if (!a.times || !b.times) return 0;
          
          const getNextTime = (times: string[]) => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            
            for (const time of times) {
              const parts = time.split(':').map(Number);
              const hours = parts[0];
              const minutes = parts[1];
              if (hours === undefined || minutes === undefined) continue;
              const timeMinutes = hours * 60 + minutes;
              if (timeMinutes > currentMinutes) {
                return timeMinutes;
              }
            }
            // Return first time + 24 hours if no time today
            const firstTime = times[0];
            if (!firstTime) return 0;
            const parts = firstTime.split(':').map(Number);
            const hours = parts[0];
            const minutes = parts[1];
            if (hours === undefined || minutes === undefined) return 0;
            return (hours * 60 + minutes) + (24 * 60);
          };
          
          return getNextTime(a.times) - getNextTime(b.times);
        
        case 'refillStatus':
          // Sort by pills remaining (ascending - lowest first)
          const aRatio = a.remainingPills / a.totalPills;
          const bRatio = b.remainingPills / b.totalPills;
          return aRatio - bRatio;
        
        case 'dateAdded':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [medications, searchQuery, sortBy, filterBy]);

  const handleSwipeLeft = (medicationId: string) => {
    // Show options menu or edit
    if (onMedicationEdit) {
      onMedicationEdit(medicationId);
    }
  };

  const handleSwipeRight = (medicationId: string) => {
    // Mark as taken
    if (onMedicationTaken) {
      onMedicationTaken(medicationId);
    }
  };

  const getFilterCount = (filter: FilterOption) => {
    switch (filter) {
      case 'active':
        return medications.filter((med) => med.isActive).length;
      case 'needRefill':
        return medications.filter((med) => med.remainingPills <= med.refillReminder).length;
      case 'inactive':
        return medications.filter((med) => !med.isActive).length;
      default:
        return medications.length;
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Loading skeleton */}
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="p-4">
            <div className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-neutral-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-neutral-200 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded w-1/2" />
                  <div className="h-3 bg-neutral-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('medication-list', className)}>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h2 font-bold text-neutral-800">
          My Medications
        </h2>
        {onAddMedication && (
          <Button
            variant="primary"
            size="md"
            onClick={onAddMedication}
            className="flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Add Medication
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <Input
          type="text"
          placeholder="Search medications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'active', 'needRefill', 'inactive'] as FilterOption[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterBy(filter)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-lg text-body font-medium transition-colors',
                'border border-neutral-200',
                filterBy === filter
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              )}
            >
              {filter === 'all' && 'All'}
              {filter === 'active' && 'Active'}
              {filter === 'needRefill' && 'Need Refill'}
              {filter === 'inactive' && 'Inactive'}
              <span className="ml-2 text-caption">
                ({getFilterCount(filter)})
              </span>
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-body text-neutral-600 flex-shrink-0">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">Name (A-Z)</option>
            <option value="nextDose">Next Dose</option>
            <option value="refillStatus">Refill Status</option>
            <option value="dateAdded">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Medication Cards */}
      {filteredAndSortedMedications.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl text-neutral-400">💊</span>
            </div>
            <h3 className="text-h3 font-semibold text-neutral-800">
              {searchQuery || filterBy !== 'all' ? 'No medications found' : 'No medications yet'}
            </h3>
            <p className="text-body text-neutral-600 max-w-sm mx-auto">
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Add your first medication to get started with tracking your doses.'}
            </p>
            {onAddMedication && (!searchQuery && filterBy === 'all') && (
              <Button
                variant="primary"
                size="md"
                onClick={onAddMedication}
                className="mt-4"
              >
                Add Your First Medication
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedMedications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              size={cardSize}
              showActions={showActions}
              {...(onMedicationTaken ? { onTaken: onMedicationTaken } : {})}
              {...(onMedicationEdit ? { onEdit: onMedicationEdit } : {})}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredAndSortedMedications.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-caption text-neutral-500">
            Showing {filteredAndSortedMedications.length} of {medications.length} medications
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicationList;