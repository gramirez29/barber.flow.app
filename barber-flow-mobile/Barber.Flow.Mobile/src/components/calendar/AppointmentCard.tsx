import React from "react";
import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { Appointment } from "../../features/appointments/appointments.types";
import { useTranslation } from "../../context/LanguageContext";

interface AppointmentCardProps {
    appointment: Appointment;
    onPress?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => {
    const { translateText } = useTranslation();

    return (
    <Card style={styles.card} onPress={onPress} mode="contained">
        <Card.Title
        title={appointment.clientName}
        subtitle={
            appointment.serviceName
            ? `${appointment.time} • ${appointment.serviceName}`
            : appointment.time
        }
    />
        <Card.Content>
            <Text>
            {translateText("clients.form.phone")}: {appointment.phone}
            </Text>
            {appointment.notes ? (
            <Text style={styles.notes}>{appointment.notes}</Text>
            ) : null}
        </Card.Content>
    </Card>
);
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 3,
    },
    notes: {
        marginTop: 8,
    },
});