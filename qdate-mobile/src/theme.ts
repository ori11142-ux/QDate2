// Color palette pulled from the architecture report mockups: warm cream + sage green.
// Calm, low-stimulation aesthetic — the point of the whole product.

export const colors = {
  background: '#F5F1E8',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE0',

  primary: '#7C9885',
  primaryDark: '#5C7A6B',
  primaryLight: '#A8BFA8',

  text: '#2B2D2A',
  textMuted: '#6B6E6A',
  textInverse: '#FFFFFF',

  border: '#E5E0D5',
  divider: '#D8D2C4',

  success: '#7C9885',
  warning: '#C9A961',
  danger: '#B86B5C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '600' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '600' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
} as const;
