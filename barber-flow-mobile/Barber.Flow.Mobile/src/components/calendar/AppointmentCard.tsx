import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Appointment } from "../../features/appointments/appointments.types";
import { useTranslation } from "../../context/LanguageContext";
import { useAppTheme } from "../../theme/ThemeContext";

interface AppointmentCardProps {
    appointment: Appointment;
    onPress?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => {
    const { translateText } = useTranslation();
    const { theme } = useAppTheme();

    const statusColors: Record<Appointment["status"], string> = {
        completed: "#10B981",
        confirmed: theme.colors.accent,
        scheduled: "#3B82F6",
        cancelled: theme.colors.error,
    };
    const statusColor = statusColors[appointment.status] ?? theme.colors.textSecondary;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    shadowColor: theme.colors.accent,
                },
                pressed && styles.cardPressed
            ]}
            onPress={onPress}
        >
            <View style={[styles.accent, { backgroundColor: theme.colors.accent }]} />
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.clientName, { color: theme.colors.textPrimary }]}>{appointment.clientName}</Text>
                    <Text style={[styles.time, { color: theme.colors.accent }]}>{appointment.time}</Text>
                </View>
                <View style={[styles.badge, { borderColor: statusColor, backgroundColor: `${statusColor}22` }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                        {translateText(`calendar.appointmentModal.statuses.${appointment.status}`)}
                    </Text>
                </View>
                {appointment.serviceName ? (
                    <Text style={[styles.service, { color: theme.colors.textSecondary }]}>{appointment.serviceName}</Text>
                ) : null}
                <Text style={[styles.phone, { color: theme.colors.textSecondary }]}>
                    {translateText("clients.form.phone")}: {appointment.phone}
                </Text>
                {appointment.notes ? (
                    <Text style={[styles.notes, { color: theme.colors.textSecondary }]}>{appointment.notes}</Text>
                ) : null}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
        overflow: "hidden",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    cardPressed: {
        opacity: 0.75,
    },
    accent: {
        width: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    clientName: {
        fontSize: 15,
        fontWeight: "700",
        flex: 1,
    },
    time: {
        fontSize: 13,
        fontWeight: "700",
        marginLeft: 8,
    },
    badge: {
        alignSelf: "flex-start",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    service: {
        fontSize: 13,
        fontWeight: "500",
    },
    phone: {
        fontSize: 12,
    },
    notes: {
        fontSize: 12,
        fontStyle: "italic",
        marginTop: 4,
    },
});