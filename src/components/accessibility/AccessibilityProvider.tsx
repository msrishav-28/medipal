import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'normal',
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Detect system preferences
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Detect high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateSystemPreferences = () => {
      setSettings(prev => ({
        ...prev,
        highContrast: prev.highContrast || highContrastQuery.matches,
        reducedMotion: prev.reducedMotion || reducedMotionQuery.matches,
      }));
    };

    updateSystemPreferences();

    highContrastQuery.addEventListener('change', updateSystemPreferences);
    reducedMotionQuery.addEventListener('change', updateSystemPreferences);

    return () => {
      highContrastQuery.removeEventListener('change', updateSystemPreferences);
      reducedMotionQuery.removeEventListener('change', updateSystemPreferences);
    };
  }, []);

  // Apply settings to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const { body } = document;
      
      // High contrast mode
      if (settings.highContrast) {
        body.classList.add('accessibility-mode');
      } else {
        body.classList.remove('accessibility-mode');
      }

      // Font size
      body.classList.remove('large-font-mode', 'extra-large-font-mode');
      if (settings.fontSize === 'large') {
        body.classList.add('large-font-mode');
      } else if (settings.fontSize === 'extra-large') {
        body.classList.add('extra-large-font-mode');
      }

      // Reduced motion
      if (settings.reducedMotion) {
        body.style.setProperty('--animation-duration', '0.01ms');
      } else {
        body.style.removeProperty('--animation-duration');
      }
    }
  }, [settings]);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setSettings(prev => ({ ...prev, keyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setSettings(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const increaseFontSize = () => {
    setSettings(prev => {
      const sizes: AccessibilitySettings['fontSize'][] = ['normal', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(prev.fontSize);
      const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
      const newSize = sizes[nextIndex];
      return { 
        ...prev, 
        fontSize: newSize !== undefined ? newSize : prev.fontSize 
      };
    });
  };

  const decreaseFontSize = () => {
    setSettings(prev => {
      const sizes: AccessibilitySettings['fontSize'][] = ['normal', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(prev.fontSize);
      const nextIndex = Math.max(currentIndex - 1, 0);
      const newSize = sizes[nextIndex];
      return { 
        ...prev, 
        fontSize: newSize !== undefined ? newSize : prev.fontSize 
      };
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};