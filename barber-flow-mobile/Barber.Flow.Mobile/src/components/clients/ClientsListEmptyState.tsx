import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../context/LanguageContext";

const COLORS = {
	surface: "#1A1A1A",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
} as const;

interface ClientsListEmptyStateProps {
	loading: boolean;
}

export const ClientsListEmptyState = ({ loading }: ClientsListEmptyStateProps) => {
	const { translateText } = useTranslation();

	return (
		<View style={styles.container}>
			<Ionicons
				name={loading ? "hourglass-outline" : "people-outline"}
				size={28}
				color={COLORS.textSecondary}
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

const styles = StyleSheet.create({
	body: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 21,
		textAlign: "center",
	},
	container: {
		alignItems: "center",
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 20,
		borderWidth: 1,
		gap: 10,
		marginTop: 12,
		paddingHorizontal: 20,
		paddingVertical: 28,
	},
	title: {
		color: COLORS.textPrimary,
		fontSize: 18,
		fontWeight: "700",
	},
});