import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
}

const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!regionRef.current || !message) {
      return;
    }
    
    // Clear the region first to ensure the message is announced
    regionRef.current.textContent = '';
    
    // Use a small delay to ensure screen readers pick up the change
    const timer = setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={regionRef}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    />
  );
};

export default LiveRegion;