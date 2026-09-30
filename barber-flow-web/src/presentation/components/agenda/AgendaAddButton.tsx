import React from 'react';
import { Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { appColors } from '@presentation/theme/appColors';

interface AgendaAddButtonProps {
  /** Ej.: "Añadir el 29 sept". */
  label: string;
  onClick: () => void;
}

/** Pill dorada de la agenda (mismo estilo del botón "Nueva cita"); quien la usa decide dónde flota. */
export const AgendaAddButton: React.FC<AgendaAddButtonProps> = ({ label, onClick }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      px: 2.5,
      height: 46,
      border: 'none',
      cursor: 'pointer',
      borderRadius: '999px',
      backgroundColor: appColors.accent,
      color: appColors.onAccent,
      fontFamily: 'inherit',
      fontSize: 14,
      fontWeight: 800,
      letterSpacing: '0.3px',
      whiteSpace: 'nowrap',
      boxShadow: `0 4px 12px ${appColors.accent}59`,
      '&:hover': { backgroundColor: appColors.accentLight },
      '&:focus-visible': { outline: `2px solid ${appColors.textPrimary}`, outlineOffset: 2 },
    }}
  >
    {label}
    <AddIcon sx={{ fontSize: 20 }} />
  </Box>
);
