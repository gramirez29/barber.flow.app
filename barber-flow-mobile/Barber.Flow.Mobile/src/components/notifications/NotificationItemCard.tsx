import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../context/LanguageContext";
import { getNotificationDisplayText } from "../../services/notificationService";
import type { NotificationItem } from "../../types/notifications";

const COLORS = {
	bg: "#0D0D0D",
	surface: "#1A1A1A",
	gold: "#C9A84C",
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
	border: "#3A3A3A",
	error: "#E57373",
} as const;

type NotificationItemCardProps = {
	item: NotificationItem;
	onDismiss: (notificationId: string) => void;
	onPress: (item: NotificationItem) => void;
};

const getNotificationIcon = (type: NotificationItem["type"]) => {
	switch (type) {
		case "delayed-client-summary":
			return "alert-circle-outline";
		default:
			return "calendar-outline";
	}
};

export const NotificationItemCard = ({
	item,
	onDismiss,
	onPress,
}: NotificationItemCardProps) => {
	const { translateText } = useTranslation();
	const copy = getNotificationDisplayText(item, translateText);

	return (
		<Pressable
			onPress={() => onPress(item)}
			style={({ pressed }) => [
				styles.card,
				item.isRead ? styles.cardRead : styles.cardUnread,
				pressed && { opacity: 0.9 },
			]}
		>
			<View style={styles.headerRow}>
				<View style={styles.iconWrap}>
					<Ionicons
						color={item.type === "delayed-client-summary" ? COLORS.error : COLORS.gold}
						name={getNotificationIcon(item.type)}
						size={18}
					/>
				</View>

				<View style={styles.headerCopy}>
					<Text style={styles.title}>
						{copy.title}
					</Text>
					<Text style={styles.meta}>
						{item.type === "next-day-summary"
						? translateText("notifications.metaTomorrow")
						: translateText("notifications.metaNeedsFollowUp")}
					</Text>
				</View>

				{!item.isRead ? (
				<View style={styles.unreadDot} />
				) : null}
			</View>

			<Text style={styles.message}>
				{copy.message}
			</Text>

			<View style={styles.actionsRow}>
				<Pressable
					onPress={() => onPress(item)}
					style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
				>
					<Text style={styles.actionBtnPrimary}>{translateText("common.open")}</Text>
				</Pressable>
				<Pressable
					onPress={() => onDismiss(item.id)}
					style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
				>
					<Text style={styles.actionBtnSecondary}>{translateText("common.dismiss")}</Text>
				</Pressable>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	actionBtn: {
		paddingHorizontal: 4,
		paddingVertical: 4,
	},
	actionBtnPrimary: {
		color: COLORS.gold,
		fontSize: 13,
		fontWeight: "600",
	},
	actionBtnSecondary: {
		color: COLORS.textSecondary,
		fontSize: 13,
	},
	actionsRow: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
	},
	card: {
		borderColor: COLORS.border,
		borderRadius: 14,
		borderWidth: 1,
		gap: 12,
		padding: 16,
	},
	cardRead: {
		backgroundColor: COLORS.bg,
	},
	cardUnread: {
		backgroundColor: COLORS.surface,
	},
	headerCopy: {
		flex: 1,
		gap: 2,
	},
	headerRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
	},
	iconWrap: {
		alignItems: "center",
		backgroundColor: "rgba(201,168,76,0.15)",
		borderRadius: 20,
		height: 40,
		justifyContent: "center",
		width: 40,
	},
	message: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},
	meta: {
		color: COLORS.textSecondary,
		fontSize: 12,
		textTransform: "uppercase",
	},
	title: {
		color: COLORS.textPrimary,
		fontSize: 15,
		fontWeight: "600",
	},
	unreadDot: {
		backgroundColor: COLORS.gold,
		borderRadius: 5,
		height: 10,
		width: 10,
	},
});