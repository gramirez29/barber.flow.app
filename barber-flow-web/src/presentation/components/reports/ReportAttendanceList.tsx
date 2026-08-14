import React from 'react';
import { Box, Typography } from '@mui/material';
import { CompletedAppointmentReportItem } from '@domain/entities';
import { appColors } from '@presentation/theme/appColors';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';
import { formatCurrency } from '@shared/utils/formatters';

interface ReportAttendanceListProps {
  completedAppointments: CompletedAppointmentReportItem[];
}

const getPaymentMethodLabel = (paymentMethod: string): string =>
  APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS[
    paymentMethod as keyof typeof APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS
  ] ?? 'Método de pago no definido';

export const ReportAttendanceList: React.FC<ReportAttendanceListProps> = ({
  completedAppointments,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
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
        Asistencia
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Citas completadas
      </Typography>
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, mb: 2 }}>
        Detalle de los clientes completados contados en este cierre.
      </Typography>

      {completedAppointments.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            backgroundColor: appColors.surfaceElevated,
            border: `1px solid ${appColors.border}`,
            borderRadius: '14px',
            px: 2.5,
            py: 3.5,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary, mb: 0.75 }}>
            No hay citas completadas
          </Typography>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, lineHeight: 1.5 }}>
            Marca las citas como completadas en Citas para incluirlas en el reporte de cierre
            diario.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {completedAppointments.map((appointment) => (
            <Box
              key={appointment.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                backgroundColor: appColors.surfaceElevated,
                border: `1px solid ${appColors.border}`,
                borderRadius: '14px',
                px: 2,
                py: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: appColors.textPrimary }}>
                  {appointment.clientName}
                </Typography>
                <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.25 }}>
                  {appointment.time} · {appointment.serviceName ?? 'Servicio general'}
                </Typography>
                <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.25 }}>
                  {getPaymentMethodLabel(appointment.paymentMethodUsed)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.accent, flexShrink: 0 }}>
                {formatCurrency(appointment.servicePrice)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
