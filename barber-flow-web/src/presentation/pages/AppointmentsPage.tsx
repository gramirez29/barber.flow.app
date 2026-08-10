import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AppointmentForm,
  AppointmentAgendaList,
  AppointmentSummaryCard,
  AppointmentCalendarGrid,
  AppointmentWeekChips,
} from '@presentation/components/appointments';
import type { CalendarViewMode } from '@presentation/components/appointments';
import { useAppointments } from '@presentation/hooks/useAppointments';
import { CreateAppointmentFormData } from '@shared/validation/appointmentSchemas';
import { Appointment } from '@domain/entities/Appointment';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

type ViewMode = CalendarViewMode;

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const AppointmentsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const {
    appointments,
    isLoadingAppointments,
    fetchAppointmentsByDate,
    fetchAppointmentsByDateRange,
    createAppointment,
    updateAppointment,
    moveAppointment,
  } = useAppointments();

  useEffect(() => {
    if (viewMode === 'month') {
      fetchAppointmentsByDateRange(
        format(startOfMonth(visibleMonth), 'yyyy-MM-dd'),
        format(endOfMonth(visibleMonth), 'yyyy-MM-dd')
      );
    } else if (viewMode === 'week') {
      fetchAppointmentsByDateRange(
        format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      );
    } else {
      fetchAppointmentsByDate(toKey(selectedDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, visibleMonth, selectedDate]);

  const appointmentsForSelectedDay = useMemo(
    () => appointments.filter((apt) => apt.date === toKey(selectedDate)),
    [appointments, selectedDate]
  );

  const appointmentDates = useMemo(() => new Set(appointments.map((apt) => apt.date)), [appointments]);

  const appointmentCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((apt) => map.set(apt.date, (map.get(apt.date) || 0) + 1));
    return map;
  }, [appointments]);

  const handleOpenCreateForm = () => {
    setEditingAppointment(null);
    setFormOpen(true);
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAppointment(null);
  };

  const refreshCurrentRange = () => {
    if (viewMode === 'month') {
      fetchAppointmentsByDateRange(
        format(startOfMonth(visibleMonth), 'yyyy-MM-dd'),
        format(endOfMonth(visibleMonth), 'yyyy-MM-dd')
      );
    } else if (viewMode === 'week') {
      fetchAppointmentsByDateRange(
        format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'yyyy-MM-dd')
      );
    } else {
      fetchAppointmentsByDate(toKey(selectedDate));
    }
  };

  const handleFormSubmit = async (data: CreateAppointmentFormData) => {
    const { price, paymentMethod, ...rest } = data;
    const request = {
      ...rest,
      servicePrice: price,
      paymentMethodUsed: paymentMethod,
    };

    if (editingAppointment) {
      await updateAppointment(editingAppointment.id!, request);
    } else {
      await createAppointment(request);
    }
    refreshCurrentRange();
  };

  const handleMove = async (appointmentId: string, newDate: string, newTime: string) => {
    await moveAppointment(appointmentId, newDate, newTime);
    refreshCurrentRange();
    handleCloseForm();
  };

  const handleSelectDateFromMonth = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  const handleMonthChange = (date: Date) => {
    setVisibleMonth(date);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setVisibleMonth(today);
  };

  const emptyMessage =
    viewMode === 'month'
      ? 'Selecciona un día del calendario para ver sus citas o mantenlo presionado para crear una nueva reserva.'
      : viewMode === 'week'
        ? 'Selecciona un día de la semana y usa Nueva cita para crear la reserva.'
        : 'Todavía no hay reservas para este día.';

  return (
    <Box
      sx={{
        minHeight: '100%',
        backgroundImage: `linear-gradient(${appColors.overlay}, ${appColors.overlay}), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
        backgroundAttachment: 'fixed',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AppointmentSummaryCard
          selectedDateLabel={format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          appointmentCount={appointmentsForSelectedDay.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewAppointment={handleOpenCreateForm}
          onToday={handleToday}
        />

        <Box
          sx={{
            backgroundColor: appColors.surface,
            borderRadius: '20px',
            border: `1px solid ${appColors.border}`,
            p: 2.5,
            boxShadow: '0 4px 12px rgba(201, 168, 76, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: appColors.accent,
                }}
              >
                {viewMode === 'month' ? 'Vista mensual' : viewMode === 'week' ? 'Vista semanal' : 'Vista diaria'}
              </Typography>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  color: appColors.textPrimary,
                }}
              >
                {viewMode === 'week'
                  ? `Semana de ${format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'd MMM', { locale: es })}`
                  : format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </Typography>
              {isLoadingAppointments && <CircularProgress size={14} sx={{ color: appColors.accent, mt: 0.5 }} />}
            </Box>
            {viewMode !== 'day' && (
              <Box
                component="button"
                onClick={handleOpenCreateForm}
                sx={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: appColors.accent,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Agendar
              </Box>
            )}
          </Box>

          {viewMode === 'month' && (
            <AppointmentCalendarGrid
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              appointmentDates={appointmentDates}
              onSelectDate={handleSelectDateFromMonth}
              onMonthChange={handleMonthChange}
            />
          )}

          {viewMode === 'week' && (
            <AppointmentWeekChips
              selectedDate={selectedDate}
              appointmentCountByDate={appointmentCountByDate}
              onSelectDate={setSelectedDate}
            />
          )}

          {viewMode === 'month' && (
            <Box sx={{ height: 1, backgroundColor: appColors.border, my: 2.5 }} />
          )}
          {viewMode === 'week' && (
            <Box sx={{ height: 1, backgroundColor: appColors.border, my: 2.5 }} />
          )}

          <AppointmentAgendaList
            appointments={appointmentsForSelectedDay}
            emptyMessage={emptyMessage}
            onSelectAppointment={handleSelectAppointment}
          />
        </Box>
      </Box>

      <AppointmentForm
        key={editingAppointment?.id ?? `new-${toKey(selectedDate)}`}
        open={formOpen}
        title={editingAppointment ? editingAppointment.clientName : 'Agendar cita'}
        appointment={editingAppointment}
        defaultDate={toKey(selectedDate)}
        onSubmit={handleFormSubmit}
        onMove={handleMove}
        onClose={handleCloseForm}
        isLoading={isLoadingAppointments}
      />
    </Box>
  );
};
