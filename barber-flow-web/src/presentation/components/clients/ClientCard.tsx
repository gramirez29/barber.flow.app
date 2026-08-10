import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { Client } from '@domain/entities/Client';
import { appColors } from '@presentation/theme/appColors';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'CL';
};

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, onDelete }) => {
  const navigate = useNavigate();
  const fullName = `${client.firstName} ${client.lastName}`.trim();

  return (
    <Box
      onClick={() => onClick?.(client)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: '16px',
        border: `1px solid ${appColors.border}`,
        backgroundColor: appColors.surfaceElevated,
        px: 2,
        py: 1.5,
        mb: 1.25,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'opacity 0.15s ease',
        '&:hover': onClick ? { opacity: 0.85 } : undefined,
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          flexShrink: 0,
          borderRadius: '50%',
          border: `2px solid ${appColors.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: appColors.background,
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: appColors.accent }}>
          {getInitials(client.firstName, client.lastName)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary, letterSpacing: '0.15px' }}
        >
          {fullName}
        </Typography>
        <Typography noWrap sx={{ fontSize: 13, color: appColors.textSecondary }}>
          {client.phone}
        </Typography>
        <Typography noWrap sx={{ fontSize: 12, color: appColors.textSecondary, opacity: 0.75 }}>
          {client.email || 'Sin email'}
        </Typography>
      </Box>

      <IconButton
        aria-label={`Agendar cita para ${fullName}`}
        onClick={(e) => {
          e.stopPropagation();
          navigate('/appointments');
        }}
        sx={{ color: appColors.accent }}
      >
        <CalendarMonthOutlinedIcon fontSize="small" />
      </IconButton>

      {onDelete && (
        <IconButton
          aria-label={`Eliminar a ${fullName}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(client);
          }}
          sx={{ color: appColors.textSecondary, '&:hover': { color: appColors.error } }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};
