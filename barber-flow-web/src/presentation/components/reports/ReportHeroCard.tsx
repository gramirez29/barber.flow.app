import React from 'react';
import { Box, Typography, InputBase } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { appColors } from '@presentation/theme/appColors';
import {
  PERIOD_COPY,
  ReportPeriod,
  formatMonthLabel,
  formatWeekLabel,
  fromMonthInputValue,
  toMonthInputValue,
} from '@shared/utils/reportPeriods';
import { ReportPeriodSelector } from './ReportPeriodSelector';

interface ReportHeroCardProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

const arrowButtonSx = {
  border: `1px solid ${appColors.border}`,
  cursor: 'pointer',
  backgroundColor: appColors.surfaceElevated,
  color: appColors.textPrimary,
  borderRadius: '12px',
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '&:hover': { borderColor: appColors.accent },
  '&:disabled': { opacity: 0.6, cursor: 'default' },
};

export const ReportHeroCard: React.FC<ReportHeroCardProps> = ({
  period,
  onPeriodChange,
  selectedDate,
  onDateChange,
  onToday,
  onPrevious,
  onNext,
  isLoading = false,
}) => {
  const copy = PERIOD_COPY[period];
  const rangeLabel =
    period === 'weekly' ? formatWeekLabel(selectedDate) : period === 'monthly' ? formatMonthLabel(selectedDate) : null;

  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
        boxShadow: '0 4px 12px rgba(201, 168, 76, 0.08)',
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: appColors.accent,
        }}
      >
        Resumen del negocio
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        {copy.heroTitle}
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, mt: 0.5 }}>
        Supervisa servicios completados, ventas cobradas y la ganancia real {copy.ofPeriod} desde un solo
        reporte operativo.
      </Typography>

      <Box sx={{ mt: 2.5 }}>
        <ReportPeriodSelector period={period} onChange={onPeriodChange} disabled={isLoading} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.25,
          mt: 2,
        }}
      >
        {period !== 'daily' && (
          <Box component="button" type="button" aria-label="Periodo anterior" onClick={onPrevious} disabled={isLoading} sx={arrowButtonSx}>
            <ChevronLeftIcon />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: appColors.surfaceElevated,
            borderRadius: '12px',
            border: `1px solid ${appColors.border}`,
            px: 1.5,
            flex: 1,
            minWidth: 200,
          }}
        >
          {period === 'monthly' ? (
            <InputBase
              type="month"
              value={toMonthInputValue(selectedDate)}
              onChange={(e) => e.target.value && onDateChange(fromMonthInputValue(e.target.value))}
              disabled={isLoading}
              sx={{
                flex: 1,
                py: 1.25,
                fontSize: 15,
                color: appColors.textPrimary,
                '& input': { colorScheme: 'dark' },
              }}
            />
          ) : (
            <InputBase
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              disabled={isLoading}
              sx={{
                flex: 1,
                py: 1.25,
                fontSize: 15,
                color: appColors.textPrimary,
                '& input': { colorScheme: 'dark' },
              }}
            />
          )}
        </Box>

        {period !== 'daily' && (
          <Box component="button" type="button" aria-label="Periodo siguiente" onClick={onNext} disabled={isLoading} sx={arrowButtonSx}>
            <ChevronRightIcon />
          </Box>
        )}

        <Box
          component="button"
          onClick={onToday}
          disabled={isLoading}
          sx={{
            border: 'none',
            cursor: 'pointer',
            backgroundColor: appColors.accent,
            borderRadius: '12px',
            height: 44,
            px: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: appColors.onAccent,
            fontWeight: 800,
            fontSize: 14,
            opacity: isLoading ? 0.6 : 1,
            '&:hover': { backgroundColor: appColors.accentLight },
          }}
        >
          {copy.todayLabel}
        </Box>
      </Box>

      {rangeLabel && (
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: appColors.textPrimary, mt: 1.5 }}>
          {rangeLabel}
        </Typography>
      )}
    </Box>
  );
};
