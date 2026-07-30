import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AppointmentForm,
  AppointmentList,
  AppointmentStats,
  AppointmentFilter,
  AppointmentCalendar,
} from '@presentation/components/appointments';
import { useAppointments } from '@presentation/hooks/useAppointments';
import { useNotification } from '@presentation/context/NotificationContext';
import { CreateAppointmentFormData } from '@shared/validation/appointmentSchemas';
import { Appointment } from '@domain/entities/Appointment';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointments-tabpanel-${index}`}
      aria-labelledby={`appointments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * AppointmentsPage: Página de gestión de citas
 *
 * Features:
 * - Vista de calendario/tabla
 * - Crear nuevas citas
 * - Editar citas existentes
 * - Eliminar citas
 * - Cambiar estado (completada/cancelada)
 * - Mover citas a otro horario
 * - Buscar y filtrar citas
 * - Estadísticas del día
 */
export const AppointmentsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [, setFilterDate] = useState('');
  const { showNotification } = useNotification();

  const {
    appointments,
    isLoadingAppointments,
    fetchAppointmentsByDate,
    searchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
  } = useAppointments();

  // TODO: Reemplazar con datos reales cuando se integre el backend
  const mockAppointments: Appointment[] = [];
  const displayAppointments = appointments.length > 0 ? appointments : mockAppointments;

  // Estadísticas
  const totalAppointments = displayAppointments.length;
  const scheduledAppointments = displayAppointments.filter(
    (apt) => apt.status === 'scheduled'
  ).length;
  const completedAppointments = displayAppointments.filter(
    (apt) => apt.status === 'completed'
  ).length;
  const totalIncome = displayAppointments.reduce(
    (sum, apt) => sum + (apt.servicePrice || 0),
    0
  );

  // Manejar creación/edición de citas
  const handleFormSubmit = async (data: CreateAppointmentFormData) => {
    try {
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id!, data);
        setEditingAppointment(null);
      } else {
        await createAppointment(data);
      }
      setFormOpen(false);
    } catch {
      // Error ya manejado por el hook
    }
  };

  const handleOpenForm = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
    } else {
      setEditingAppointment(null);
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAppointment(null);
  };

  const handleEdit = (appointment: Appointment) => {
    handleOpenForm(appointment);
  };

  const handleDelete = async (appointment: Appointment) => {
    if (window.confirm(`¿Eliminar cita de ${appointment.clientName}?`)) {
      try {
        await deleteAppointment(appointment.id!);
      } catch {
        // Error ya manejado
      }
    }
  };

  const handleComplete = async (appointment: Appointment) => {
    try {
      await updateAppointmentStatus(appointment.id!, 'completed');
    } catch {
      // Error ya manejado
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    if (window.confirm(`¿Cancelar cita de ${appointment.clientName}?`)) {
      try {
        await updateAppointmentStatus(appointment.id!, 'cancelled');
      } catch {
        // Error ya manejado
      }
    }
  };

  const handleMove = async (): Promise<void> => {
    // TODO: Implementar diálogo para seleccionar nueva fecha/hora
    showNotification('Funcionalidad en desarrollo', 'info');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchAppointments(query);
  };

  const handleFilterByStatus = (status: string | null) => {
    setFilterStatus(status);
  };

  const handleFilterByDate = (date: string) => {
    setFilterDate(date);
    if (date) {
      fetchAppointmentsByDate(date);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterStatus(null);
    setFilterDate('');
    // Cargar citas de hoy
    const today = new Date().toISOString().split('T')[0];
    fetchAppointmentsByDate(today);
  };

  // Filtrar citas según criterios
  const filteredAppointments = displayAppointments.filter((apt) => {
    const matchesSearch =
      !searchQuery ||
      apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery);

    const matchesStatus = !filterStatus || apt.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Citas
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gestiona tus citas y horarios
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <AppointmentStats
        totalAppointments={totalAppointments}
        scheduledAppointments={scheduledAppointments}
        completedAppointments={completedAppointments}
        totalIncome={totalIncome}
        isLoading={isLoadingAppointments}
        onNewAppointment={() => handleOpenForm()}
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="appointment views"
        >
          <Tab label="Tabla" id="appointments-tab-0" />
          <Tab label="Calendario" id="appointments-tab-1" />
        </Tabs>
      </Box>

      {/* Filter */}
      <AppointmentFilter
        onSearch={handleSearch}
        onFilterByStatus={handleFilterByStatus}
        onFilterByDate={handleFilterByDate}
        onReset={handleReset}
        isLoading={isLoadingAppointments}
      />

      {/* Content */}
      <Box sx={{ mt: 3 }}>
        {isLoadingAppointments && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoadingAppointments && filteredAppointments.length === 0 && (
          <Alert severity="info">No hay citas para mostrar</Alert>
        )}

        {!isLoadingAppointments && filteredAppointments.length > 0 && (
          <>
            <TabPanel value={tabValue} index={0}>
              {/* Tabla de citas */}
              <AppointmentList
                appointments={filteredAppointments}
                isLoading={isLoadingAppointments}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
                onCancel={handleCancel}
                onMove={handleMove}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Calendario de citas */}
              <AppointmentCalendar
                appointments={filteredAppointments}
                isLoading={isLoadingAppointments}
                onDateSelect={handleFilterByDate}
                onEventClick={handleEdit}
              />
            </TabPanel>
          </>
        )}
      </Box>

      {/* Form Dialog */}
      <AppointmentForm
        open={formOpen}
        title={editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
        appointment={editingAppointment}
        onSubmit={handleFormSubmit}
        onClose={handleCloseForm}
        isLoading={isLoadingAppointments}
      />
    </Container>
  );
};
