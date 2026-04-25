import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApplicationUser } from "../types/applicationUser";
import { BASE_URL } from "../config";

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
		await AsyncStorage.setItem("applicationUser", JSON.stringify(data));
		return data;
	},
	getStoredUser: async (): Promise<ApplicationUser | null> => {
		const json = await AsyncStorage.getItem("applicationUser");
		return json ? JSON.parse(json) : null;
	},
	clearStoredUser: async () => {
		await AsyncStorage.removeItem("applicationUser");
	},
};
