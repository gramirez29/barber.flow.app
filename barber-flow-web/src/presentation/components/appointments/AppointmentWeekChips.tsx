import React from 'react';
import { Box, Typography } from '@mui/material';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { appColors } from '@presentation/theme/appColors';

interface AppointmentWeekChipsProps {
  selectedDate: Date;
  appointmentCountByDate: Map<string, number>;
  onSelectDate: (date: Date) => void;
}

export const AppointmentWeekChips: React.FC<AppointmentWeekChipsProps> = ({
  selectedDate,
  appointmentCountByDate,
  onSelectDate,
}) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
      {days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const active = isSameDay(day, selectedDate);
        const count = appointmentCountByDate.get(dateKey) || 0;

        return (
          <Box
            key={dateKey}
            component="button"
            onClick={() => onSelectDate(day)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              flex: 1,
              minWidth: 0,
              borderRadius: '14px',
              border: `1px solid ${active ? appColors.accent : appColors.border}`,
              backgroundColor: active ? appColors.accent : appColors.surfaceElevated,
              px: 1.25,
              py: 1.25,
              boxShadow: active ? `0 2px 6px ${appColors.accent}66` : 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: active ? appColors.background : appColors.textSecondary,
              }}
            >
              {format(day, 'EEEEE', { locale: es })}
            </Typography>
            <Typography
              sx={{ fontSize: 18, fontWeight: 700, color: active ? appColors.background : appColors.textPrimary }}
            >
              {format(day, 'd')}
            </Typography>
            <Typography sx={{ fontSize: 10, color: active ? appColors.background : appColors.textSecondary }}>
              {count} {count === 1 ? 'cita' : 'citas'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};
