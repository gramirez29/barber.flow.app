import React from 'react';
import { Box } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment } from '@domain/entities/Appointment';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  isLoading: boolean;
  onDateSelect?: (dateStr: string) => void;
  onEventClick?: (appointment: Appointment) => void;
}

/**
 * AppointmentCalendar: Componente de calendario para citas
 *
 * Features:
 * - Vista mensual/semanal de citas
 * - Clicks en fechas para filtrar
 * - Clicks en eventos para editar
 * - Color coding por estado
 */
export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  isLoading,
  onDateSelect,
  onEventClick,
}) => {
  // Convertir citas a eventos de FullCalendar
  const events = appointments.map((apt) => ({
    id: apt.id,
    title: apt.clientName,
    start: `${apt.date}T${apt.time}`,
    extendedProps: {
      clientName: apt.clientName,
      phone: apt.phone,
      serviceName: apt.serviceName,
      servicePrice: apt.servicePrice,
      status: apt.status,
      notes: apt.notes,
    },
    backgroundColor:
      apt.status === 'completed'
        ? '#10B981' // Verde (Success - matches mobile)
        : apt.status === 'cancelled'
          ? '#EF4444' // Rojo (Error - matches mobile)
          : '#3B82F6', // Azul (Info - scheduled, matches mobile)
    borderColor:
      apt.status === 'completed'
        ? '#059669'
        : apt.status === 'cancelled'
          ? '#DC2626'
          : '#1976D2',
  }));

  const handleSelect = (selectInfo: any) => {
    if (onDateSelect) {
      const dateStr = selectInfo.dateStr;
      onDateSelect(dateStr);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    if (onEventClick) {
      const appointment = appointments.find((apt) => apt.id === clickInfo.event.id);
      if (appointment) {
        onEventClick(appointment);
      }
    }
  };

  return (
    <Box
      sx={{
        opacity: isLoading ? 0.6 : 1,
        pointerEvents: isLoading ? 'none' : 'auto',
        '& .fc': {
          fontFamily: 'inherit',
        },
        '& .fc .fc-button-primary': {
          backgroundColor: '#C9A84C',
          borderColor: '#C9A84C',
          textTransform: 'capitalize',
          color: '#0D0D0D',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#E5C878',
            borderColor: '#E5C878',
          },
          '&.fc-button-active': {
            backgroundColor: '#A68637',
            borderColor: '#A68637',
          },
        },
        '& .fc .fc-col-header-cell': {
          padding: '12px 0',
          fontWeight: 600,
        },
        '& .fc .fc-daygrid-day': {
          minHeight: '80px',
        },
        '& .fc .fc-event': {
          cursor: 'pointer',
          padding: '2px',
          fontSize: '0.75rem',
          '&:hover': {
            opacity: 0.8,
          },
        },
      }}
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        select={handleSelect}
        selectConstraint="businessHours"
        eventClick={handleEventClick}
        editable={false}
        eventDisplay="block"
        height="auto"
        contentHeight="auto"
        locale="es"
      />
    </Box>
  );
};
