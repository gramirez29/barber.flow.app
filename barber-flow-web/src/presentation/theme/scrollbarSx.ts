import { appColors } from './appColors';

export const scrollbarSx = {
  scrollbarWidth: 'thin',
  scrollbarColor: `${appColors.accent} transparent`,
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: appColors.accent,
    borderRadius: '8px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: appColors.accentLight,
  },
} as const;
