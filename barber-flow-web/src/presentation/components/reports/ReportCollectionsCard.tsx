import React from 'react';
import { Box, Typography } from '@mui/material';
import { PaymentMethodBreakdownItem } from '@domain/entities';
import { appColors } from '@presentation/theme/appColors';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';
import { formatCurrency } from '@shared/utils/formatters';

interface ReportCollectionsCardProps {
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
}

const getPaymentMethodLabel = (paymentMethod: string): string =>
  APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS[
    paymentMethod as keyof typeof APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS
  ] ?? paymentMethod;

export const ReportCollectionsCard: React.FC<ReportCollectionsCardProps> = ({
  paymentMethodBreakdown,
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
        Cobros
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Desglose por método de pago
      </Typography>
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, mb: 2 }}>
        Revisa cómo se pagaron las ventas completadas del día para conciliar caja y cobros
        digitales.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {paymentMethodBreakdown
          .filter((item) => item.paymentMethod !== 'none' || item.appointmentCount > 0)
          .map((item) => (
          <Box
            key={item.paymentMethod}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: appColors.surfaceElevated,
              border: `1px solid ${appColors.border}`,
              borderRadius: '14px',
              px: 2,
              py: 1.75,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: appColors.textPrimary }}>
                {getPaymentMethodLabel(item.paymentMethod)}
              </Typography>
              <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.25 }}>
                {item.appointmentCount === 1
                  ? '1 cita completada'
                  : `${item.appointmentCount} citas completadas`}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.accent }}>
              {formatCurrency(item.total)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
