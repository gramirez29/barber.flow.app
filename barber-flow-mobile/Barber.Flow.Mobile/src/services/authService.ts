import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApplicationUser } from "../types/applicationUser";
import { BASE_URL } from "../config";
import { apiFetch } from "./apis/apiClient";

// Business-data caches keyed by the previous session - cleared on logout/account deletion so the
// next person to use this device doesn't inherit the previous user's appointments/notifications/settings.
const CACHED_DATA_KEYS = [
	"barber-flow-appointments",
	"barber-flow-notifications",
	"barber-flow-settings-preferences",
];

const clearCachedData = async () => {
	await AsyncStorage.multiRemove(CACHED_DATA_KEYS);
};

// Revisar la funcionalidad del calendario para verficar que todo esté funcionando correctamente, 
// especialmente en lo que respecta a la gestión de citas y la visualización de las mismas. Además,
// es importante revisar la integración con el backend para asegurarse de que las operaciones de autenticación 
// y manejo de usuarios estén funcionando sin problemas. 

export const authService = {
	login: async (
		userName: string,
		password: string,
	): Promise<ApplicationUser> => {
		const url = `${BASE_URL}/api/users/authentication/`;
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userName, password }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => null);
			throw new Error(body?.message ?? "Login failed");
		}

		const data: ApplicationUser = await res.json();
		await SecureStore.setItemAsync("applicationUser", JSON.stringify(data));
		return data;
	},
	getStoredUser: async (): Promise<ApplicationUser | null> => {
		const json = await SecureStore.getItemAsync("applicationUser");
		return json ? JSON.parse(json) : null;
	},
	clearStoredUser: async () => {
		await SecureStore.deleteItemAsync("applicationUser");
		await clearCachedData();
	},
	deleteSelf: async (): Promise<void> => {
		await apiFetch("/api/users/me", { method: "DELETE" });
		await SecureStore.deleteItemAsync("applicationUser");
		await clearCachedData();
	},

	requestPasswordReset: async (email: string): Promise<void> => {
		const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});
		if (!res.ok) throw new Error("Failed to request password reset");
	},

	verifyOtp: async (email: string, otpCode: string): Promise<void> => {
		const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, otpCode }),
		});
		if (!res.ok) throw new Error("Invalid or expired OTP");
	},

	resetPassword: async (email: string, otpCode: string, newPassword: string): Promise<void> => {
		const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, otpCode, newPassword }),
		});
		if (!res.ok) throw new Error("Failed to reset password");
	},
};
