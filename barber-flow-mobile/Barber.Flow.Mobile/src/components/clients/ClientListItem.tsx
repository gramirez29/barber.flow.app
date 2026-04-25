import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text, TouchableRipple } from "react-native-paper";
import { ClientAvatar } from "../ClientAvatar";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";
import type { Client } from "../../types/clients";

interface ClientListItemProps {
	client: Client;
	onPress: (client: Client) => void;
	onSchedule: (client: Client) => void;
}

export const ClientListItem = ({ client, onPress, onSchedule }: ClientListItemProps) => {
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();
	const fullName = `${client.firstName} ${client.lastName}`.trim();

	return (
		<View
			style={[
				styles.card,
				{
				backgroundColor: theme.colors.surface,
				borderColor: theme.colors.border,
				},
				theme.layout.shadows.card,
			]}
			>
			<View style={styles.contentRow}>
				<TouchableRipple
					borderless={false}
					onPress={() => onPress(client)}
					style={styles.pressableContent}
					>
					<View style={styles.mainContent}>
						<ClientAvatar initials={fullName} size={64} uri={client.photoUrl} />

						<View style={styles.copyWrap}>
							<Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
								{fullName}
							</Text>
							<Text style={[styles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
								{client.phone}
							</Text>
							<Text style={[styles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
								{client.email || translateText("clients.list.noEmail")}
							</Text>
						</View>
					</View>
				</TouchableRipple>

				<IconButton
				accessibilityLabel={translateText("clients.buttons.scheduleAppointmentA11y", { clientName: fullName })}
				icon="calendar-plus"
				iconColor={theme.colors.primary}
				onPress={() => onSchedule(client)}
				size={24}
				style={styles.scheduleButton}/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
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
		fontSize: 14,
		lineHeight: 20,
	},
	name: {
		fontSize: 17,
		fontWeight: "700",
	},
	pressableContent: {
		flex: 1,
	},
	scheduleButton: {
		marginHorizontal: 8,
	},
});