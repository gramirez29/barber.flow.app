import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Appointment, AppointmentDraft } from "./appointments.types";
import {
	appointmentService,
	type AppointmentSearchParams,
} from "../../services/appointmentService";
import { SessionExpiredError } from "../../services/apis/apiClient";

interface AppointmentState {
	appointments: Appointment[];
	isLoading: boolean;
	error: string | null;
	fetchAppointments: (params?: AppointmentSearchParams) => Promise<void>;
	fetchAppointmentsByDateRange: (startDate: string, endDate: string, status?: string) => Promise<void>;
	clearError: () => void;
	addAppointment: (appointment: AppointmentDraft) => Promise<Appointment>;
	getCompletedAppointmentsByDate: (date: string) => Appointment[];
	moveAppointment: (id: string, newDate: string) => Promise<void>;
	updateAppointment: (id: string, appointment: AppointmentDraft) => Promise<void>;
	removeAppointment: (id: string) => Promise<void>;
	getAppointmentsByDate: (date: string) => Appointment[];
}

interface PersistedAppointmentState {
	appointments: Appointment[];
}

const isValidAppointment = (value: unknown): value is Appointment =>
	typeof value === "object" &&
	value !== null &&
	typeof (value as Appointment).id === "string" &&
	typeof (value as Appointment).date === "string" &&
	typeof (value as Appointment).time === "string";

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
			error: null,

			clearError: () => set({ error: null }),

			fetchAppointments: async (params) => {
				set({ isLoading: true });
				try {
					const appointments = await appointmentService.find(params);
					set({ appointments: sortAppointments(appointments) });
				} finally {
					set({ isLoading: false });
				}
			},

			fetchAppointmentsByDateRange: async (startDate, endDate, status?) => {
				set({ isLoading: true });
				try {
					const fetched = await appointmentService.find({ date: startDate, endDate, status });
					const outside = get().appointments.filter(
						(a) => a.date < startDate || a.date > endDate,
					);
					if (status) {
						// Keep in-range appointments that don't match the filtered status
						const inRangeOtherStatus = get().appointments.filter(
							(a) => a.date >= startDate && a.date <= endDate && a.status !== status,
						);
						set({ appointments: sortAppointments([...outside, ...inRangeOtherStatus, ...fetched]) });
					} else {
						set({ appointments: sortAppointments([...outside, ...fetched]) });
					}
				} catch (error) {
					// Session-expired is already surfaced via the global dialog in apiClient;
					// re-showing it as a generic fetch error here would be a duplicate/noisy popup.
					if (error instanceof SessionExpiredError) {
						return;
					}

					console.error("[AppointmentStore] fetchAppointmentsByDateRange failed:", error);
					set({ error: error instanceof Error ? error.message : "Failed to load appointments" });
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
			version: 1,
			migrate: (persistedState) => {
				const state = persistedState as Partial<PersistedAppointmentState> | undefined;
				const appointments = Array.isArray(state?.appointments)
					? state.appointments.filter(isValidAppointment)
					: [];

				return { appointments } as AppointmentState;
			},
			partialize: (state) => ({
				appointments: state.appointments,
			}),
		},
	),
);
