import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../theme/ThemeContext";
import { AppTheme } from "../theme/themes";
import { useTranslation } from "../context/LanguageContext";
import { authenticateWithBiometrics } from "../utils/biometricAuth";
import { useAuthStore } from "../store/auth.store";
import { authService } from "../services/authService";

interface Props {
	onUnlock: () => void;
}

export const LockScreen: React.FC<Props> = ({ onUnlock }) => {
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { translateText } = useTranslation();
	const clearUser = useAuthStore((s) => s.clearUser);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const attemptUnlock = async () => {
		setIsAuthenticating(true);
		setError(null);
		const success = await authenticateWithBiometrics(translateText("lock.promptMessage"));
		setIsAuthenticating(false);
		if (success) {
			onUnlock();
		} else {
			setError(translateText("lock.authFailed"));
		}
	};

	useEffect(() => {
		void attemptUnlock();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleLogout = async () => {
		clearUser();
		await authService.clearStoredUser();
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.container}>
				<View style={styles.iconCircle}>
					<Ionicons name="lock-closed" size={28} color="#0F172A" />
				</View>
				<Text style={styles.title}>{translateText("lock.title")}</Text>
				<Text style={styles.subtitle}>{translateText("lock.subtitle")}</Text>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					style={({ pressed }) => [styles.button, { opacity: pressed || isAuthenticating ? 0.8 : 1 }]}
					onPress={attemptUnlock}
					disabled={isAuthenticating}
					accessibilityRole="button"
					accessibilityLabel={translateText("lock.unlock")}
				>
					{isAuthenticating ? (
						<ActivityIndicator color="#0F172A" />
					) : (
						<Text style={styles.buttonText}>{translateText("lock.unlock").toUpperCase()}</Text>
					)}
				</Pressable>

				<Pressable onPress={handleLogout} style={styles.logoutLink}>
					<Text style={styles.logoutText}>{translateText("drawer.logout")}</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		safe: { flex: 1, backgroundColor: theme.colors.background },
		container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
		iconCircle: {
			width: 64,
			height: 64,
			borderRadius: 32,
			backgroundColor: theme.colors.accent,
			alignItems: "center",
			justifyContent: "center",
			marginBottom: 24,
		},
		title: {
			color: theme.colors.textPrimary,
			fontSize: 22,
			fontWeight: "700",
			marginBottom: 8,
			textAlign: "center",
		},
		subtitle: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			textAlign: "center",
			marginBottom: 24,
			lineHeight: 20,
		},
		error: {
			color: theme.colors.error,
			fontSize: 13,
			marginBottom: 16,
			textAlign: "center",
		},
		button: {
			height: 54,
			minWidth: 200,
			borderRadius: 14,
			backgroundColor: theme.colors.accent,
			alignItems: "center",
			justifyContent: "center",
			shadowColor: theme.colors.accent,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.4,
			shadowRadius: 10,
			elevation: 6,
			marginBottom: 20,
		},
		buttonText: {
			color: "#0F172A",
			fontSize: 15,
			fontWeight: "800",
			letterSpacing: 1.5,
		},
		logoutLink: { paddingVertical: 12 },
		logoutText: {
			color: theme.colors.textSecondary,
			fontSize: 13,
			textDecorationLine: "underline",
		},
	});
