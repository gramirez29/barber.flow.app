import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Button, Text } from "react-native-paper";
import { NotificationSection } from "../components/notifications/NotificationSection";
import { FormCard } from "../components/ui/FormCard";
import { useAppTheme } from "../theme/ThemeContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { useNotification } from "../context/NotificationContext";
import type { NotificationItem } from "../types/notifications";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { AppTabParamList } from "../navigation/AppNavigator";

export const NotificationScreen = () => {
    const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
    const { theme } = useAppTheme();
    const {
        dismissNotification,
        isLoading,
        markAllAsRead,
        markAsRead,
        notifications,
        notificationsEnabled,
        refreshNotifications,
        unreadCount,
    } = useNotification();

    const tomorrowNotifications = useMemo(
        () => notifications.filter((item) => item.type === "next-day-summary"),
        [notifications],
    );

    const delayedNotifications = useMemo(
        () => notifications.filter((item) => item.type === "delayed-client-summary"),
        [notifications],
    );

    const handleNotificationPress = async (item: NotificationItem) => {
        await markAsRead(item.id);

        const route = item.payload.route;

        if (route === "Calendar") {
            navigation.navigate("Calendar", {
                date: item.payload.date,
                initialView: "day",
                source: "notification",
            });
            return;
        }

        if (route === "Clients") {
            navigation.navigate("Clients");
            return;
        }
    };

    const handleDismiss = async (notificationId: string) => {
        await dismissNotification(notificationId);
    };

    const handleMarkAllAsRead = async () => {
        if (notifications.length === 0) {
            return;
        }

        await markAllAsRead();
    };

    const handleRefresh = async () => {
        try {
            await refreshNotifications();
        } catch (error: any) {
            Alert.alert("Refresh failed", error?.message ?? "Notifications could not be refreshed.");
        }
    };
    
    return (
        <ScreenLayout
            title="Notificaciones"
            backgroundColor={theme.colors.background}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <FormCard style={styles.heroCard}>
                    <Text style={[styles.heroEyebrow, { color: theme.colors.textSecondary }]}>Daily summary</Text>
                    <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>Notifications workspace</Text>
                    <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}> 
                        Review tomorrow's agenda, identify clients that need follow-up, and keep notification noise reduced to actionable summaries.
                    </Text>

                    <View style={styles.heroMetrics}>
                        <View style={[styles.metricPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{notifications.length}</Text>
                            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Visible</Text>
                        </View>
                        <View style={[styles.metricPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{unreadCount}</Text>
                            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Unread</Text>
                        </View>
                    </View>

                    <View style={styles.heroActions}>
                        <Button mode="contained" onPress={() => void handleRefresh()} loading={isLoading}>
                            Refresh
                        </Button>
                        <Button mode="text" onPress={() => void handleMarkAllAsRead()} disabled={unreadCount === 0}>
                            Mark all as read
                        </Button>
                    </View>
                </FormCard>

                {!notificationsEnabled ? (
                    <FormCard>
                        <Text style={[styles.disabledTitle, { color: theme.colors.textPrimary }]}>Notifications are disabled</Text>
                        <Text style={[styles.disabledBody, { color: theme.colors.textSecondary }]}> 
                            Enable notifications in Settings to restore the summary feed and unread badge counts.
                        </Text>
                    </FormCard>
                ) : (
                    <View style={styles.sectionsWrap}>
                        <NotificationSection
                            description="One summary notification for tomorrow's scheduled appointments."
                            emptyBody="When appointments exist for tomorrow, the app will group them into a single daily agenda summary."
                            emptyTitle="No summary for tomorrow"
                            items={tomorrowNotifications}
                            onDismiss={(notificationId) => void handleDismiss(notificationId)}
                            onItemPress={(item) => void handleNotificationPress(item)}
                            title="Tomorrow"
                        />

                        <NotificationSection
                            description="Clients who have not visited recently and do not have a future appointment."
                            emptyBody="Delayed-client reminders will appear here once a client crosses the current follow-up threshold."
                            emptyTitle="No delayed clients"
                            items={delayedNotifications}
                            onDismiss={(notificationId) => void handleDismiss(notificationId)}
                            onItemPress={(item) => void handleNotificationPress(item)}
                            title="Needs Attention"
                        />
                    </View>
                )}
            </ScrollView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    disabledBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    disabledTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
    },
    flex: {
        flex: 1,
    },
    heroActions: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    heroCard: {
        gap: 16,
    },
    heroEyebrow: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    heroMetrics: {
        flexDirection: "row",
        gap: 12,
    },
    heroSubtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: "700",
    },
    metricLabel: {
        fontSize: 12,
        textTransform: "uppercase",
    },
    metricPill: {
        borderRadius: 14,
        borderWidth: 1,
        flex: 1,
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: "700",
    },
    scrollContent: {
        gap: 18,
        paddingBottom: 32,
    },
    sectionsWrap: {
        gap: 18,
    },
});