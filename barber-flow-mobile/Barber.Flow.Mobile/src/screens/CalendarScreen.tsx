import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Button, ToggleButton, Text } from "react-native-paper";
import { useAppointmentStore } from "../features/appointments/appointment.store";
import { format } from "date-fns";
import { useAppTheme } from "../theme/ThemeContext";
import { Appointment } from "../features/appointments/appointments.types";
import { AppointmentModal } from "../components/calendar/AppointmentModal";
import { ScreenLayout } from "../components/ScreenLayout";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Platform } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/core";

const SCREEN_HEIGHT = Dimensions.get("window").height;

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ],
  dayNamesShort: [
    "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"
  ],
  today: "Hoy"
};
LocaleConfig.defaultLocale = "es";

type ViewMode = "month" | "week" | "day";

export const CalendarScreen: React.FC = () => {
  const { appointments } = useAppointmentStore();
  const { theme } = useAppTheme();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  // Mark days with appointments
  const markedDates = appointments.reduce(
    (acc, app) => {
      acc[app.date] = {
        marked: true,
        dotColor: theme.colors.primary,
        customStyles: {
          container: {
            backgroundColor:
              app.date === format(new Date(), "yyyy-MM-dd")
                ? theme.colors.tabActive
                : theme.colors.secondary,
          },
          text: {
            color:
              app.date === format(new Date(), "yyyy-MM-dd")
                ? theme.colors.textPrimary
                : theme.colors.textSecondary,
            fontWeight:
              app.date === format(new Date(), "yyyy-MM-dd") ? "bold" : "normal",
          },
        },
      };
      return acc;
    },
    {} as Record<string, any>,
  );

  // Add highlight for today if no appointment
  const today = format(new Date(), "yyyy-MM-dd");
  if (!markedDates[today]) {
    markedDates[today] = {
      customStyles: {
        container: { backgroundColor: theme.colors.tabActive },
        text: { color: theme.colors.textPrimary, fontWeight: "bold" },
      },
    };
  }

  // Filter appointments for selected day
  const dayAppointments = appointments.filter((a) => a.date === selectedDate);

  // Navigation handlers
  const handleMonthChange = (monthObj: { dateString: string }) => {
    setSelectedDate(monthObj.dateString);
  };

  const handleDayPress = (dayObj: { dateString: string }) => {
    setSelectedDate(dayObj.dateString);
    setViewMode("day");
    setModalVisible(true);
  };

  const handleToday = () => {
    setSelectedDate(today);
  };

  const handleSaveAppointment = (appointment: Appointment) => {
    // Integrate with store logic here
    setModalVisible(false);
  };

    const navigation = useNavigation();

  return (
    <ScreenLayout
      title="Calendario"
      backgroundColor={theme.colors.background}
      center
      onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        keyboardOpeningTime={0}
        extraScrollHeight={Platform.OS === "android" ? 120 : 20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* View Selector */}
        <View style={styles.header}>
          <ToggleButton.Row
            onValueChange={(value) => setViewMode(value as ViewMode)}
            value={viewMode}
          >
            <ToggleButton icon="calendar-month" value="month" />
            <ToggleButton icon="calendar-week" value="week" />
            <ToggleButton icon="calendar-today" value="day" />
          </ToggleButton.Row>
          <Button mode="outlined" onPress={handleToday} style={styles.todayBtn}>
            Hoy
          </Button>
        </View>

        {/* Calendar */}
        {viewMode === "month" && (
          <Calendar
            current={selectedDate}
            markingType={"custom"}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            theme={
              {
                backgroundColor: theme.colors.background,
                calendarBackground: theme.colors.background,
                textSectionTitleColor: theme.colors.textSecondary,
                selectedDayBackgroundColor: theme.colors.tabActive,
                todayTextColor: theme.colors.tabActive,
                dayTextColor: theme.colors.textPrimary,
                dotColor: theme.colors.primary,
                arrowColor: theme.colors.primary,
                "stylesheet.calendar.main": {
                  dayContainer: {
                    borderColor: "#D1D3D4",
                    borderWidth: 1,
                    flex: 1,
                  },
                  week: {
                    marginTop: 0,
                    marginBottom: 0,
                    flexDirection: "row",
                  },
                },
              } as any
            }
            style={{ flex: 1, minHeight: SCREEN_HEIGHT * 0.6 }}
          />
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <View style={styles.weekView}>
            <Text style={styles.weekLabel}>Semana de {selectedDate}</Text>
            {/* Render week grid and appointments here */}
          </View>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <View style={styles.dayView}>
            <Text style={styles.dayLabel}>Citas para {selectedDate}</Text>
            {dayAppointments.length === 0 ? (
              <Text style={styles.empty}>No hay citas</Text>
            ) : (
              dayAppointments.map((app) => (
                <View key={app.id} style={styles.appointmentCard}>
                  <Text style={styles.time}>{app.time}</Text>
                  <Text style={styles.name}>{app.clientName}</Text>
                  <Text style={styles.phone}>{app.phone}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Appointment Modal */}
        <AppointmentModal
          visible={modalVisible}
          date={selectedDate}
          editingAppointment={editingAppointment}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveAppointment}
        />
      </KeyboardAwareScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#D1D3D4",
  },
  todayBtn: { marginLeft: 8 },
  weekView: { flex: 1, padding: 16 },
  weekLabel: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  dayView: { flex: 1, padding: 16 },
  dayLabel: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#777" },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D1D3D4",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  time: { fontSize: 16, fontWeight: "700", color: "#222" },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  phone: { fontSize: 13, color: "#666", marginTop: 2 },
});