import { Client } from '@domain/entities/Client';
import { AppointmentPaymentMethod } from '@domain/entities/Appointment';

/** Datos del cliente con los que se abre el formulario de cita desde la lista de clientes. */
export interface AppointmentPrefill {
  clientName: string;
  phone: string;
  paymentMethod?: AppointmentPaymentMethod;
}

// Igual que mobile (mapClientPaymentMethod en ClientsScreen): 'None' no tiene equivalente en citas.
const mapClientPaymentMethod = (paymentMethod?: Client['paymentMethod']): AppointmentPaymentMethod | undefined => {
  switch (paymentMethod) {
    case 'Cash':
      return 'cash';
    case 'Sinpe Movil':
      return 'sinpeMovil';
    case 'Transfer':
      return 'transfer';
    default:
      return undefined;
  }
};

export const buildAppointmentPrefill = (client: Client): AppointmentPrefill => ({
  clientName: `${client.firstName} ${client.lastName}`.trim(),
  phone: client.phone,
  paymentMethod: mapClientPaymentMethod(client.paymentMethod),
});
