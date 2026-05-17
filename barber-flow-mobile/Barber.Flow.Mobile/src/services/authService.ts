import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApplicationUser } from "../types/applicationUser";
import { BASE_URL } from "../config";

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
		const userWithCredentials: ApplicationUser = { ...data, password };
		await AsyncStorage.setItem("applicationUser", JSON.stringify(userWithCredentials));
		return userWithCredentials;
	},
	getStoredUser: async (): Promise<ApplicationUser | null> => {
		const json = await AsyncStorage.getItem("applicationUser");
		return json ? JSON.parse(json) : null;
	},
	clearStoredUser: async () => {
		await AsyncStorage.removeItem("applicationUser");
	},
};
