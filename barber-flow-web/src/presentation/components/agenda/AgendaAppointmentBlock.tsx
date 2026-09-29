import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { Appointment } from '@domain/entities/Appointment';
import { AGENDA } from '@shared/constants/agenda';
import { appColors } from '@presentation/theme/appColors';
import { APPOINTMENT_STATUS_COLORS } from '@presentation/theme/statusColors';

interface AgendaAppointmentBlockProps {
  appointment: Appointment;
  /** Distancia (px) desde el inicio de la grilla. */
  top: number;
  lane: number;
  laneCount: number;
  /** Solo Agendadas/Confirmadas se arrastran. */
  draggable: boolean;
  /** La cita se está moviendo en el backend (se muestra atenuada). */
  isPending?: boolean;
  /** true justo después de un arrastre, para no interpretar el "soltar" como un click. */
  isClickSuppressed: () => boolean;
  onClick: (appointment: Appointment) => void;
}

export const AgendaAppointmentBlock: React.FC<AgendaAppointmentBlockProps> = ({
  appointment,
  top,
  lane,
  laneCount,
  draggable,
  isPending = false,
  isClickSuppressed,
  onClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id ?? `${appointment.date}-${appointment.time}-${appointment.phone}`,
    disabled: !draggable,
  });

  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
  const isCancelled = appointment.status === 'cancelled';
  const isDone = appointment.status === 'completed';

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isClickSuppressed()) onClick(appointment);
      }}
      aria-label={`${appointment.clientName}, ${appointment.time}`}
      sx={{
        position: 'absolute',
        top: top + 2,
        height: AGENDA.SLOT_HEIGHT_PX - 4,
        left: `calc(${(lane / laneCount) * 100}% + 2px)`,
        width: `calc(${100 / laneCount}% - 4px)`,
        boxSizing: 'border-box',
        display: 'flex',
        overflow: 'hidden',
        borderRadius: '10px',
        border: `1px solid ${isDragging ? appColors.accent : `${statusColor}66`}`,
        backgroundColor: appColors.surfaceElevated,
        boxShadow: isDragging ? `0 8px 20px rgba(0,0,0,0.45), 0 0 0 1px ${appColors.accent}` : '0 2px 6px rgba(0,0,0,0.25)',
        opacity: isPending ? 0.6 : isCancelled || isDone ? 0.7 : 1,
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        // El arrastre en touch arranca con presión larga; mientras tanto el scroll vertical sigue funcionando.
        touchAction: 'manipulation',
        userSelect: 'none',
        pointerEvents: 'auto',
        zIndex: isDragging ? 20 : 1,
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? 'none' : 'opacity 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { borderColor: appColors.accent },
        '&:focus-visible': { outline: `2px solid ${appColors.accent}`, outlineOffset: 1 },
      }}
    >
      <Box sx={{ width: 4, flexShrink: 0, backgroundColor: statusColor }} />
      <Box sx={{ flex: 1, minWidth: 0, px: 1, py: 0.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 0.75 }}>
          <Typography
            noWrap
            sx={{
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.25,
              color: appColors.textPrimary,
              textDecoration: isCancelled ? 'line-through' : 'none',
              minWidth: 0,
            }}
          >
            {appointment.clientName}
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, color: appColors.accent, flexShrink: 0 }}>
            {appointment.time}
          </Typography>
        </Box>
        <Typography noWrap sx={{ fontSize: 12, lineHeight: 1.3, color: appColors.textSecondary }}>
          {appointment.serviceName || 'Sin servicio'}
        </Typography>
      </Box>
    </Box>
  );
};
