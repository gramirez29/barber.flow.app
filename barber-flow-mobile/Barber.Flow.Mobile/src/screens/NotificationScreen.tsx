import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Button, Text } from "react-native-paper";
import { NotificationSection } from "../components/notifications/NotificationSection";
import { FormCard } from "../components/ui/FormCard";
import { useTranslation } from "../context/LanguageContext";
import { useAppTheme } from "../theme/ThemeContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { useNotification } from "../context/NotificationContext";
import type { NotificationItem } from "../types/notifications";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { AppTabParamList } from "../navigation/AppNavigator";

export const NotificationScreen = () => {
    const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
    const { theme } = useAppTheme();
    const { translateText } = useTranslation();
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
                screen: "CalendarHome",
                params: {
                    date: item.payload.date,
                    initialView: "day",
                    source: "notification",
                },
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
            Alert.alert(
                translateText("notifications.alerts.refreshFailedTitle"),
                error?.message ?? translateText("notifications.alerts.refreshFailed"),
            );
        }
    };
    
    return (
        <ScreenLayout
            title={translateText("notifications.title")}
            backgroundColor={theme.colors.background}
            onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <FormCard style={styles.heroCard}>
                    <Text style={[styles.heroEyebrow, { color: theme.colors.textSecondary }]}>{translateText("notifications.heroEyebrow")}</Text>
                    <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>{translateText("notifications.heroTitle")}</Text>
                    <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}> 
                        {translateText("notifications.heroSubtitle")}
                    </Text>

                    <View style={styles.heroMetrics}>
                        <View style={[styles.metricPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{notifications.length}</Text>
                            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{translateText("common.visible")}</Text>
                        </View>
                        <View style={[styles.metricPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{unreadCount}</Text>
                            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{translateText("common.unread")}</Text>
                        </View>
                    </View>

                    <View style={styles.heroActions}>
                        <Button mode="contained" onPress={() => void handleRefresh()} loading={isLoading}>
                            {translateText("common.refresh")}
                        </Button>
                        <Button mode="text" onPress={() => void handleMarkAllAsRead()} disabled={unreadCount === 0}>
                            {translateText("common.markAllAsRead")}
                        </Button>
                    </View>
                </FormCard>

                {!notificationsEnabled ? (
                    <FormCard>
                        <Text style={[styles.disabledTitle, { color: theme.colors.textPrimary }]}>{translateText("notifications.disabledTitle")}</Text>
                        <Text style={[styles.disabledBody, { color: theme.colors.textSecondary }]}> 
                            {translateText("notifications.disabledBody")}
                        </Text>
                    </FormCard>
                ) : (
                    <View style={styles.sectionsWrap}>
                        <NotificationSection
                            description={translateText("notifications.tomorrowDescription")}
                            emptyBody={translateText("notifications.tomorrowEmptyBody")}
                            emptyTitle={translateText("notifications.tomorrowEmptyTitle")}
                            items={tomorrowNotifications}
                            onDismiss={(notificationId) => void handleDismiss(notificationId)}
                            onItemPress={(item) => void handleNotificationPress(item)}
                            title={translateText("notifications.tomorrowTitle")}
                        />

                        <NotificationSection
                            description={translateText("notifications.delayedClientsDescription")}
                            emptyBody={translateText("notifications.delayedClientsEmptyBody")}
                            emptyTitle={translateText("notifications.delayedClientsEmptyTitle")}
                            items={delayedNotifications}
                            onDismiss={(notificationId) => void handleDismiss(notificationId)}
                            onItemPress={(item) => void handleNotificationPress(item)}
                            title={translateText("notifications.delayedClientsTitle")}
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