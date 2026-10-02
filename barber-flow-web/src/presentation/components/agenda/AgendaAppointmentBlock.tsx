import React, { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { Appointment } from '@domain/entities/Appointment';
import { AgendaGrid, LEGACY_GRID } from '@shared/constants/agenda';
import {
  ResizeHandle,
  ResizeResult,
  durationToHeight,
  formatTimeRange,
  getAppointmentDuration,
  timeToMinutes,
} from '@shared/utils/agendaLayout';
import { appColors } from '@presentation/theme/appColors';
import { APPOINTMENT_STATUS_COLORS } from '@presentation/theme/statusColors';

/** Por debajo de este alto (px) el bloque muestra una sola línea (cliente + hora) y oculta el servicio. */
const COMPACT_HEIGHT_PX = 52;
/** Área táctil de cada punto de redimensionar (el punto visible es más chico). */
const HANDLE_HIT_PX = 36;
const HANDLE_DOT_PX = 12;
/** Franja de borde (escritorio) donde el cursor cambia a ↕ para redimensionar con el mouse. */
const EDGE_ZONE_PX = 10;
/** Cuánto sobresale del bloque el indicador ↕ del borde (la mitad de su alto). */
const GRIP_OVERHANG_PX = 8;
/** Solo punteros con hover real (mouse/trackpad): en pantallas táctiles :hover se queda "pegado" tras tocar. */
const HOVER_FINE = "@media (hover: hover) and (pointer: fine)";

interface AgendaAppointmentBlockProps {
  appointment: Appointment;
  /** Distancia (px) desde el inicio de la grilla. */
  top: number;
  lane: number;
  laneCount: number;
  /** Grilla en uso (alto de un spot, duración que ocupa cada cita). */
  grid?: AgendaGrid;
  /** Solo Agendadas/Confirmadas se arrastran. */
  draggable: boolean;
  /** Se puede redimensionar (ajuste del barbero encendido + Agendada/Confirmada). */
  resizable?: boolean;
  /** Seleccionada (presión larga en touch): muestra los puntos de redimensionar. */
  selected?: boolean;
  /** La cita se está moviendo/redimensionando en el backend (se muestra atenuada). */
  isPending?: boolean;
  /** true justo después de un arrastre, para no interpretar el "soltar" como un click. */
  isClickSuppressed: () => boolean;
  onClick: (appointment: Appointment) => void;
  /** Resultado (inicio + duración) de arrastrar un punto `deltaPx` píxeles, ya limitado a las vecinas. */
  computeResize?: (appointment: Appointment, handle: ResizeHandle, deltaPx: number) => ResizeResult;
  onResizeCommit?: (appointment: Appointment, result: ResizeResult) => void;
  /** Avisa cuando empieza/termina un redimensionado (para suprimir el click que sigue al soltar). */
  onResizeActiveChange?: (active: boolean) => void;
}

export const AgendaAppointmentBlock: React.FC<AgendaAppointmentBlockProps> = ({
  appointment,
  top,
  lane,
  laneCount,
  grid = LEGACY_GRID,
  draggable,
  resizable = false,
  selected = false,
  isPending = false,
  isClickSuppressed,
  onClick,
  computeResize,
  onResizeCommit,
  onResizeActiveChange,
}) => {
  const blockId = appointment.id ?? `${appointment.date}-${appointment.time}-${appointment.phone}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: blockId,
    disabled: !draggable,
  });

  const startMinutes = timeToMinutes(appointment.time);
  const durationMinutes = getAppointmentDuration(appointment, grid);

  // Redimensionando: la vista previa (inicio + duración) viene de computeResize mientras se arrastra el punto.
  const [resizing, setResizing] = useState<{ handle: ResizeHandle; result: ResizeResult } | null>(null);
  const resizeStartY = useRef(0);
  const latestResult = useRef<ResizeResult | null>(null);

  const shown = resizing?.result ?? { startMinutes, durationMinutes };
  const shownTop = top + ((shown.startMinutes - startMinutes) / grid.slotMinutes) * grid.slotHeightPx;
  const shownHeight = durationToHeight(shown.durationMinutes, grid) - 4;
  const isCompact = shownHeight < COMPACT_HEIGHT_PX;

  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
  const isCancelled = appointment.status === 'cancelled';
  const isDone = appointment.status === 'completed';
  const canResize = resizable && Boolean(computeResize) && Boolean(onResizeCommit);

  const finishResize = (commit: boolean) => {
    const result = latestResult.current;
    latestResult.current = null;
    setResizing(null);
    onResizeActiveChange?.(false);
    if (commit && result && (result.startMinutes !== startMinutes || result.durationMinutes !== durationMinutes)) {
      onResizeCommit?.(appointment, result);
    }
  };

  // Eventos de puntero con captura: funcionan igual con mouse y con touch, y el punto sigue recibiendo
  // el movimiento aunque el cursor/dedo salga del bloque. stopPropagation evita que dnd-kit lo tome por un arrastre.
  const handleProps = (handle: ResizeHandle) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      event.stopPropagation();
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Sin captura (p. ej. puntero ya liberado) el arrastre sigue funcionando mientras el cursor esté sobre el punto.
      }
      resizeStartY.current = event.clientY;
      latestResult.current = { startMinutes, durationMinutes };
      setResizing({ handle, result: latestResult.current });
      onResizeActiveChange?.(true);
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!latestResult.current || !computeResize) return;
      const result = computeResize(appointment, handle, event.clientY - resizeStartY.current);
      latestResult.current = result;
      setResizing({ handle, result });
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      finishResize(true);
    },
    onPointerCancel: () => finishResize(false),
    onMouseDown: (event: React.MouseEvent) => event.stopPropagation(),
    onTouchStart: (event: React.TouchEvent) => event.stopPropagation(),
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
  });

  const edgeSx = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: EDGE_ZONE_PX,
    cursor: 'ns-resize',
    touchAction: 'none' as const,
    zIndex: 2,
    [HOVER_FINE]: {
      '&:hover': { backgroundColor: `${appColors.accent}55` },
      '&:hover .agenda-grip': { opacity: 1, transform: 'translateX(-50%) scale(1.08)' },
    },
  };

  // Indicador visible (escritorio): una pastilla con flechas ↕ a caballo sobre el borde, que aparece al pasar
  // el mouse por el bloque y se resalta al acercarse al borde. Sin él el borde sería invisible.
  const gripSx = (edge: 'top' | 'bottom') => ({
    position: 'absolute' as const,
    left: '50%',
    [edge]: -GRIP_OVERHANG_PX,
    transform: 'translateX(-50%)',
    width: 30,
    height: 16,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.accent,
    color: appColors.onAccent,
    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
    opacity: 0,
    pointerEvents: 'none' as const,
    transition: 'opacity 0.12s ease, transform 0.12s ease',
  });

  const dotWrapSx = {
    position: 'absolute' as const,
    width: HANDLE_HIT_PX,
    height: HANDLE_HIT_PX,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'ns-resize',
    touchAction: 'none' as const,
    zIndex: 3,
  };

  const dotSx = {
    width: HANDLE_DOT_PX,
    height: HANDLE_DOT_PX,
    borderRadius: '50%',
    backgroundColor: appColors.accent,
    border: `2px solid ${appColors.background}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
  };

  const showDots = canResize && (selected || resizing !== null) && !isDragging;

  return (
    <Box
      ref={setNodeRef}
      data-agenda-block-id={blockId}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isClickSuppressed()) onClick(appointment);
      }}
      aria-label={`${appointment.clientName}, ${appointment.time}`}
      sx={{
        position: 'absolute',
        top: shownTop + 2,
        height: shownHeight,
        left: `calc(${(lane / laneCount) * 100}% + 2px)`,
        width: `calc(${100 / laneCount}% - 4px)`,
        boxSizing: 'border-box',
        opacity: isPending ? 0.6 : isCancelled || isDone ? 0.7 : 1,
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        // El arrastre en touch arranca con presión larga; mientras tanto el scroll vertical sigue funcionando.
        touchAction: 'manipulation',
        userSelect: 'none',
        pointerEvents: "auto",
        zIndex: isDragging ? 20 : selected || resizing ? 15 : 1,
        // Al pasar el mouse el bloque se eleva sobre sus vecinas y muestra los indicadores ↕ de los bordes.
        [HOVER_FINE]: {
          "&:hover": { zIndex: isDragging ? 20 : 14 },
          "&:hover .agenda-grip": { opacity: 0.85 },
        },
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition: isDragging || resizing ? 'none' : 'opacity 0.15s ease, box-shadow 0.15s ease',
        '&:focus-visible': { outline: `2px solid ${appColors.accent}`, outlineOffset: 1 },
      }}
    >
      {/* Contenido: lleva el borde redondeado y recorta el texto; los puntos van fuera para poder sobresalir. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          overflow: 'hidden',
          borderRadius: '10px',
          border: `1px solid ${isDragging || selected || resizing ? appColors.accent : `${statusColor}66`}`,
          backgroundColor: appColors.surfaceElevated,
          boxShadow:
            isDragging || resizing
              ? `0 8px 20px rgba(0,0,0,0.45), 0 0 0 1px ${appColors.accent}`
              : selected
                ? `0 0 0 1px ${appColors.accent}`
                : '0 2px 6px rgba(0,0,0,0.25)',
          [HOVER_FINE]: { '&:hover': { borderColor: appColors.accent } },
        }}
      >
        <Box sx={{ width: 4, flexShrink: 0, backgroundColor: statusColor }} />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: 1,
            py: isCompact ? 0 : 0.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
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
              {resizing ? formatTimeRange(shown.startMinutes, shown.durationMinutes) : appointment.time}
            </Typography>
          </Box>
          {!isCompact && (
            <Typography noWrap sx={{ fontSize: 12, lineHeight: 1.3, color: appColors.textSecondary }}>
              {appointment.serviceName || 'Sin servicio'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Escritorio: el cursor cambia a ↕ en el borde superior/inferior para redimensionar con el mouse. */}
      {canResize && !isDragging && (
        <>
          <Box aria-hidden title="Arrastra para cambiar la hora de inicio" {...handleProps('top')} sx={{ ...edgeSx, top: 0 }}>
            <Box className="agenda-grip" sx={gripSx('top')}>
              <UnfoldMoreIcon sx={{ fontSize: 14 }} />
            </Box>
          </Box>
          <Box aria-hidden title="Arrastra para cambiar la hora de fin" {...handleProps('bottom')} sx={{ ...edgeSx, bottom: 0 }}>
            <Box className="agenda-grip" sx={gripSx('bottom')}>
              <UnfoldMoreIcon sx={{ fontSize: 14 }} />
            </Box>
          </Box>
        </>
      )}

      {/* Touch (presión larga): puntos como en Google Calendar; el de arriba a la derecha, el de abajo a la izquierda. */}
      {showDots && (
        <>
          <Box
            role="button"
            aria-label="Cambiar la hora de inicio"
            {...handleProps('top')}
            sx={{ ...dotWrapSx, top: -HANDLE_HIT_PX / 2, right: 12 }}
          >
            <Box sx={dotSx} />
          </Box>
          <Box
            role="button"
            aria-label="Cambiar la hora de fin"
            {...handleProps('bottom')}
            sx={{ ...dotWrapSx, bottom: -HANDLE_HIT_PX / 2, left: 12 }}
          >
            <Box sx={dotSx} />
          </Box>
        </>
      )}
    </Box>
  );
};
