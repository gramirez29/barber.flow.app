import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Appointment, AppointmentDraft } from "./appointments.types";

interface AppointmentState {
	appointments: Appointment[];
	addAppointment: (appointment: AppointmentDraft) => Appointment;
	getCompletedAppointmentsByDate: (date: string) => Appointment[];
	moveAppointment: (id: string, newDate: string) => void;
	updateAppointment: (id: string, appointment: AppointmentDraft) => void;
	removeAppointment: (id: string) => void;
	getAppointmentsByDate: (date: string) => Appointment[];
}

const sortAppointments = (appointments: Appointment[]) =>
	[...appointments].sort((left, right) => {
		if (left.date === right.date) {
		return left.time.localeCompare(right.time);
		}

		return left.date.localeCompare(right.date);
	});

const createAppointmentId = () =>
	`appointment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useAppointmentStore = create<AppointmentState>()(
	persist(
		(set, get) => ({
		appointments: [],

		addAppointment: (appointment) => {
			const nextAppointment: Appointment = {
			...appointment,
			id: createAppointmentId(),
			status: appointment.status ?? "scheduled",
			};

			set((state) => ({
			appointments: sortAppointments([...state.appointments, nextAppointment]),
			}));

			return nextAppointment;
		},

		moveAppointment: (id, newDate) =>
			set((state) => ({
			appointments: sortAppointments(
				state.appointments.map((appointment) =>
				appointment.id === id ? { ...appointment, date: newDate } : appointment,
				),
			),
			})),

		updateAppointment: (id, appointment) =>
			set((state) => ({
			appointments: sortAppointments(
				state.appointments.map((currentAppointment) =>
				currentAppointment.id === id
					? {
						...currentAppointment,
						...appointment,
						status: appointment.status ?? currentAppointment.status,
					}
					: currentAppointment,
				),
			),
			})),

		removeAppointment: (id) =>
			set((state) => ({
			appointments: state.appointments.filter(
				(appointment) => appointment.id !== id,
			),
			})),

		getAppointmentsByDate: (date) =>
			get().appointments.filter((appointment) => appointment.date === date),

		getCompletedAppointmentsByDate: (date) =>
			get().appointments.filter(
			(appointment) =>
				appointment.date === date && appointment.status === "completed",
			),
		}),
		{
		name: "barber-flow-appointments",
		storage: createJSONStorage(() => AsyncStorage),
		partialize: (state) => ({
			appointments: state.appointments,
		}),
		},
	),
);
