import React from 'react';
import { Box, Typography } from '@mui/material';
import { Appointment, AppointmentStatus } from '@domain/entities/Appointment';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';
import { appColors } from '@presentation/theme/appColors';
import { DEFAULT_DURATION_MINUTES } from '@shared/constants/agenda';
import { formatTimeRange, timeToMinutes } from '@shared/utils/agendaLayout';
import { formatTime } from '@shared/utils/formatters';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  /** Con la duración ajustable activa se muestra el rango (3:00 PM – 4:00 PM) en vez de solo la hora de inicio. */
  showDuration?: boolean;
}

// Mismo mapeo local usado en ClientAppointmentHistory (no forma parte de appColors).
const STATUS_BADGE_COLORS: Record<AppointmentStatus, string> = {
  completed: '#10B981',
  confirmed: appColors.accent,
  scheduled: '#3B82F6',
  cancelled: appColors.error,
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick, showDuration = false }) => {
  const startMinutes = timeToMinutes(appointment.time);
  const timeLabel =
    showDuration && !Number.isNaN(startMinutes)
      ? formatTimeRange(startMinutes, appointment.durationMinutes ?? DEFAULT_DURATION_MINUTES)
      : formatTime(appointment.time);

  return (
    <Box
      onClick={() => onClick?.(appointment)}
      sx={{
        display: 'flex',
        borderRadius: '14px',
        border: `1px solid ${appColors.border}`,
        backgroundColor: appColors.surfaceElevated,
        overflow: 'hidden',
        mb: 1.25,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'opacity 0.15s ease',
        '&:hover': onClick ? { opacity: 0.85 } : undefined,
      }}
    >
      <Box sx={{ width: 4, flexShrink: 0, backgroundColor: appColors.accent }} />
      <Box sx={{ flex: 1, px: 1.75, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: appColors.textPrimary,
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-word',
            }}
          >
            {appointment.clientName}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
              ml: 1,
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: appColors.accent, whiteSpace: 'nowrap' }}>
              {timeLabel}
            </Typography>
            <Box
              sx={{
                borderRadius: '999px',
                px: 1.1,
                py: 0.3,
                backgroundColor: STATUS_BADGE_COLORS[appointment.status],
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {APPOINTMENT_CONSTANTS.STATUS_LABELS[appointment.status]}
              </Typography>
            </Box>
          </Box>
        </Box>
        {appointment.serviceName && (
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: appColors.textSecondary }}>
            {appointment.serviceName}
          </Typography>
        )}
        <Typography sx={{ fontSize: 12, color: appColors.textSecondary }}>
          Teléfono: {appointment.phone}
        </Typography>
        {appointment.notes && (
          <Typography sx={{ fontSize: 12, fontStyle: 'italic', color: appColors.textSecondary, mt: 0.5 }}>
            {appointment.notes}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
