import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ClientAvatar } from "../ClientAvatar";
import { useTranslation } from "../../context/LanguageContext";
import type { Client } from "../../types/clients";

const COLORS = {
	surface: "#1A1A1A",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
} as const;

interface ClientListItemProps {
	client: Client;
	onPress: (client: Client) => void;
	onSchedule: (client: Client) => void;
}

export const ClientListItem = ({ client, onPress, onSchedule }: ClientListItemProps) => {
	const { translateText } = useTranslation();
	const fullName = `${client.firstName} ${client.lastName}`.trim();

	return (
		<View style={styles.card}>
			<View style={styles.contentRow}>
				<Pressable
					onPress={() => onPress(client)}
					style={styles.pressableContent}
				>
					<View style={styles.mainContent}>
						<ClientAvatar initials={fullName} size={64} uri={client.photoUrl} />

						<View style={styles.copyWrap}>
							<Text style={styles.name} numberOfLines={1}>
								{fullName}
							</Text>
							<Text style={styles.meta} numberOfLines={1}>
								{client.phone}
							</Text>
							<Text style={styles.meta} numberOfLines={1}>
								{client.email || translateText("clients.list.noEmail")}
							</Text>
						</View>
					</View>
				</Pressable>

				<Pressable
					accessibilityLabel={translateText("clients.buttons.scheduleAppointmentA11y", { clientName: fullName })}
					onPress={() => onSchedule(client)}
					style={styles.scheduleButton}
				>
					<Ionicons name="calendar-outline" size={22} color={COLORS.gold} />
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: COLORS.surface,
		borderColor: COLORS.border,
		borderRadius: 20,
		borderWidth: 1,
		marginBottom: 12,
		overflow: "hidden",
	},
	contentRow: {
		alignItems: "center",
		flexDirection: "row",
	},
	mainContent: {
		alignItems: "center",
		flexDirection: "row",
		gap: 16,
		paddingLeft: 16,
		paddingVertical: 14,
	},
	copyWrap: {
		flex: 1,
		gap: 4,
	},
	meta: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},
	name: {
		color: COLORS.textPrimary,
		fontSize: 17,
		fontWeight: "700",
	},
	pressableContent: {
		flex: 1,
	},
	scheduleButton: {
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 12,
		padding: 8,
	},
});