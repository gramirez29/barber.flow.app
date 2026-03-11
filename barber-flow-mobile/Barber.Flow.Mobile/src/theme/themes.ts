export const lightTheme = {
  mode: 'light',
  colors: {
    background: '#F4F6F8',
    surface: '#FFFFFF',
    primary: '#111827',
    secondary: '#3B82F6', // Added secondary color (blue)
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    tabActive: '#111827',
    tabInactive: '#9CA3AF',
    notificationBadge: '#EF4444',
    card: '#1E1E1E',
    primaryInput: '#FFFFFF',
    primaryTextInput: '#6B7280',
    error: '#DC2626'
  },
  layout: {
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radius: { sm: 6, md: 10, lg: 14 },
    sizes: { avatar: 64, headerHeight: 64, imageBannerHeight: 180, maxContentWidth: 520 },
    shadows: {
      color: '#000',
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }
    },
    typography: { h1: 20, body: 16, small: 13 },
    components: {
      input: { paddingVertical: 14, paddingHorizontal: 14, radius: 10 },
      button: { height: 48, radius: 10, fontSize: 16 }
    }
  }
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#FFFFFF',
    secondary: '#60A5FA', // Added secondary color (light blue)
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: '#334155',
    tabActive: '#FFFFFF',
    tabInactive: '#64748B',
    notificationBadge: '#F87171',
    card: '#F5F7FA',
    primaryInput: '#0B1220',
    primaryTextInput: '#94A3B8',
    error: '#F87171'
  },
  layout: {
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radius: { sm: 6, md: 10, lg: 14 },
    sizes: { avatar: 64, headerHeight: 64, imageBannerHeight: 180, maxContentWidth: 520 },
    shadows: {
      color: '#000',
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }
    },
    typography: { h1: 20, body: 16, small: 13 },
    components: {
      input: { paddingVertical: 14, paddingHorizontal: 14, radius: 10 },
      button: { height: 48, radius: 10, fontSize: 16 }
    }
  }
};

export type AppTheme = typeof lightTheme;