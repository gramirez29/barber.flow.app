import React from "react";
import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { Appointment } from "../../features/appointments/appointments.types";

    interface Props {
    appointment: Appointment;
    onPress?: () => void;
    }

    export const AppointmentCard: React.FC<Props> = ({ appointment, onPress }) => (
    <Card style={styles.card} onPress={onPress}>
        <Card.Title title={appointment.clientName} subtitle={appointment.time} />
        <Card.Content>
        <Text>Phone: {appointment.phone}</Text>
        </Card.Content>
    </Card>
    );

    const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 3,
    },
    });