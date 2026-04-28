import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const COLORS = {
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	surfaceElevated: "#252525",
	border: "#3A3A3A",
} as const;

type NotificationEmptyStateProps = {
	body: string;
	title: string;
};

export const NotificationEmptyState = ({
	body,
	title,
}: NotificationEmptyStateProps) => {
	return (
		<View style={styles.container}>
			<Ionicons
				color={COLORS.textSecondary}
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

const styles = StyleSheet.create({
	body: {
		color: COLORS.textSecondary,
		fontSize: 13,
		lineHeight: 18,
		textAlign: "center",
	},
	container: {
		alignItems: "center",
		backgroundColor: COLORS.surfaceElevated,
		borderColor: COLORS.border,
		borderRadius: 12,
		borderWidth: 1,
		gap: 8,
		paddingHorizontal: 18,
		paddingVertical: 20,
	},
	title: {
		color: COLORS.textPrimary,
		fontSize: 15,
		fontWeight: "600",
	},
});
