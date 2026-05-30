import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { clientHistoryService } from "../../services/clientHistoryService";
import type { Appointment } from "../../features/appointments/appointments.types";
import { getErrorMessage } from "../../utils/errors";
import { useTranslation } from "../../context/LanguageContext";

const COLORS = {
    bg: "#0D0D0D",
    surface: "#1A1A1A",
    surfaceElevated: "#252525",
    gold: "#C9A84C",
    textPrimary: "#FFFFFF",
    textSecondary: "#9B9B9B",
    border: "#3A3A3A",
} as const;

const RADIUS = 14;

interface ClientAppointmentHistoryProps {
    clientId: string;
}

export const ClientAppointmentHistory: React.FC<ClientAppointmentHistoryProps> = ({
    clientId,
}) => {
    const { translateText } = useTranslation();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoading(true);
                const data = await clientHistoryService.getHistory(clientId);
                setAppointments(data);
                setError("");
            } catch (err) {
                setError(getErrorMessage(err) || "Failed to load appointment history");
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [clientId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "#4CAF50";
            case "confirmed":
                return COLORS.gold;
            case "scheduled":
                return "#2196F3";
            case "cancelled":
                return "#F44336";
            default:
                return COLORS.textSecondary;
        }
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return "N/A";
        return `₡${amount.toLocaleString("es-CR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const renderAppointmentItem = (item: Appointment) => (
        <View key={item.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>
                    {item.date} • {item.time}
                </Text>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) },
                    ]}
                >
                    <Text style={styles.statusText}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                </View>
            </View>

            {item.serviceName && (
                <Text style={styles.serviceName}>{item.serviceName}</Text>
            )}

            <View style={styles.appointmentDetails}>
                <Text style={styles.detailText}>
                    💰 {formatCurrency(item.servicePrice)}
                </Text>
                {item.paymentMethodUsed && (
                    <Text style={styles.detailText}>
                        💳 {item.paymentMethodUsed}
                    </Text>
                )}
            </View>

            {item.notes && (
                <Text style={styles.notes} numberOfLines={2}>
                    {item.notes}
                </Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.gold} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{translateText("clientHistory.title")}</Text>
            <View style={styles.listContent}>
                {appointments.length === 0 ? (
                    <Text style={styles.emptyText}>{translateText("clientHistory.noHistory")}</Text>
                ) : (
                    appointments.map((appointment) => renderAppointmentItem(appointment))
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    centerContainer: {
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    appointmentCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    appointmentDate: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    serviceName: {
        color: COLORS.gold,
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    appointmentDetails: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 8,
    },
    detailText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    notes: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontStyle: "italic",
        marginTop: 4,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: "center",
        marginTop: 32,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 16,
        textAlign: "center",
    },
});
