/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(28px, 4vw, 32px)', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['clamp(24px, 3.5vw, 28px)', { lineHeight: '1.3', fontWeight: '700' }],
        'h2': ['clamp(20px, 3vw, 24px)', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['clamp(18px, 2.5vw, 20px)', { lineHeight: '1.4', fontWeight: '600' }],
        'body-large': ['clamp(16px, 2.25vw, 18px)', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['clamp(14px, 2vw, 16px)', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'touch': '56px',
      },
      minWidth: {
        'touch': '56px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gentle': 'pulseGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}