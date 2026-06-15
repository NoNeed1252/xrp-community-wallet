/**
 * Tailwind preset для всех фронт-приложений.
 * Значения — отражение токенов из ui-guidelines.md §2.
 * Все цвета продублированы как CSS-переменные в @rc/ui/tokens, чтобы dark-тема работала через переключение data-theme.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgb(var(--rc-brand-50) / <alpha-value>)',
          100: 'rgb(var(--rc-brand-100) / <alpha-value>)',
          500: 'rgb(var(--rc-brand-500) / <alpha-value>)',
          600: 'rgb(var(--rc-brand-600) / <alpha-value>)',
          700: 'rgb(var(--rc-brand-700) / <alpha-value>)',
        },
        neutral: {
          0: 'rgb(var(--rc-neutral-0) / <alpha-value>)',
          50: 'rgb(var(--rc-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--rc-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--rc-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--rc-neutral-300) / <alpha-value>)',
          400: 'rgb(var(--rc-neutral-400) / <alpha-value>)',
          500: 'rgb(var(--rc-neutral-500) / <alpha-value>)',
          700: 'rgb(var(--rc-neutral-700) / <alpha-value>)',
          900: 'rgb(var(--rc-neutral-900) / <alpha-value>)',
        },
        success: {
          100: 'rgb(var(--rc-success-100) / <alpha-value>)',
          700: 'rgb(var(--rc-success-700) / <alpha-value>)',
        },
        info: {
          100: 'rgb(var(--rc-info-100) / <alpha-value>)',
          700: 'rgb(var(--rc-info-700) / <alpha-value>)',
        },
        warning: {
          100: 'rgb(var(--rc-warning-100) / <alpha-value>)',
          700: 'rgb(var(--rc-warning-700) / <alpha-value>)',
        },
        danger: {
          100: 'rgb(var(--rc-danger-100) / <alpha-value>)',
          700: 'rgb(var(--rc-danger-700) / <alpha-value>)',
        },
        page: 'rgb(var(--rc-page) / <alpha-value>)',
        surface: 'rgb(var(--rc-surface) / <alpha-value>)',
        nested: 'rgb(var(--rc-nested) / <alpha-value>)',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        e1: '0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.02)',
        e2: '0 4px 12px rgba(15,23,42,0.06)',
        e3: '0 16px 32px rgba(15,23,42,0.12)',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '44px', fontWeight: '700' }],
        h1: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '30px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-strong': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      spacing: {
        4.5: '18px',
        18: '72px',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decel: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        120: '120ms',
        200: '200ms',
        280: '280ms',
      },
      zIndex: {
        sticky: '100',
        dropdown: '200',
        tooltip: '300',
        toast: '400',
        drawer: '500',
        modal: '600',
        critical: '700',
      },
    },
  },
  plugins: [],
};
