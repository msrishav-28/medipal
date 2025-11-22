import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { useCurrentUser } from '@/hooks/useUser';

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

interface DayData {
  date: Date;
  adherenceRate: number;
  totalMeds: number;
  takenMeds: number;
  missedMeds: number;
  isToday: boolean;
  isSelected: boolean;
}

export function CalendarView({ onDateSelect, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: user } = useCurrentUser();
  
  // Get records for the entire current month
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
  
  const { data: records = [] } = useIntakeRecordsByDateRange(
    user?.id || '',
    monthStart,
    monthEnd
  );

  const getDaysInMonth = (date: Date): DayData[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DayData[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(createDayData(prevMonthDate, true));
    }

    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push(createDayData(currentDate, false));
    }

    return days;
  };

  const createDayData = (date: Date, isOtherMonth: boolean): DayData => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isSelected =
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();

    // Filter records for this specific date
    const dayRecords = records.filter((record) => {
      const recordDate = new Date(record.scheduledTime);
      return (
        recordDate.getDate() === date.getDate() &&
        recordDate.getMonth() === date.getMonth() &&
        recordDate.getFullYear() === date.getFullYear()
      );
    });

    const totalMeds = dayRecords.length;
    const takenMeds = dayRecords.filter((r) => r.status === 'taken').length;
    const missedMeds = dayRecords.filter((r) => r.status === 'missed').length;
    const adherenceRate = totalMeds > 0 ? (takenMeds / totalMeds) * 100 : 0;

    return {
      date,
      adherenceRate: isOtherMonth ? 0 : adherenceRate,
      totalMeds: isOtherMonth ? 0 : totalMeds,
      takenMeds: isOtherMonth ? 0 : takenMeds,
      missedMeds: isOtherMonth ? 0 : missedMeds,
      isToday,
      isSelected: isSelected || false,
    };
  };

  const getAdherenceColor = (rate: number, totalMeds: number): string => {
    if (totalMeds === 0) return 'bg-gray-100';
    if (rate === 100) return 'bg-green-500';
    if (rate >= 80) return 'bg-green-400';
    if (rate >= 60) return 'bg-yellow-400';
    if (rate >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{monthName}</h2>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs md:text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((dayData, index) => {
          const isOtherMonth =
            dayData.date.getMonth() !== currentMonth.getMonth();
          const adherenceColor = getAdherenceColor(
            dayData.adherenceRate,
            dayData.totalMeds
          );

          return (
            <button
              key={index}
              onClick={() => !isOtherMonth && onDateSelect(dayData.date)}
              disabled={isOtherMonth}
              className={`
                aspect-square p-1 md:p-2 rounded-lg relative
                transition-all duration-200
                ${isOtherMonth ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                ${dayData.isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${dayData.isToday && !dayData.isSelected ? 'ring-2 ring-blue-300' : ''}
              `}
              aria-label={`${dayData.date.toLocaleDateString()}, ${dayData.adherenceRate}% adherence`}
            >
              {/* Day Number */}
              <div className="text-sm md:text-base font-medium text-gray-900 mb-1">
                {dayData.date.getDate()}
              </div>

              {/* Adherence Indicator */}
              {!isOtherMonth && dayData.totalMeds > 0 && (
                <div
                  className={`
                    ${adherenceColor}
                    h-1.5 md:h-2 rounded-full mx-auto
                    ${dayData.isSelected ? 'w-full' : 'w-3/4'}
                  `}
                  title={`${dayData.takenMeds}/${dayData.totalMeds} medications taken`}
                />
              )}

              {/* Today Indicator */}
              {dayData.isToday && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Adherence Rate</h3>
        <div className="flex flex-wrap gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-gray-600">100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded" />
            <span className="text-gray-600">80-99%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded" />
            <span className="text-gray-600">60-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded" />
            <span className="text-gray-600">40-59%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded" />
            <span className="text-gray-600">&lt;40%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
