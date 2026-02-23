/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground) / 0.85)',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--foreground) / 0.7)',
            '--tw-prose-quote-borders': 'hsl(var(--border))',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--primary) / 0.9)',
            '--tw-prose-pre-code': 'hsl(var(--foreground) / 0.85)',
            '--tw-prose-pre-bg': 'hsl(var(--muted) / 0.4)',
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border) / 0.5)',
            // Invert (dark) equivalents — same values since we're already dark
            '--tw-prose-invert-body': 'hsl(var(--foreground) / 0.85)',
            '--tw-prose-invert-headings': 'hsl(var(--foreground))',
            '--tw-prose-invert-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-links': 'hsl(var(--primary))',
            '--tw-prose-invert-bold': 'hsl(var(--foreground))',
            '--tw-prose-invert-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-hr': 'hsl(var(--border))',
            '--tw-prose-invert-quotes': 'hsl(var(--foreground) / 0.7)',
            '--tw-prose-invert-quote-borders': 'hsl(var(--border))',
            '--tw-prose-invert-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-code': 'hsl(var(--primary) / 0.9)',
            '--tw-prose-invert-pre-code': 'hsl(var(--foreground) / 0.85)',
            '--tw-prose-invert-pre-bg': 'hsl(var(--muted) / 0.4)',
            '--tw-prose-invert-th-borders': 'hsl(var(--border))',
            '--tw-prose-invert-td-borders': 'hsl(var(--border) / 0.5)',
            // Element overrides
            maxWidth: 'none',
            color: 'var(--tw-prose-body)',
            fontSize: '0.8125rem',   // ~13px, suits chat bubbles
            lineHeight: '1.6',
            // Headings
            'h1, h2, h3, h4': {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              letterSpacing: '-0.01em',
            },
            h1: { fontSize: '1.125rem', marginTop: '1rem', marginBottom: '0.5rem' },
            h2: { fontSize: '1rem',     marginTop: '0.875rem', marginBottom: '0.375rem' },
            h3: { fontSize: '0.9375rem', marginTop: '0.75rem', marginBottom: '0.25rem' },
            h4: { fontSize: '0.875rem', marginTop: '0.5rem',  marginBottom: '0.25rem' },
            // Paragraphs
            p: { marginTop: '0.375rem', marginBottom: '0.375rem' },
            // Lists
            'ul, ol': { paddingLeft: '1.25rem', marginTop: '0.375rem', marginBottom: '0.375rem' },
            li: { marginTop: '0.125rem', marginBottom: '0.125rem' },
            'li > p': { marginTop: '0.125rem', marginBottom: '0.125rem' },
            // Inline code
            'code': {
              color: 'var(--tw-prose-code)',
              backgroundColor: 'hsl(var(--muted) / 0.5)',
              borderRadius: '0.25rem',
              padding: '0.1em 0.35em',
              fontSize: '0.8em',
              fontWeight: '400',
            },
            // Remove backtick decorators added by prose
            'code::before': { content: 'none' },
            'code::after':  { content: 'none' },
            // Code blocks
            pre: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              color: 'var(--tw-prose-pre-code)',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
              overflowX: 'auto',
              fontSize: '0.8em',
              lineHeight: '1.65',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              border: '1px solid hsl(var(--border) / 0.5)',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              fontSize: 'inherit',
              color: 'inherit',
            },
            // Tables
            table: { fontSize: '0.8rem', width: '100%', borderCollapse: 'collapse' },
            thead: { borderBottomWidth: '1px', borderBottomColor: 'hsl(var(--border))' },
            'thead th': {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              padding: '0.375rem 0.5rem',
              textAlign: 'left',
            },
            'tbody tr': { borderBottomWidth: '1px', borderBottomColor: 'hsl(var(--border) / 0.4)' },
            'tbody tr:last-child': { borderBottomWidth: '0' },
            'tbody td': { padding: '0.3rem 0.5rem', verticalAlign: 'top' },
            // Blockquotes
            blockquote: {
              borderLeftWidth: '3px',
              borderLeftColor: 'hsl(var(--border))',
              paddingLeft: '0.75rem',
              color: 'hsl(var(--muted-foreground))',
              fontStyle: 'italic',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after':  { content: 'none' },
            // Horizontal rule
            hr: { borderColor: 'hsl(var(--border))', marginTop: '0.75rem', marginBottom: '0.75rem' },
            // Links
            a: { color: 'var(--tw-prose-links)', textDecorationLine: 'none', fontWeight: '400' },
            'a:hover': { textDecorationLine: 'underline' },
            // Strong / em
            strong: { color: 'var(--tw-prose-bold)', fontWeight: '600' },
          },
        },
      }),
    }
  },
  plugins: [require('@tailwindcss/typography')]
}

