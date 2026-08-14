import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Appointment, AppointmentStatus } from '@domain/entities/Appointment';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';
import { formatDateTime, formatCurrency } from '@shared/utils/formatters';
import { useClients } from '@presentation/hooks/useClients';
import { appColors } from '@presentation/theme/appColors';

interface ClientAppointmentHistoryProps {
  clientId: string;
}

const STATUS_BADGE_COLORS: Record<AppointmentStatus, string> = {
  completed: '#10B981',
  confirmed: appColors.accent,
  scheduled: '#3B82F6',
  cancelled: appColors.error,
};

export const ClientAppointmentHistory: React.FC<ClientAppointmentHistoryProps> = ({ clientId }) => {
  const { getAppointmentHistory } = useClients();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    getAppointmentHistory(clientId)
      .then((data) => {
        if (active) setAppointments(data);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el historial de citas');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary, mb: 1.5 }}>
        Historial de citas
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={22} sx={{ color: appColors.accent }} />
        </Box>
      ) : error ? (
        <Typography sx={{ fontSize: 13, color: appColors.error, textAlign: 'center', py: 2 }}>
          {error}
        </Typography>
      ) : appointments.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${appColors.border}`,
            borderRadius: '14px',
            p: 2.5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary }}>
            Sin historial de citas todavía.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {appointments.map((appointment) => (
            <Box
              key={appointment.id}
              sx={{
                backgroundColor: appColors.surfaceElevated,
                borderRadius: '14px',
                border: `1px solid ${appColors.border}`,
                p: 1.75,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: appColors.textPrimary }}>
                  {formatDateTime(appointment.date, appointment.time)}
                </Typography>
                <Box
                  sx={{
                    borderRadius: '999px',
                    px: 1.1,
                    py: 0.3,
                    flexShrink: 0,
                    backgroundColor: STATUS_BADGE_COLORS[appointment.status],
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase' }}>
                    {APPOINTMENT_CONSTANTS.STATUS_LABELS[appointment.status]}
                  </Typography>
                </Box>
              </Box>

              {appointment.serviceName && (
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: appColors.accent, mt: 0.5 }}>
                  {appointment.serviceName}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.75 }}>
                {typeof appointment.servicePrice === 'number' && (
                  <Typography sx={{ fontSize: 12, color: appColors.textSecondary }}>
                    {formatCurrency(appointment.servicePrice)}
                  </Typography>
                )}
                {appointment.paymentMethodUsed && (
                  <Typography sx={{ fontSize: 12, color: appColors.textSecondary }}>
                    {APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS[appointment.paymentMethodUsed]}
                  </Typography>
                )}
              </Box>

              {appointment.notes && (
                <Typography
                  sx={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: appColors.textSecondary,
                    mt: 0.75,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {appointment.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
