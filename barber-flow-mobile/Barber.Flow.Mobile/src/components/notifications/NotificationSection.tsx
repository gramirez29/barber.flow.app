import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NotificationItem } from "../../types/notifications";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";
import { AppTheme } from "../../theme/themes";

import { NotificationEmptyState } from "./NotificationEmptyState";
import { NotificationItemCard } from "./NotificationItemCard";

type NotificationSectionProps = {
	description: string;
	emptyBody: string;
	emptyTitle: string;
	items: NotificationItem[];
	onDismiss: (notificationId: string) => void;
	onItemPress: (item: NotificationItem) => void;
	/** When set, only this many items show at first and "Ver más" reveals another page. */
	pageSize?: number;
	title: string;
};

export const NotificationSection = ({
	description,
	emptyBody,
	emptyTitle,
	items,
	onDismiss,
	onItemPress,
	pageSize,
	title,
}: NotificationSectionProps) => {
	const { theme } = useAppTheme();
	const { translateText } = useTranslation();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const [visibleCount, setVisibleCount] = useState(pageSize ?? Number.MAX_SAFE_INTEGER);

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
					items.slice(0, visibleCount).map((item) => (
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
				{pageSize && items.length > visibleCount ? (
					<Pressable
						accessibilityRole="button"
						onPress={() => setVisibleCount((count) => count + pageSize)}
						style={styles.showMoreButton}
					>
						<Text style={styles.showMoreText}>
							{translateText("notifications.showMore", { count: items.length - visibleCount })}
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
	container: {
		gap: 12,
	},
	description: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		lineHeight: 20,
	},
	header: {
		gap: 4,
	},
	itemsWrap: {
		gap: 12,
	},
	showMoreButton: {
		alignItems: "center",
		borderColor: theme.colors.accent,
		borderRadius: 999,
		borderWidth: 1,
		paddingVertical: 12,
	},
	showMoreText: {
		color: theme.colors.accent,
		fontSize: 14,
		fontWeight: "700",
	},
	title: {
		color: theme.colors.textPrimary,
		fontSize: 18,
		fontWeight: "700",
	},
});
