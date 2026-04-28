import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NotificationItem } from "../../types/notifications";

const COLORS = {
	textPrimary: "#FFFFFF",
	textSecondary: "#9B9B9B",
} as const;
import { NotificationEmptyState } from "./NotificationEmptyState";
import { NotificationItemCard } from "./NotificationItemCard";

type NotificationSectionProps = {
	description: string;
	emptyBody: string;
	emptyTitle: string;
	items: NotificationItem[];
	onDismiss: (notificationId: string) => void;
	onItemPress: (item: NotificationItem) => void;
	title: string;
};

export const NotificationSection = ({
		description,
		emptyBody,
		emptyTitle,
		items,
		onDismiss,
		onItemPress,
		title,
	}: NotificationSectionProps) => {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>
					{title}
				</Text>
				<Text style={styles.description}>
					{description}
				</Text>
			</View>

			<View style={styles.itemsWrap}>
				{items.length > 0 ? (
				items.map((item) => (
					<NotificationItemCard
						item={item}
						key={item.id}
						onDismiss={onDismiss}
						onPress={onItemPress}
					/>
				))
				) : (
				<NotificationEmptyState body={emptyBody} title={emptyTitle} />
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		gap: 12,
	},
	description: {
		color: COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},
	header: {
		gap: 4,
	},
	itemsWrap: {
		gap: 12,
	},
	title: {
		color: COLORS.textPrimary,
		fontSize: 18,
		fontWeight: "700",
	},
});