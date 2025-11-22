import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { useAccessibility } from './AccessibilityProvider';
import { IconButton } from '../ui';

interface AccessibilityToolbarProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  className,
  position = 'top-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, toggleHighContrast, increaseFontSize, decreaseFontSize, resetSettings } = useAccessibility();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const AccessibilityIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  const ContrastIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
    </svg>
  );

  const FontSizeIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );

  const ResetIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Toggle Button */}
      <IconButton
        variant="primary"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open accessibility options"
        aria-expanded={isOpen}
        className="shadow-lg"
      >
        <AccessibilityIcon />
      </IconButton>

      {/* Accessibility Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute mt-2 w-64 bg-white rounded-xl shadow-modal border border-neutral-200 p-4 space-y-4',
            position.includes('right') ? 'right-0' : 'left-0'
          )}
          role="dialog"
          aria-label="Accessibility options"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-800">
              Accessibility
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-100 focus-ring"
              aria-label="Close accessibility options"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ContrastIcon />
              <span className="text-sm font-medium text-neutral-700">
                High Contrast
              </span>
            </div>
            <button
              onClick={toggleHighContrast}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring',
                settings.highContrast ? 'bg-primary-500' : 'bg-neutral-300'
              )}
              role="switch"
              aria-checked={settings.highContrast}
              aria-label="Toggle high contrast mode"
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Font Size Controls */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FontSizeIcon />
              <span className="text-sm font-medium text-neutral-700">
                Font Size: {settings.fontSize}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={decreaseFontSize}
                disabled={settings.fontSize === 'normal'}
                className="flex-1 py-2 px-3 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={increaseFontSize}
                disabled={settings.fontSize === 'extra-large'}
                className="flex-1 py-2 px-3 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetSettings}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus-ring"
            aria-label="Reset accessibility settings"
          >
            <ResetIcon />
            <span>Reset Settings</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToolbar;