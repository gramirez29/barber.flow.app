import { createTheme, ThemeOptions } from '@mui/material/styles';

// ============================================================================
// Barber Flow - Unified Theme (Synchronized with Mobile App)
// ============================================================================
// Color Palette Reference:
// - Primary Accent (Gold): #C9A84C (matching mobile's secondary/accent color)
// - Accent Light: #E5C878 (for hover states and lighter variants)
// - Success: #10B981 (matches mobile)
// - Error: #DC2626 (light) / #EF4444 (dark) (matches mobile)
// - Info: #3B82F6 (matches mobile)
// ============================================================================

const sharedThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600, color: '#FFFFFF' },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px', // Matches mobile radius
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
          minHeight: '48px', // Matches mobile button height
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        containedPrimary: {
          backgroundColor: '#C9A84C',
          color: '#0D0D0D',
          '&:hover': {
            backgroundColor: '#E5C878',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px', // Matches mobile input radius
            padding: '14px', // Matches mobile input padding
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
      },
    },
  },
};

// ============================================================================
// LIGHT THEME - Synchronized with Mobile (Premium Dark Background)
// ============================================================================
// Mobile Reference: background: #1A1A1A, surface: #242424, card: #2A2A2A
// ============================================================================
export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#C9A84C', // Gold accent (matches mobile secondary)
      light: '#E5C878', // Light gold for hover states
      dark: '#A68637', // Darker gold for active states
      contrastText: '#0D0D0D', // Dark text on gold
    },
    secondary: {
      main: '#A1A1AA', // Text secondary from mobile
      light: '#D4D4D8',
      dark: '#71717A',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Matches mobile
      light: '#6EE7B7',
      dark: '#059669',
    },
    error: {
      main: '#DC2626', // Matches mobile light mode error
      light: '#EF5350',
      dark: '#B71C1C',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#3B82F6', // Matches mobile
      light: '#64B5F6',
      dark: '#1976D2',
    },
    background: {
      default: '#1A1A1A', // Matches mobile light mode background
      paper: '#242424', // Matches mobile light mode surface
    },
    text: {
      primary: '#FFFFFF', // Matches mobile primary text
      secondary: '#A1A1AA', // Matches mobile secondary text
      disabled: '#71717A',
    },
    divider: '#333333', // Matches mobile border color
    action: {
      active: '#C9A84C',
      hover: 'rgba(201, 168, 76, 0.08)',
      selected: 'rgba(201, 168, 76, 0.16)',
      disabled: '#71717A',
      disabledBackground: 'rgba(201, 168, 76, 0.12)',
    },
  },
});

// ============================================================================
// DARK THEME - Synchronized with Mobile (Even Darker Background)
// ============================================================================
// Mobile Reference: background: #0D0D0D, surface: #161616, card: #1E1E1E
// ============================================================================
export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#C9A84C', // Gold accent (consistent across themes)
      light: '#E5C878', // Light gold for hover states
      dark: '#A68637', // Darker gold for active states
      contrastText: '#0D0D0D', // Dark text on gold
    },
    secondary: {
      main: '#A3A3A3', // Text secondary from mobile dark mode
      light: '#D4D4D8',
      dark: '#737373',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Matches mobile
      light: '#6EE7B7',
      dark: '#059669',
    },
    error: {
      main: '#EF4444', // Matches mobile dark mode error
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#3B82F6', // Matches mobile
      light: '#64B5F6',
      dark: '#1976D2',
    },
    background: {
      default: '#0D0D0D', // Matches mobile dark mode background
      paper: '#161616', // Matches mobile dark mode surface
    },
    text: {
      primary: '#FFFFFF', // Matches mobile primary text
      secondary: '#A3A3A3', // Matches mobile dark mode secondary text
      disabled: '#737373',
    },
    divider: '#262626', // Matches mobile dark mode border
    action: {
      active: '#C9A84C',
      hover: 'rgba(201, 168, 76, 0.12)',
      selected: 'rgba(201, 168, 76, 0.20)',
      disabled: '#737373',
      disabledBackground: 'rgba(201, 168, 76, 0.12)',
    },
  },
});
