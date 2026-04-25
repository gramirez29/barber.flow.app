import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../theme/ThemeContext";
import type { NotificationItem } from "../../types/notifications";
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
	const { theme } = useAppTheme();

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: theme.colors.textPrimary }]}>
					{title}
				</Text>
				<Text style={[styles.description, { color: theme.colors.textSecondary }]}>
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
		fontSize: 18,
		fontWeight: "700",
	},
});