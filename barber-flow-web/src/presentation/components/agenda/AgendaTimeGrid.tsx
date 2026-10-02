import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { AGENDA, AgendaGrid, LEGACY_GRID } from '@shared/constants/agenda';
import {
  AgendaRange,
  formatHourLabel,
  getGridHeight,
  getSlotStarts,
  minutesToOffset,
  minutesToTime,
} from '@shared/utils/agendaLayout';
import { appColors } from '@presentation/theme/appColors';

interface AgendaSlotProps {
  startMinutes: number;
  grid: AgendaGrid;
  onSelect: (time: string) => void;
}

/** Un spot (30 min con la grilla de siempre, 15 con la de duraciones): clicable para agendar y destino válido para soltar una cita arrastrada. */
const AgendaSlot: React.FC<AgendaSlotProps> = ({ startMinutes, grid, onSelect }) => {
  const time = minutesToTime(startMinutes);
  const isHour = startMinutes % 60 === 0;
  const isHalfHour = startMinutes % 30 === 0;
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${time}` });

  // Hora: línea sólida. Media hora: rayada. Cuartos (solo con spots de 15 min): punteada y más tenue.
  const borderTop = isHour
    ? `1px solid ${appColors.border}`
    : isHalfHour
      ? `1px dashed ${appColors.border}`
      : `1px dotted ${appColors.border}80`;

  return (
    <Box sx={{ display: 'flex', height: grid.slotHeightPx, flexShrink: 0 }}>
      <Box sx={{ width: AGENDA.GUTTER_PX, flexShrink: 0, position: 'relative' }}>
        {isHour && (
          <Typography
            sx={{
              position: 'absolute',
              top: -8,
              right: 10,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: '16px',
              color: appColors.textSecondary,
              whiteSpace: 'nowrap',
            }}
          >
            {formatHourLabel(startMinutes)}
          </Typography>
        )}
      </Box>
      <Box
        ref={setNodeRef}
        role="button"
        tabIndex={0}
        aria-label={`Agendar cita a las ${time}`}
        onClick={() => onSelect(time)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(time);
          }
        }}
        sx={{
          flex: 1,
          cursor: 'pointer',
          borderTop,
          backgroundColor: isOver ? `${appColors.accent}2E` : 'transparent',
          boxShadow: isOver ? `inset 0 0 0 1px ${appColors.accent}` : 'none',
          transition: 'background-color 0.12s ease',
          '&:hover': { backgroundColor: isOver ? `${appColors.accent}2E` : `${appColors.accent}12` },
          '&:focus-visible': { outline: `2px solid ${appColors.accent}`, outlineOffset: -2 },
        }}
      />
    </Box>
  );
};

interface AgendaTimeGridProps {
  range: AgendaRange;
  /** Minutos desde medianoche de "ahora" si el día mostrado es hoy; null en otro caso. */
  nowMinutes: number | null;
  onSelectSlot: (time: string) => void;
  /** Grilla de spots; por defecto la de siempre (30 min). */
  grid?: AgendaGrid;
  /** Bloques de cita (absolutos sobre la grilla). */
  children?: React.ReactNode;
}

export const AgendaTimeGrid: React.FC<AgendaTimeGridProps> = ({
  range,
  nowMinutes,
  onSelectSlot,
  grid = LEGACY_GRID,
  children,
}) => {
  const slots = getSlotStarts(range, grid);
  const showNow = nowMinutes !== null && nowMinutes >= range.startMinutes && nowMinutes <= range.endMinutes;

  return (
    // pt: deja espacio para que la etiqueta de la primera hora no quede cortada.
    <Box sx={{ position: 'relative', pt: '10px', pb: '76px' }}>
      <Box sx={{ position: 'relative', height: getGridHeight(range, grid) }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {slots.map((start) => (
            <AgendaSlot key={start} startMinutes={start} grid={grid} onSelect={onSelectSlot} />
          ))}
        </Box>

        {/* Capa de bloques: no intercepta clicks salvo en los propios bloques. */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: AGENDA.GUTTER_PX + 6,
            right: 6,
            pointerEvents: 'none',
          }}
        >
          {children}
        </Box>

        {showNow && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: AGENDA.GUTTER_PX - 5,
              right: 0,
              top: minutesToOffset(nowMinutes, range, grid),
              height: 2,
              backgroundColor: appColors.accentLight,
              pointerEvents: 'none',
              zIndex: 5,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -3,
                top: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: appColors.accentLight,
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};
