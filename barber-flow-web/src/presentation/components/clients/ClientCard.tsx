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
  isFirst?: boolean;
  isLast?: boolean;
}

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'CL';
};

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, onDelete, isFirst, isLast }) => {
  const navigate = useNavigate();
  const fullName = `${client.firstName} ${client.lastName}`.trim();

  return (
    <Box
      onClick={() => onClick?.(client)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: appColors.surface,
        borderLeft: `1px solid ${appColors.border}`,
        borderRight: `1px solid ${appColors.border}`,
        borderTop: isFirst ? `1px solid ${appColors.border}` : 'none',
        borderBottom: isLast ? `1px solid ${appColors.border}` : 'none',
        position: 'relative',
        // Divisor con margen izquierdo (padding 16 + avatar 46 + gap 16), igual que mobile
        '&::after': isLast
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              left: 78,
              right: 0,
              bottom: 0,
              height: '1px',
              backgroundColor: appColors.border,
            },
        borderTopLeftRadius: isFirst ? '16px' : 0,
        borderTopRightRadius: isFirst ? '16px' : 0,
        borderBottomLeftRadius: isLast ? '16px' : 0,
        borderBottomRightRadius: isLast ? '16px' : 0,
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        '&:hover': onClick ? { backgroundColor: 'rgba(255, 255, 255, 0.04)' } : undefined,
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
          {client.email || 'Sin correo registrado'}
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
