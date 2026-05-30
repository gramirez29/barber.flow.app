import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ClientStats } from "../../types/clients";
import { useTranslation } from "../../context/LanguageContext";

const COLORS = {
    surface: "#1A1A1A",
    gold: "#C9A84C",
    textPrimary: "#FFFFFF",
    textSecondary: "#9B9B9B",
    border: "#3A3A3A",
} as const;

const RADIUS = 14;

interface ClientStatsCardProps {
    stats: ClientStats;
}

export const ClientStatsCard: React.FC<ClientStatsCardProps> = ({ stats }) => {
    const { translateText } = useTranslation();

    const formatCurrency = (amount: number) => {
        return `₡${amount.toLocaleString("es-CR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const completionRate =
        stats.totalAppointments > 0
            ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
            : 0;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{translateText("clientHistory.statsTitle")}</Text>

            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalAppointments}</Text>
                    <Text style={styles.statLabel}>{translateText("clientHistory.totalAppointments")}</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.goldText]}>
                        {stats.completedAppointments}
                    </Text>
                    <Text style={styles.statLabel}>{translateText("calendar.appointmentModal.statuses.completed")}</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.cancelledAppointments}</Text>
                    <Text style={styles.statLabel}>{translateText("calendar.appointmentModal.statuses.cancelled")}</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{completionRate}%</Text>
                    <Text style={styles.statLabel}>{translateText("clientHistory.completionRate")}</Text>
                </View>
            </View>

            <View style={styles.financialStats}>
                <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>{translateText("clientHistory.totalSpent")}</Text>
                    <Text style={[styles.financialValue, styles.goldText]}>
                        {formatCurrency(stats.totalSpent)}
                    </Text>
                </View>

                {stats.lastVisit && (
                    <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>{translateText("clientHistory.lastVisit")}</Text>
                        <Text style={styles.financialValue}>{stats.lastVisit}</Text>
                    </View>
                )}

                {stats.preferredPaymentMethod && (
                    <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>{translateText("clientHistory.preferredPayment")}</Text>
                        <Text style={styles.financialValue}>
                            {stats.preferredPaymentMethod}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
    },
    statValue: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 4,
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: "center",
    },
    goldText: {
        color: COLORS.gold,
    },
    financialStats: {
        gap: 12,
    },
    financialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    financialLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    financialValue: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
});
