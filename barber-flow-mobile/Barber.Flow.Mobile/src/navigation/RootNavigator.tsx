import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { OtpVerificationScreen } from "../screens/OtpVerificationScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { LockScreen } from "../screens/LockScreen";
import { DrawerNavigator } from "./DrawerNavigator";
import { useAuthStore } from "../store/auth.store";
import { authService } from "../services/authService";
import { isBiometricLockAvailable } from "../utils/biometricAuth";

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
	const user = useAuthStore((s) => s.user);
	const setUser = useAuthStore((s) => s.setUser);
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
			appStateRef.current = nextState;
		});

		return () => subscription.remove();
	}, [user, biometricAvailable]);

	if (!isAuthReady) {
		return null;
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
