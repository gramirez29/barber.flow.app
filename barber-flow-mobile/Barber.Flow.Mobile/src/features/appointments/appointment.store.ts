import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Appointment, AppointmentDraft } from "./appointments.types";
import {
	appointmentService,
	type AppointmentSearchParams,
} from "../../services/appointmentService";

interface AppointmentState {
	appointments: Appointment[];
	isLoading: boolean;
	fetchAppointments: (params?: AppointmentSearchParams) => Promise<void>;
	addAppointment: (appointment: AppointmentDraft) => Promise<Appointment>;
	getCompletedAppointmentsByDate: (date: string) => Appointment[];
	moveAppointment: (id: string, newDate: string) => Promise<void>;
	updateAppointment: (id: string, appointment: AppointmentDraft) => Promise<void>;
	removeAppointment: (id: string) => Promise<void>;
	getAppointmentsByDate: (date: string) => Appointment[];
}

const sortAppointments = (appointments: Appointment[]) =>
	[...appointments].sort((left, right) => {
		if (left.date === right.date) {
			return left.time.localeCompare(right.time);
		}

		return left.date.localeCompare(right.date);
	});

export const useAppointmentStore = create<AppointmentState>()(
	persist(
		(set, get) => ({
			appointments: [],
			isLoading: false,

			fetchAppointments: async (params) => {
				set({ isLoading: true });
				try {
					const appointments = await appointmentService.find(params);
					set({ appointments: sortAppointments(appointments) });
				} finally {
					set({ isLoading: false });
				}
			},

			addAppointment: async (draft) => {
				const created = await appointmentService.create(draft);
				set((state) => ({
					appointments: sortAppointments([...state.appointments, created]),
				}));
				return created;
			},

			moveAppointment: async (id, newDate) => {
				const updated = await appointmentService.move(id, newDate);
				set((state) => ({
					appointments: sortAppointments(
						state.appointments.map((appointment) =>
							appointment.id === id ? updated : appointment,
						),
					),
				}));
			},

			updateAppointment: async (id, draft) => {
				const updated = await appointmentService.update(id, draft);
				set((state) => ({
					appointments: sortAppointments(
						state.appointments.map((appointment) =>
							appointment.id === id ? updated : appointment,
						),
					),
				}));
			},

			removeAppointment: async (id) => {
				await appointmentService.remove(id);
				set((state) => ({
					appointments: state.appointments.filter(
						(appointment) => appointment.id !== id,
					),
				}));
			},

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
