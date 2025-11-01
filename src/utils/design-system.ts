/**
 * Design System Utilities
 * Provides consistent spacing, sizing, and layout utilities
 */

// Spacing system based on 8px grid
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// Typography scale with responsive sizing
export const typography = {
  display: 'clamp(28px, 4vw, 32px)',
  h1: 'clamp(24px, 3.5vw, 28px)',
  h2: 'clamp(20px, 3vw, 24px)',
  h3: 'clamp(18px, 2.5vw, 20px)',
  bodyLarge: 'clamp(16px, 2.25vw, 18px)',
  body: 'clamp(14px, 2vw, 16px)',
  caption: '12px',
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

// Touch target sizes for accessibility
export const touchTargets = {
  minimum: '44px', // WCAG AA minimum
  comfortable: '56px', // Recommended for elderly users
  large: '64px', // Extra large for accessibility
} as const;

// Color palette
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#2E7FD8',
    600: '#1D4ED8',
    700: '#1e40af',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#F59E0B',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#EF4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  neutral: {
    50: '#F8FAFB',
    100: '#f3f4f6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9ca3af',
    500: '#6B7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Border radius values
export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// Shadow values
export const shadows = {
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

// Animation durations
export const animations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
} as const;

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const;

// Utility functions
export const getSpacing = (size: keyof typeof spacing) => spacing[size];
export const getColor = (color: keyof typeof colors, shade: number) => {
  const colorObj = colors[color] as Record<number, string>;
  return colorObj[shade];
};

// Media query helpers
export const mediaQueries = {
  mobile: `(min-width: ${breakpoints.mobile})`,
  tablet: `(min-width: ${breakpoints.tablet})`,
  desktop: `(min-width: ${breakpoints.desktop})`,
  wide: `(min-width: ${breakpoints.wide})`,
} as const;