import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../theme/ThemeContext";
import { AppTheme } from "../theme/themes";
import { useTranslation } from "../context/LanguageContext";
import { useAuthStore } from "../store/auth.store";
import { authService } from "../services/authService";

export const BlockedScreen: React.FC = () => {
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { translateText } = useTranslation();
	const clearUser = useAuthStore((s) => s.clearUser);

	const handleLogout = async () => {
		clearUser();
		await authService.clearStoredUser();
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.container}>
				<View style={styles.iconCircle}>
					<Ionicons name="ban" size={28} color="#0F172A" />
				</View>
				<Text style={styles.title}>{translateText("blocked.title")}</Text>
				<Text style={styles.subtitle}>{translateText("blocked.subtitle")}</Text>

				<Pressable
					style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
					onPress={() => void handleLogout()}
					accessibilityRole="button"
					accessibilityLabel={translateText("drawer.logout")}
				>
					<Text style={styles.buttonText}>{translateText("drawer.logout").toUpperCase()}</Text>
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
			marginBottom: 28,
			lineHeight: 20,
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
			paddingHorizontal: 24,
		},
		buttonText: {
			color: "#0F172A",
			fontSize: 15,
			fontWeight: "800",
			letterSpacing: 1.5,
		},
	});
