import React from 'react';
import { Box, Typography, InputBase } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

interface ReportHeroCardProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToday: () => void;
  isLoading?: boolean;
}

export const ReportHeroCard: React.FC<ReportHeroCardProps> = ({
  selectedDate,
  onDateChange,
  onToday,
  isLoading = false,
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
        Reporte de cierre diario
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, mt: 0.5 }}>
        Supervisa servicios completados, ventas cobradas y la ganancia real del día desde un solo
        reporte operativo.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.25,
          mt: 2.5,
        }}
      >
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
          <InputBase
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={isLoading}
            sx={{
              flex: 1,
              py: 1.25,
              fontSize: 15,
              color: appColors.textPrimary,
              '& input': { colorScheme: 'dark' },
            }}
          />
        </Box>

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
          Hoy
        </Box>
      </Box>
    </Box>
  );
};
