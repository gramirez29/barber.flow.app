import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { OtpVerificationScreen } from "../screens/OtpVerificationScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { LockScreen } from "../screens/LockScreen";
import { BlockedScreen } from "../screens/BlockedScreen";
import { DrawerNavigator } from "./DrawerNavigator";
import { useAuthStore } from "../store/auth.store";
import { authService } from "../services/authService";
import { settingsService } from "../services/settingsService";
import { isBiometricLockAvailable } from "../utils/biometricAuth";

const Stack = createNativeStackNavigator();

// Backstop de propagación para una sesión que queda completamente inactiva (sin ninguna
// request) durante mucho tiempo — el enforcement real e inmediato pasa por el 403
// ACCOUNT_BLOCKED que apiClient intercepta en cualquier llamada a la API.
const BLOCKED_STATUS_POLL_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const RootNavigator = () => {
	const user = useAuthStore((s) => s.user);
	const setUser = useAuthStore((s) => s.setUser);
	const setBlocked = useAuthStore((s) => s.setBlocked);
	const [isAuthReady, setIsAuthReady] = useState(false);
	const [isLocked, setIsLocked] = useState(false);
	const [biometricAvailable, setBiometricAvailable] = useState(false);
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		let active = true;
		const bootstrap = async () => {
			try {
				const [storedUser, biometricLockAvailable] = await Promise.all([
					authService.getStoredUser(),
					isBiometricLockAvailable(),
				]);
				if (!active) return;

				setBiometricAvailable(biometricLockAvailable);
				if (storedUser) {
					setUser(storedUser);
					// Cold start with a previously saved session - require a biometric/PIN
					// check before showing anything, when the device supports it.
					if (biometricLockAvailable) {
						setIsLocked(true);
					}
				}
			} finally {
				if (active) {
					setIsAuthReady(true);
				}
			}
		};

		void bootstrap();

		return () => {
			active = false;
		};
	}, [setUser]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
			const cameToForeground =
				appStateRef.current.match(/inactive|background/) && nextState === "active";
			if (cameToForeground && user && biometricAvailable) {
				setIsLocked(true);
			}
			// Backstop de propagación: revisa el estado de bloqueo cada vez que la app
			// vuelve a foreground, cubriendo el caso típico de mobile (app resumida tras
			// haber estado en background) sin depender solo del poll diario.
			if (cameToForeground && user) {
				void settingsService
					.getMyStatus()
					.then((status) => setBlocked(status.isBlocked))
					.catch(() => {
						// Si falla (p. ej. por estar bloqueado), apiClient ya se encarga de
						// actualizar el store vía el manejo del 403 ACCOUNT_BLOCKED.
					});
			}
			appStateRef.current = nextState;
		});

		return () => subscription.remove();
	}, [user, biometricAvailable, setBlocked]);

	useEffect(() => {
		if (!user) return;

		const interval = setInterval(() => {
			void settingsService
				.getMyStatus()
				.then((status) => setBlocked(status.isBlocked))
				.catch(() => {
					// Ver comentario equivalente arriba.
				});
		}, BLOCKED_STATUS_POLL_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [user, setBlocked]);

	if (!isAuthReady) {
		return null;
	}

	if (user?.isBlocked) {
		return <BlockedScreen />;
	}

	if (user && isLocked) {
		return <LockScreen onUnlock={() => setIsLocked(false)} />;
	}

	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			{user ? (
				<Stack.Screen name="Main" component={DrawerNavigator} />
			) : (
				<>
					<Stack.Screen name="Login" component={LoginScreen} />
					<Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
					<Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
					<Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
				</>
			)}
		</Stack.Navigator>
	);
};
