import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, variantClasses[variant], className)}
            style={style}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

export function MedicationCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" width="40%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" width={100} height={36} />
        <Skeleton variant="rectangular" width={80} height={36} />
      </div>
    </div>
  );
}

export function MedicationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <MedicationCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 space-y-2">
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={36} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="rectangular" width="100%" height={200} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={20} />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-100 p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} height={16} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
