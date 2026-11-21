import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PeriodReportDay } from '@domain/entities';
import { appColors } from '@presentation/theme/appColors';
import { formatCurrency } from '@shared/utils/formatters';
import { formatDayLabel } from '@shared/utils/reportPeriods';

interface ReportDaysDetailProps {
  days: PeriodReportDay[];
  /** Abre el reporte diario del día tocado. */
  onSelectDay: (date: string) => void;
}

const GRID = 'minmax(88px, 1.4fr) minmax(56px, 0.8fr) minmax(88px, 1.2fr) minmax(88px, 1.2fr)';

const headerCellSx = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
  color: appColors.textSecondary,
} as const;

/**
 * Semana y mes muestran solo los totales (como el diario); esta tarjeta guarda la tabla día por día
 * detrás de un botón "Ver detalle" para no recargar la pantalla.
 */
export const ReportDaysDetail: React.FC<ReportDaysDetailProps> = ({ days, onSelectDay }) => {
  const [open, setOpen] = useState(false);

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
        Detalle
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Detalle por día
      </Typography>
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, mb: 2 }}>
        Clientes, ingresos brutos y ganancia neta de cada día. Toca un día para ver su reporte diario.
      </Typography>

      <Box
        component="button"
        type="button"
        aria-expanded={open}
        aria-controls="report-days-table"
        onClick={() => setOpen((current) => !current)}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          cursor: 'pointer',
          backgroundColor: 'transparent',
          border: `1px solid ${appColors.accent}`,
          color: appColors.accent,
          borderRadius: '12px',
          py: 1.25,
          fontSize: 14,
          fontWeight: 700,
          '&:hover': { backgroundColor: appColors.surfaceElevated },
        }}
      >
        {open ? 'Ocultar detalle' : 'Ver detalle'}
        <ExpandMoreIcon sx={{ fontSize: 20, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </Box>

      {open && (
        <Box id="report-days-table" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: GRID, gap: 1, px: 1.5, pb: 0.5 }}>
            <Typography sx={headerCellSx}>Día</Typography>
            <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Clientes</Typography>
            <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Bruto</Typography>
            <Typography sx={{ ...headerCellSx, textAlign: 'right' }}>Neto</Typography>
          </Box>

          {days.map((day) => {
            const hasSales = day.totalCustomersServed > 0;
            return (
              <Box
                key={day.date}
                component="button"
                type="button"
                onClick={() => onSelectDay(day.date)}
                aria-label={`Ver reporte diario de ${formatDayLabel(day.date)}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: 1,
                  alignItems: 'center',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor: appColors.surfaceElevated,
                  border: `1px solid ${appColors.border}`,
                  borderRadius: '12px',
                  px: 1.5,
                  py: 1.25,
                  '&:hover': { borderColor: appColors.accent },
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: hasSales ? appColors.textPrimary : appColors.textSecondary }}>
                  {formatDayLabel(day.date)}
                </Typography>
                <Typography sx={{ fontSize: 14, textAlign: 'right', color: hasSales ? appColors.textPrimary : appColors.textSecondary }}>
                  {day.totalCustomersServed}
                </Typography>
                <Typography sx={{ fontSize: 14, textAlign: 'right', color: hasSales ? appColors.textPrimary : appColors.textSecondary }}>
                  {formatCurrency(day.grossRevenue)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: 'right',
                    color: day.netProfit < 0 ? appColors.error : hasSales ? appColors.accent : appColors.textSecondary,
                  }}
                >
                  {formatCurrency(day.netProfit)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
