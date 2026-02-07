export const lightTheme = {
  mode: 'light',
  colors: {
    background: '#F4F6F8',
    surface: '#FFFFFF',
    primary: '#111827',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    tabActive: '#111827',
    tabInactive: '#9CA3AF',
    notificationBadge: '#EF4444',
    card: '#1E1E1E',
    primaryInput: '#FFFFFF',
    primaryTextInput: '#6B7280'
  },
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: '#334155',
    tabActive: '#FFFFFF',
    tabInactive: '#64748B',
    notificationBadge: '#F87171',
    card: '#F5F7FA',
    primaryInput: '#FFFFFF',
    primaryTextInput: '#6B7280'
  },
};

export type AppTheme = typeof lightTheme;
