import { useState, useCallback } from 'react';

interface AnnouncementOptions {
  politeness?: 'polite' | 'assertive';
  clearDelay?: number;
}

export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((
    message: string,
    options: AnnouncementOptions = {}
  ) => {
    const { politeness: announcementPoliteness = 'polite', clearDelay = 5000 } = options;
    
    setPoliteness(announcementPoliteness);
    setAnnouncement(message);

    // Clear the announcement after a delay
    if (clearDelay > 0) {
      setTimeout(() => {
        setAnnouncement('');
      }, clearDelay);
    }
  }, []);

  const clear = useCallback(() => {
    setAnnouncement('');
  }, []);

  return {
    announcement,
    politeness,
    announce,
    clear,
  };
};