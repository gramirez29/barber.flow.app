import React, { useMemo } from "react";
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NotificationSection } from "../components/notifications/NotificationSection";
import { useTranslation } from "../context/LanguageContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { useNotification } from "../context/NotificationContext";
import type { NotificationItem } from "../types/notifications";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { AppTabParamList } from "../navigation/AppNavigator";
import { getErrorMessage } from "../utils/errors";

const COLORS = {
    bg: "#0D0D0D",
    surface: "#1A1A1A",
    surfaceElevated: "#252525",
    gold: "#C9A84C",
    goldLight: "#E5C878",
    textPrimary: "#FFFFFF",
    textSecondary: "#9B9B9B",
    border: "#3A3A3A",
    overlay: "rgba(0,0,0,0.58)",
} as const;

export const NotificationScreen = () => {
    const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
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
        } catch (error: unknown) {
            Alert.alert(
                translateText("notifications.alerts.refreshFailedTitle"),
                getErrorMessage(error) || translateText("notifications.alerts.refreshFailed"),
            );
        }
    };
    
    return (
        <ImageBackground
            source={require("../../assets/images/barber-flow-background-image.jpg")}
            style={styles.screenBg}
            resizeMode="cover"
        >
            <View style={styles.screenOverlay} />
            <ScreenLayout
                title={translateText("notifications.title")}
                backgroundColor="transparent"
                onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <Text style={styles.eyebrow}>{translateText("notifications.heroEyebrow")}</Text>
                        <Text style={styles.heroTitle}>{translateText("notifications.heroTitle")}</Text>
                        <Text style={styles.heroSubtitle}>{translateText("notifications.heroSubtitle")}</Text>

                        <View style={styles.heroMetrics}>
                            <View style={styles.metricPill}>
                                <Text style={styles.metricValue}>{notifications.length}</Text>
                                <Text style={styles.metricLabel}>{translateText("common.visible")}</Text>
                            </View>
                            <View style={styles.metricPill}>
                                <Text style={styles.metricValue}>{unreadCount}</Text>
                                <Text style={styles.metricLabel}>{translateText("common.unread")}</Text>
                            </View>
                        </View>

                        <View style={styles.heroActions}>
                            <Pressable
                                style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
                                onPress={() => void handleRefresh()}
                            >
                                <Text style={styles.btnPrimaryText}>
                                    {isLoading ? "..." : translateText("common.refresh")}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.btnSecondary,
                                    pressed && { opacity: 0.8 },
                                    unreadCount === 0 && styles.btnDisabled,
                                ]}
                                onPress={() => void handleMarkAllAsRead()}
                                disabled={unreadCount === 0}
                            >
                                <Text style={[styles.btnSecondaryText, unreadCount === 0 && styles.btnDisabledText]}>
                                    {translateText("common.markAllAsRead")}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {!notificationsEnabled ? (
                        <View style={styles.card}>
                            <Text style={styles.disabledTitle}>{translateText("notifications.disabledTitle")}</Text>
                            <Text style={styles.disabledBody}>{translateText("notifications.disabledBody")}</Text>
                        </View>
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
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    screenBg: { flex: 1 },
    screenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,13,13,0.65)" },
    flex: { flex: 1 },
    scrollContent: {
        gap: 18,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
        borderRadius: 24,
        borderWidth: 1,
        gap: 16,
        paddingHorizontal: 18,
        paddingVertical: 20,
    },
    eyebrow: {
        color: COLORS.gold,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.4,
        textTransform: "uppercase",
    },
    heroTitle: {
        color: COLORS.textPrimary,
        fontSize: 26,
        fontWeight: "700",
    },
    heroSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    heroMetrics: {
        flexDirection: "row",
        gap: 12,
    },
    metricPill: {
        backgroundColor: COLORS.surfaceElevated,
        borderColor: COLORS.border,
        borderRadius: 14,
        borderWidth: 1,
        flex: 1,
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    metricValue: {
        color: COLORS.textPrimary,
        fontSize: 22,
        fontWeight: "700",
    },
    metricLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textTransform: "uppercase",
    },
    heroActions: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    btnPrimary: {
        alignItems: "center",
        backgroundColor: COLORS.gold,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 11,
    },
    btnPrimaryText: {
        color: "#0D0D0D",
        fontSize: 14,
        fontWeight: "700",
    },
    btnSecondary: {
        alignItems: "center",
        borderColor: COLORS.border,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    btnSecondaryText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    btnDisabled: {
        opacity: 0.4,
    },
    btnDisabledText: {
        color: COLORS.textSecondary,
    },
    disabledTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
    },
    disabledBody: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    sectionsWrap: {
        gap: 18,
    },
});