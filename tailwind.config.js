
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-interactive': 'var(--color-surface-interactive)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-strong': 'var(--color-accent-strong)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      borderRadius: {
        'btn': '10px',
        'input': '12px',
        'card': '16px',
        'section': '20px',
        'modal': '24px',
        'fab': '18px',
      },
      boxShadow: {
        'apple': '0 8px 32px -8px rgba(0, 0, 0, 0.4)',
        'apple-subtle': '0 2px 12px -4px rgba(0, 0, 0, 0.2)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'zoom-in': 'zoom-in 0.3s ease-out',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
