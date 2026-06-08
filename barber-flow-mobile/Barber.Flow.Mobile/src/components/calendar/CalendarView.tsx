import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Appointment } from "../../features/appointments/appointments.types";
import { AppointmentCard } from "./AppointmentCard";
import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";

type ViewMode = "month" | "week" | "day";

interface CalendarViewProps {
    appointments: Appointment[];
    viewMode: ViewMode;
    onAppointmentPress?: (appointment: Appointment) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    appointments,
    viewMode: _viewMode,
    onAppointmentPress,
}) => {
    const { theme } = useAppTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);

    return (
        <ScrollView style={styles.calendarView}>
            {appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointments</Text>
            ) : (
            appointments.map((app) => (
                <AppointmentCard
                    key={app.id}
                    appointment={app}
                    onPress={() => onAppointmentPress?.(app)}
                />
            ))
            )}
        </ScrollView>
    );
};

const createStyles = (theme: AppTheme) =>
    StyleSheet.create({
    calendarView: {
        padding: 16
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: theme.colors.textSecondary,
    },
});
