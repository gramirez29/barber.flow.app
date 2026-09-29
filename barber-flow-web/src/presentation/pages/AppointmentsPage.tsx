import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useBarbers } from '@presentation/hooks/useBarbers';
import { useAuth } from '@presentation/context/AuthContext';
import { CreateAppointmentFormData } from '@shared/validation/appointmentSchemas';
import { Appointment, RecurrenceFrequency } from '@domain/entities/Appointment';
import { appColors } from '@presentation/theme/appColors';
import type { AppointmentPrefill } from '@shared/utils/appointmentPrefill';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

type ViewMode = CalendarViewMode;

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const AppointmentsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [prefill, setPrefill] = useState<AppointmentPrefill | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Llegar desde el ícono de cita de la lista de clientes abre el formulario de cita nueva ya
  // precargado con el cliente, en el día de hoy (mismo comportamiento que mobile).
  useEffect(() => {
    const incoming = (location.state as { prefill?: AppointmentPrefill } | null)?.prefill;
    if (!incoming) return;
    setPrefill(incoming);
    setEditingAppointment(null);
    setSelectedDate(new Date());
    setVisibleMonth(new Date());
    setViewMode('day');
    setFormOpen(true);
    // Limpia el state para que un refresh o "atrás" no reabra el formulario.
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const {
    appointments,
    isLoadingAppointments,
    isSavingAppointment,
    fetchAppointmentsByDate,
    fetchAppointmentsByDateRange,
    createAppointment,
    createRecurringAppointments,
    updateAppointment,
    moveAppointment,
  } = useAppointments();
  const { user } = useAuth();
  const { getBarberByUserName } = useBarbers();
  // Cantidad de citas por serie recurrente, definida por el admin en el barbero (0 = deshabilitado).
  const [maxRecurringAppointments, setMaxRecurringAppointments] = useState(0);

  // Se relee al abrir el formulario para reflejar cambios recientes del admin.
  useEffect(() => {
    if (!formOpen || !user?.userName) return;
    let active = true;
    void getBarberByUserName(user.userName).then((barber) => {
      if (active) setMaxRecurringAppointments(barber?.settings?.maxRecurringAppointments ?? 0);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, user?.userName]);

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
    setPrefill(null);
    setFormOpen(true);
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAppointment(null);
    setPrefill(null);
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

  const handleRecurringSubmit = async (data: CreateAppointmentFormData, frequency: RecurrenceFrequency) => {
    const { price, paymentMethod, ...rest } = data;
    await createRecurringAppointments(
      { ...rest, servicePrice: price, paymentMethodUsed: paymentMethod },
      frequency
    );
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
        key={editingAppointment?.id ?? `new-${toKey(selectedDate)}-${prefill?.phone ?? ''}`}
        open={formOpen}
        title={editingAppointment ? editingAppointment.clientName : 'Agendar cita'}
        appointment={editingAppointment}
        defaultDate={toKey(selectedDate)}
        prefill={prefill}
        onSubmit={handleFormSubmit}
        onMove={handleMove}
        maxRecurringAppointments={maxRecurringAppointments}
        onSubmitRecurring={handleRecurringSubmit}
        onClose={handleCloseForm}
        isLoading={isSavingAppointment}
      />
    </Box>
  );
};
