import * as LocalAuthentication from "expo-local-authentication";

// Devices without biometrics/PIN configured fall back silently (no lock screen) so nobody
// is locked out of the app just because their device lacks that capability.
export const isBiometricLockAvailable = async (): Promise<boolean> => {
	try {
		const hasHardware = await LocalAuthentication.hasHardwareAsync();
		if (!hasHardware) return false;
		return await LocalAuthentication.isEnrolledAsync();
	} catch {
		return false;
	}
};

export const authenticateWithBiometrics = async (promptMessage: string): Promise<boolean> => {
	try {
		const result = await LocalAuthentication.authenticateAsync({
			promptMessage,
			disableDeviceFallback: false,
		});
		return result.success;
	} catch {
		return false;
	}
};
