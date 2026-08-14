import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../context/LanguageContext";
import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";

interface ClientsListEmptyStateProps {
	loading: boolean;
}

export const ClientsListEmptyState = ({ loading }: ClientsListEmptyStateProps) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<Ionicons
				name={loading ? "hourglass-outline" : "people-outline"}
				size={28}
				color={theme.colors.textSecondary}
			/>
			<Text style={styles.title}>
				{translateText("clients.list.emptyTitle")}
			</Text>
			<Text style={styles.body}>
				{translateText("clients.list.emptyBody")}
			</Text>
		</View>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		body: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			lineHeight: 21,
			textAlign: "center",
		},
		container: {
			alignItems: "center",
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderRadius: 20,
			borderWidth: 1,
			gap: 10,
			marginTop: 12,
			paddingHorizontal: 20,
			paddingVertical: 28,
		},
		title: {
			color: theme.colors.textPrimary,
			fontSize: 18,
			fontWeight: "700",
		},
	});