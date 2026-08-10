import React from 'react';
import { Box, Typography } from '@mui/material';
import { Appointment } from '@domain/entities/Appointment';
import { appColors } from '@presentation/theme/appColors';
import { AppointmentCard } from './AppointmentCard';

interface AppointmentAgendaListProps {
  appointments: Appointment[];
  emptyMessage: string;
  onSelectAppointment: (appointment: Appointment) => void;
}

export const AppointmentAgendaList: React.FC<AppointmentAgendaListProps> = ({
  appointments,
  emptyMessage,
  onSelectAppointment,
}) => {
  if (appointments.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          borderRadius: '16px',
          border: `1px solid ${appColors.border}`,
          backgroundColor: appColors.surfaceElevated,
          mt: 2,
          px: 2.5,
          py: 3.5,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: appColors.textPrimary, mb: 0.5 }}>
          Sin citas
        </Typography>
        <Typography sx={{ fontSize: 14, color: appColors.textSecondary }}>{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} onClick={onSelectAppointment} />
      ))}
    </Box>
  );
};
