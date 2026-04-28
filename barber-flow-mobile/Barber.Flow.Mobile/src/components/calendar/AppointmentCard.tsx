import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Appointment } from "../../features/appointments/appointments.types";
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

interface AppointmentCardProps {
    appointment: Appointment;
    onPress?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => {
    const { translateText } = useTranslation();

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onPress}
        >
            <View style={styles.accent} />
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.clientName}>{appointment.clientName}</Text>
                    <Text style={styles.time}>{appointment.time}</Text>
                </View>
                {appointment.serviceName ? (
                    <Text style={styles.service}>{appointment.serviceName}</Text>
                ) : null}
                <Text style={styles.phone}>
                    {translateText("clients.form.phone")}: {appointment.phone}
                </Text>
                {appointment.notes ? (
                    <Text style={styles.notes}>{appointment.notes}</Text>
                ) : null}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        backgroundColor: COLORS.surfaceElevated,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 10,
        overflow: "hidden",
        shadowColor: COLORS.gold,
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
        backgroundColor: COLORS.gold,
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
        color: COLORS.textPrimary,
        flex: 1,
    },
    time: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.gold,
        marginLeft: 8,
    },
    service: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    phone: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    notes: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: "italic",
        marginTop: 4,
    },
});