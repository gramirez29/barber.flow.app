import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { appColors } from '@presentation/theme/appColors';

interface AppointmentCalendarGridProps {
  visibleMonth: Date;
  selectedDate: Date;
  appointmentDates: Set<string>;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const AppointmentCalendarGrid: React.FC<AppointmentCalendarGridProps> = ({
  visibleMonth,
  selectedDate,
  appointmentDates,
  onSelectDate,
  onMonthChange,
}) => {
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton size="small" onClick={() => onMonthChange(subMonths(visibleMonth, 1))} sx={{ color: appColors.accent }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          sx={{ fontSize: 15, fontWeight: 700, color: appColors.textPrimary, textTransform: 'capitalize' }}
        >
          {format(visibleMonth, 'MMMM yyyy', { locale: es })}
        </Typography>
        <IconButton size="small" onClick={() => onMonthChange(addMonths(visibleMonth, 1))} sx={{ color: appColors.accent }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '4px',
          pb: 1,
          mb: 1,
          borderBottom: `1px solid ${appColors.border}`,
        }}
      >
        {WEEKDAY_LABELS.map((label, idx) => (
          <Typography
            key={idx}
            sx={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: appColors.accent,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, visibleMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const hasAppointments = appointmentDates.has(dateKey);

          return (
            <Box
              key={dateKey}
              component="button"
              onClick={() => onSelectDate(day)}
              sx={{
                width: '100%',
                minWidth: 0,
                p: 0,
                m: 0,
                font: 'inherit',
                border: today && !selected ? `1px solid ${appColors.accent}` : '1px solid transparent',
                cursor: 'pointer',
                borderRadius: '16px',
                aspectRatio: '1 / 1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? appColors.accent : 'transparent',
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: selected || today ? 700 : 500,
                  color: selected ? appColors.background : appColors.textPrimary,
                }}
              >
                {format(day, 'd')}
              </Typography>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '2px',
                  mt: '2px',
                  backgroundColor: hasAppointments ? (selected ? appColors.background : appColors.accent) : 'transparent',
                }}
              />
            </Box>
          );
        })}
      </Box>

      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 1.5 }}>
        Toca un día para ver sus citas. Mantén presionado para crear una nueva cita.
      </Typography>
    </Box>
  );
};
