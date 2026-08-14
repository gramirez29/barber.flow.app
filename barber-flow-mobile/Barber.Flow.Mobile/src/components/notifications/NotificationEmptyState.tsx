import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";
import { AppTheme } from "../../theme/themes";

type NotificationEmptyStateProps = {
	body: string;
	title: string;
};

export const NotificationEmptyState = ({
	body,
	title,
}: NotificationEmptyStateProps) => {
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<Ionicons
				color={theme.colors.textSecondary}
				name="checkmark-done-circle-outline"
				size={24}
			/>
			<Text style={styles.title}>
				{title}
			</Text>
			<Text style={styles.body}>
				{body}
			</Text>
		</View>
	);
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
	body: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		lineHeight: 18,
		textAlign: "center",
	},
	container: {
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.border,
		borderRadius: 12,
		borderWidth: 1,
		gap: 8,
		paddingHorizontal: 18,
		paddingVertical: 20,
	},
	title: {
		color: theme.colors.textPrimary,
		fontSize: 15,
		fontWeight: "600",
	},
});
