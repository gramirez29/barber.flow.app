import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import { formatCurrency } from '@shared/utils/formatters';
import { PERIOD_COPY, ReportPeriod } from '@shared/utils/reportPeriods';

interface ReportFormulaCardProps {
  commissionAmount: number;
  /** Gasto fijo de UN día. */
  fixedDailyExpense: number;
  /** Diario por defecto; en semana y mes el gasto se muestra como total del periodo. */
  period?: ReportPeriod;
  /** Gasto fijo total del periodo (fixedDailyExpense × countedDays). Solo semana/mes. */
  fixedExpenseTotal?: number;
  /** Días a los que se les cobró el gasto fijo (hasta hoy si el periodo sigue en curso). Solo semana/mes. */
  countedDays?: number;
}

const labelSx = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
  color: appColors.textSecondary,
  mb: 0.5,
} as const;

export const ReportFormulaCard: React.FC<ReportFormulaCardProps> = ({
  commissionAmount,
  fixedDailyExpense,
  period = 'daily',
  fixedExpenseTotal,
  countedDays,
}) => {
  const isPeriod = period !== 'daily';
  const expenseValue = isPeriod ? fixedExpenseTotal ?? 0 : fixedDailyExpense;
  const days = countedDays ?? 0;

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
        {PERIOD_COPY[period].profitTitle}
      </Typography>
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, mb: 2 }}>
        {isPeriod
          ? 'Ganancia neta = ingresos brutos - comisión del barbero - gasto fijo diario × días del periodo'
          : 'Ganancia neta = ingresos brutos - comisión del barbero - gasto fijo diario'}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 140 }}>
          <Typography sx={labelSx}>Monto de comisión</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary }}>
            {formatCurrency(commissionAmount)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 140 }}>
          <Typography sx={labelSx}>{isPeriod ? 'Gasto fijo del periodo' : 'Gasto fijo diario'}</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary }}>
            {formatCurrency(expenseValue)}
          </Typography>
          {isPeriod && (
            <Typography sx={{ fontSize: 12, color: appColors.textSecondary, mt: 0.25 }}>
              {formatCurrency(fixedDailyExpense)} × {days} {days === 1 ? 'día' : 'días'}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};
