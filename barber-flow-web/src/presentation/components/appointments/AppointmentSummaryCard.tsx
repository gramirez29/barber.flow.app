import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

export type CalendarViewMode = 'month' | 'week' | 'day';

interface AppointmentSummaryCardProps {
  selectedDateLabel: string;
  appointmentCount: number;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onNewAppointment: () => void;
  onToday: () => void;
}

const VIEW_MODES: { mode: CalendarViewMode; label: string }[] = [
  { mode: 'month', label: 'Mes' },
  { mode: 'week', label: 'Semana' },
  { mode: 'day', label: 'Día' },
];

export const AppointmentSummaryCard: React.FC<AppointmentSummaryCardProps> = ({
  selectedDateLabel,
  appointmentCount,
  viewMode,
  onViewModeChange,
  onNewAppointment,
  onToday,
}) => {
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: appColors.accent,
            }}
          >
            Fecha seleccionada
          </Typography>
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 700,
              textTransform: 'capitalize',
              color: appColors.textPrimary,
            }}
          >
            {selectedDateLabel}
          </Typography>
          <Typography sx={{ fontSize: 14, color: appColors.textSecondary }}>
            {appointmentCount} {appointmentCount === 1 ? 'cita' : 'citas'} para este día
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
          <Box
            component="button"
            onClick={onNewAppointment}
            sx={{
              border: 'none',
              cursor: 'pointer',
              backgroundColor: appColors.accent,
              borderRadius: '14px',
              height: 44,
              px: 2.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 8px ${appColors.accent}59`,
              color: appColors.onAccent,
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.3px',
              '&:hover': { backgroundColor: appColors.accentLight },
            }}
          >
            Nueva cita
          </Box>
          <Box
            component="button"
            onClick={onToday}
            sx={{
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              px: 1,
              py: 0.75,
              color: appColors.accent,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Hoy
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          mt: 2,
          backgroundColor: appColors.surfaceElevated,
          borderRadius: '12px',
          border: `1px solid ${appColors.border}`,
          p: 0.5,
          gap: 0.5,
        }}
      >
        {VIEW_MODES.map(({ mode, label }) => {
          const active = mode === viewMode;
          return (
            <Box
              key={mode}
              component="button"
              onClick={() => onViewModeChange(mode)}
              sx={{
                flex: 1,
                border: 'none',
                cursor: 'pointer',
                py: 1,
                borderRadius: '10px',
                backgroundColor: active ? appColors.accent : 'transparent',
                color: active ? appColors.background : appColors.textSecondary,
                fontSize: 11,
                fontWeight: active ? 800 : 600,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
