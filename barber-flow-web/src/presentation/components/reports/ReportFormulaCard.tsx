import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import { formatCurrency } from '@shared/utils/formatters';

interface ReportFormulaCardProps {
  commissionAmount: number;
  fixedDailyExpense: number;
}

export const ReportFormulaCard: React.FC<ReportFormulaCardProps> = ({
  commissionAmount,
  fixedDailyExpense,
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
        Fórmula de ganancia
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Ganancias del día
      </Typography>
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, mb: 2 }}>
        Ganancia neta = ingresos brutos - comisión del barbero - gasto fijo diario
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 140 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: appColors.textSecondary,
              mb: 0.5,
            }}
          >
            Monto de comisión
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary }}>
            {formatCurrency(commissionAmount)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 140 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: appColors.textSecondary,
              mb: 0.5,
            }}
          >
            Gasto fijo diario
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary }}>
            {formatCurrency(fixedDailyExpense)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
