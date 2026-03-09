import { create } from "zustand";
import { Appointment } from "./appointments.types";

interface AppointmentState {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  moveAppointment: (id: string, newDate: string) => void;
  updateAppointment: (appointment: Appointment) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],

  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),

  moveAppointment: (id, newDate) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, date: newDate } : a,
      ),
    })),

  updateAppointment: (appointment) =>
    set((state) => ({
      appointments: state.appointments.map((a) => 
        a.id === appointment.id ? appointment : a
      ),
    })),
}));
