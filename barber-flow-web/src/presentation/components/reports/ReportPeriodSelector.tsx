import React from 'react';
import { Box } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import { PERIOD_COPY, REPORT_PERIODS, ReportPeriod } from '@shared/utils/reportPeriods';

interface ReportPeriodSelectorProps {
  period: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
  disabled?: boolean;
}

/** Día · Semana · Mes. Mismo estilo de pills que el selector de vistas de Citas. */
export const ReportPeriodSelector: React.FC<ReportPeriodSelectorProps> = ({ period, onChange, disabled = false }) => (
  <Box
    role="group"
    aria-label="Periodo del reporte"
    sx={{
      display: 'flex',
      backgroundColor: appColors.surfaceElevated,
      borderRadius: '12px',
      border: `1px solid ${appColors.border}`,
      p: 0.5,
      gap: 0.5,
    }}
  >
    {REPORT_PERIODS.map((option) => {
      const active = option === period;
      return (
        <Box
          key={option}
          component="button"
          type="button"
          aria-pressed={active}
          disabled={disabled}
          onClick={() => !active && onChange(option)}
          sx={{
            flex: 1,
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            py: 1,
            borderRadius: '10px',
            backgroundColor: active ? appColors.accent : 'transparent',
            color: active ? appColors.background : appColors.textSecondary,
            fontSize: 11,
            fontWeight: active ? 800 : 600,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            opacity: disabled && !active ? 0.6 : 1,
          }}
        >
          {PERIOD_COPY[option].selectorLabel}
        </Box>
      );
    })}
  </Box>
);
