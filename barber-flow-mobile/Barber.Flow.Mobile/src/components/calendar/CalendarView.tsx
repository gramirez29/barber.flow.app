import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import { useAppointmentStore } from "../../features/appointments/appointment.store";

interface CalendarViewProps {
    onDayPress: (date: string) => void 
}

export const CalendarView = ({onDayPress}: CalendarViewProps) => {
    const { appointments } = useAppointmentStore();

    const markedDates = appointments.reduce<Record<string, any>>((acc: any, app) => {
         if (!acc[app.date]){
            acc[app.date] = { marked: true, dots: [] };
         }

        acc[app.date].dots = [
            ...(acc[app.date].dots || []),
            {key: app.id, color: "#111"},
        ];

        return acc;

    }, {});

    return (
        <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(day) => onDayPress(day.dateString)}
            enableSwipeMonths
            style={{
                borderRadius: 14,
                elevation: 5,
                margin: 12
            }}
            theme={{
                backgroundColor: "#fff",
                calendarBackground: "#fff",
                textSectionTitleColor: "#777",
                selectedDayBackgroundColor: "#111",
                selectedDayTextColor: "#fff",
                todayTextColor: "#fff",
                todayBackgroundColor: "#111",
                dayTextColor: "#222",
                arrowColor: "#111",
                monthTextColor: "#111",
                textDayFontSize: 18,
                textMonthFontSize: 22,
                textDayHeaderFontSize: 14,
            }}
        />
    );
}