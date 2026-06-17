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
import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";

const RADIUS = 14;

interface ClientAppointmentHistoryProps {
    clientId: string;
}

export const ClientAppointmentHistory: React.FC<ClientAppointmentHistoryProps> = ({
    clientId,
}) => {
    const { translateText } = useTranslation();
    const { theme } = useAppTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
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
                return theme.colors.success;
            case "confirmed":
                return theme.colors.accent;
            case "scheduled":
                return theme.colors.info || "#2196F3";
            case "cancelled":
                return theme.colors.error;
            default:
                return theme.colors.textSecondary;
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
                <ActivityIndicator size="large" color={theme.colors.accent} />
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

const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            marginTop: 16,
        },
        centerContainer: {
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
        },
        title: {
            color: theme.colors.textPrimary,
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
            backgroundColor: theme.colors.surface,
            borderRadius: RADIUS,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        appointmentHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        appointmentDate: {
            color: theme.colors.textPrimary,
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
            color: theme.colors.accent,
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
            color: theme.colors.textSecondary,
            fontSize: 14,
        },
        notes: {
            color: theme.colors.textSecondary,
            fontSize: 14,
            fontStyle: "italic",
            marginTop: 4,
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontSize: 16,
            textAlign: "center",
            marginTop: 32,
        },
        errorText: {
            color: theme.colors.error,
            fontSize: 16,
            textAlign: "center",
        },
    });
