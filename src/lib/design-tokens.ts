/**
 * Design Tokens
 * Centralized design system tokens for consistent styling
 */

/**
 * Color tokens referencing CSS variables
 */
export const colors = {
  // Semantic colors
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',
  popover: 'var(--popover)',
  popoverForeground: 'var(--popover-foreground)',
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',
  destructive: 'var(--destructive)',
  destructiveForeground: 'var(--destructive-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  inputBackground: 'var(--input-background)',
  ring: 'var(--ring)',

  // Chart colors
  chart1: 'var(--chart-1)',
  chart2: 'var(--chart-2)',
  chart3: 'var(--chart-3)',
  chart4: 'var(--chart-4)',
  chart5: 'var(--chart-5)',

  // Sidebar colors
  sidebar: 'var(--sidebar)',
  sidebarForeground: 'var(--sidebar-foreground)',
  sidebarPrimary: 'var(--sidebar-primary)',
  sidebarAccent: 'var(--sidebar-accent)',
  sidebarBorder: 'var(--sidebar-border)',
} as const;

/**
 * Spacing tokens referencing CSS variables
 */
export const spacing = {
  0: 'var(--spacing-0)',
  1: 'var(--spacing-1)',
  2: 'var(--spacing-2)',
  3: 'var(--spacing-3)',
  4: 'var(--spacing-4)',
  5: 'var(--spacing-5)',
  6: 'var(--spacing-6)',
  7: 'var(--spacing-7)',
  8: 'var(--spacing-8)',
  10: 'var(--spacing-10)',
  12: 'var(--spacing-12)',
  16: 'var(--spacing-16)',
  20: 'var(--spacing-20)',
  24: 'var(--spacing-24)',

  // Semantic aliases
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
  '2xl': 'var(--spacing-2xl)',
} as const;

/**
 * Font tokens
 */
export const fonts = {
  family: {
    sans: 'var(--font-family)',
    mono: 'var(--font-family-mono)',
  },
  size: {
    base: 'var(--font-size)',
  },
  weight: {
    light: 'var(--font-weight-light)',
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },
  lineHeight: {
    document: 'var(--document-line-height)',
  },
} as const;

/**
 * Animation tokens
 */
export const animation = {
  duration: {
    instant: 'var(--motion-duration-instant)',
    fast: 'var(--motion-duration-fast)',
    normal: 'var(--motion-duration-normal)',
    slow: 'var(--motion-duration-slow)',
  },
  ease: {
    default: 'var(--motion-ease)',
    out: 'var(--motion-ease-out)',
    in: 'var(--motion-ease-in)',
    inOut: 'var(--motion-ease-in-out)',
  },
} as const;

/**
 * Border radius tokens
 */
export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: '9999px',
} as const;

/**
 * Container max-width tokens
 */
export const containers = {
  sm: 'var(--container-sm)',
  md: 'var(--container-md)',
  lg: 'var(--container-lg)',
  xl: 'var(--container-xl)',
  '2xl': 'var(--container-2xl)',
  document: 'var(--container-document)',
} as const;

/**
 * Icon size tokens
 */
export const iconSizes = {
  xs: 'var(--icon-xs)',
  sm: 'var(--icon-sm)',
  md: 'var(--icon-md)',
  lg: 'var(--icon-lg)',
  xl: 'var(--icon-xl)',
  '2xl': 'var(--icon-2xl)',
} as const;

/**
 * Component height tokens
 */
export const heights = {
  input: 'var(--height-input)',
  button: 'var(--height-button)',
  buttonSm: 'var(--height-button-sm)',
  buttonLg: 'var(--height-button-lg)',
  header: 'var(--height-header)',
  footer: 'var(--height-footer)',
} as const;

/**
 * Z-index scale for consistent layering
 */
export const zIndex = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  fixed: 200,
  modalBackdrop: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
  max: 9999,
} as const;

/**
 * Combined design tokens export
 */
export const tokens = {
  colors,
  spacing,
  fonts,
  animation,
  radius,
  containers,
  iconSizes,
  heights,
  zIndex,
} as const;

export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type FontToken = keyof typeof fonts.family;
export type AnimationDuration = keyof typeof animation.duration;
export type RadiusToken = keyof typeof radius;
