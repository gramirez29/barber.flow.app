import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ClientAvatar } from "../ClientAvatar";
import { useTranslation } from "../../context/LanguageContext";
import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";
import type { Client } from "../../types/clients";

const RADIUS = 16;

interface ClientListItemProps {
	client: Client;
	onPress: (client: Client) => void;
	onSchedule: (client: Client) => void;
	isFirst?: boolean;
	isLast?: boolean;
}

export const ClientListItem = ({ client, onPress, onSchedule, isFirst, isLast }: ClientListItemProps) => {
	const { translateText } = useTranslation();
	const { theme } = useAppTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const fullName = `${client.firstName} ${client.lastName}`.trim();

	return (
		<View
			style={[
				styles.item,
				isFirst && styles.itemFirst,
				isLast && styles.itemLast,
			]}
		>
			<Pressable
				onPress={() => onPress(client)}
				style={({ pressed }) => [styles.pressableContent, pressed && styles.pressablePressed]}
				android_ripple={{ color: theme.colors.accent + "14" /* 0.08 alpha */ }}
			>
				<ClientAvatar initials={fullName} size={46} uri={client.photoUrl} />
				<View style={styles.copyWrap}>
					<Text style={styles.name} numberOfLines={1}>{fullName}</Text>
					<Text style={styles.metaPhone} numberOfLines={1}>{client.phone}</Text>
					<Text style={styles.metaEmail} numberOfLines={1}>
						{client.email || translateText("clients.list.noEmail")}
					</Text>
				</View>
			</Pressable>

			<Pressable
				accessibilityLabel={translateText("clients.buttons.scheduleAppointmentA11y", { clientName: fullName })}
				onPress={() => onSchedule(client)}
				style={styles.scheduleButton}
				android_ripple={{ color: theme.colors.accent + "14", borderless: true, radius: 22 }}
			>
				<Ionicons name="calendar-outline" size={20} color={theme.colors.accent} />
			</Pressable>
		</View>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		item: {
			alignItems: "center",
			backgroundColor: theme.colors.surface,
			borderColor: theme.colors.border,
			borderLeftWidth: 1,
			borderRightWidth: 1,
			flexDirection: "row",
			overflow: "hidden",
		},
		itemFirst: {
			borderTopLeftRadius: RADIUS,
			borderTopRightRadius: RADIUS,
			borderTopWidth: 1,
		},
		itemLast: {
			borderBottomLeftRadius: RADIUS,
			borderBottomRightRadius: RADIUS,
			borderBottomWidth: 1,
		},
		pressableContent: {
			alignItems: "center",
			flex: 1,
			flexDirection: "row",
			gap: 16,
			paddingHorizontal: 16,
			paddingVertical: 12,
		},
		pressablePressed: {
			backgroundColor: "rgba(255, 255, 255, 0.04)",
		},
		copyWrap: {
			flex: 1,
			gap: 2,
		},
		name: {
			color: theme.colors.textPrimary,
			fontSize: 16,
			fontWeight: "700",
			letterSpacing: 0.15,
		},
		metaPhone: {
			color: theme.colors.textSecondary,
			fontSize: 13,
			lineHeight: 18,
		},
		metaEmail: {
			color: theme.colors.textSecondary,
			fontSize: 12,
			lineHeight: 17,
			opacity: 0.75,
		},
		scheduleButton: {
			alignItems: "center",
			justifyContent: "center",
			marginRight: 8,
			padding: 12,
		},
	});