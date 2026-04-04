import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import {
  Button,
  Card,
  Divider,
  Text,
  ToggleButton,
} from "react-native-paper";
import { addDays, format, startOfWeek } from "date-fns";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { DrawerActions } from "@react-navigation/core";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { AppointmentCard } from "../components/calendar/AppointmentCard";
import { AppointmentModal } from "../components/calendar/AppointmentModal";
import { ScreenLayout } from "../components/ScreenLayout";
import { useTranslation } from "../context/LanguageContext";
import { useAppointmentStore } from "../features/appointments/appointment.store";
import {
  Appointment,
  AppointmentDraft,
} from "../features/appointments/appointments.types";
import { getIntlLocale } from "../localization/i18n";
import { useAppTheme } from "../theme/ThemeContext";
import type { RouteProp } from "@react-navigation/native";
import type { AppTabParamList } from "../navigation/AppNavigator";

LocaleConfig.locales.en = {
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dayNames: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  dayNamesShort: ["S", "M", "T", "W", "T", "F", "S"],
  today: "Today",
};
LocaleConfig.locales.es = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ],
  dayNamesShort: ["D", "L", "M", "M", "J", "V", "S"],
  today: "Hoy",
};
type ViewMode = "month" | "week" | "day";

const DATE_FORMAT = "yyyy-MM-dd";

const toDate = (dateString: string) => new Date(`${dateString}T12:00:00`);

const getWeekDates = (dateString: string) => {
  const startDate = startOfWeek(toDate(dateString), { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(startDate, index), DATE_FORMAT),
  );
};

const formatLongDate = (dateString: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(toDate(dateString));

const formatWeekday = (dateString: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    weekday: "narrow",
  }).format(toDate(dateString));

const formatDayNumber = (dateString: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
  }).format(toDate(dateString));

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList, "Calendar">>();
  const route = useRoute<RouteProp<AppTabParamList, "Calendar">>();
  const { theme } = useAppTheme();
  const { language, translateText } = useTranslation();
  const {
    appointments,
    addAppointment,
    getAppointmentsByDate,
    updateAppointment,
  } = useAppointmentStore();

  const today = format(new Date(), DATE_FORMAT);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const locale = getIntlLocale(language);

  useEffect(() => {
    LocaleConfig.defaultLocale = language;
  }, [language]);

  useEffect(() => {
    if (route.params?.source !== "notification") {
      return;
    }

    if (route.params.date) {
      setSelectedDate(route.params.date);
      setVisibleMonth(route.params.date);
    }

    setViewMode(route.params.initialView ?? "day");

    navigation.setParams?.({
      date: undefined,
      initialView: undefined,
      source: undefined,
    });
  }, [navigation, route.params]);

  const selectedAppointments = getAppointmentsByDate(selectedDate);
  const weekDates = getWeekDates(selectedDate);
  const weekAgenda = weekDates.map((date) => ({
    date,
    appointments: getAppointmentsByDate(date),
  }));

  const appointmentDates = new Set(appointments.map((appointment) => appointment.date));
  const datesToRender = new Set([today, selectedDate, ...appointmentDates]);
  const markedDates: Record<string, any> = {};

  datesToRender.forEach((date) => {
    const hasAppointments = appointmentDates.has(date);
    const isSelected = date === selectedDate;
    const isToday = date === today;

    markedDates[date] = {
      marked: hasAppointments,
      dotColor: theme.colors.secondary,
      customStyles: {
        container: {
          backgroundColor: isSelected
            ? theme.colors.primary
            : theme.colors.surface,
          borderColor: isToday ? theme.colors.secondary : theme.colors.border,
          borderRadius: 16,
          borderWidth: isToday ? 1 : 0,
        },
        text: {
          color: isSelected ? theme.colors.surface : theme.colors.textPrimary,
          fontWeight: isSelected || isToday ? "700" : "500",
        },
      },
    };
  });

  const openCreateModal = (date: string) => {
    setSelectedDate(date);
    setEditingAppointment(null);
    setModalVisible(true);
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    setEditingAppointment(null);
    setViewMode("day");
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedDate(appointment.date);
    setEditingAppointment(appointment);
    setModalVisible(true);
  };

  const handleSaveAppointment = (draft: AppointmentDraft) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, draft);
    } else {
      addAppointment(draft);
    }

    setEditingAppointment(null);
    setModalVisible(false);
  };

  const renderAppointmentList = (
    dayAppointments: Appointment[],
    emptyMessage: string,
  ) => {
    if (dayAppointments.length === 0) {
      return (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>{translateText("calendar.emptyTitle")}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}> 
            {emptyMessage}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listContent}>
        {dayAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onPress={() => openEditModal(appointment)}
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenLayout
      title={translateText("calendar.title")}
      backgroundColor={theme.colors.background}
      onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        keyboardOpeningTime={0}
        extraScrollHeight={Platform.OS === "android" ? 120 : 20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card
          style={[
            styles.summaryCard,
            theme.layout.shadows.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          mode="contained"
        >
          <Card.Content>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryTextBlock}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  {translateText("calendar.selectedDate")}
                </Text>
                <Text style={[styles.summaryDate, { color: theme.colors.textPrimary }]}>
                  {formatLongDate(selectedDate, locale)}
                </Text>
                <Text style={[styles.summaryCount, { color: theme.colors.textSecondary }]}>
                  {translateText(
                    selectedAppointments.length === 1
                      ? "calendar.appointmentCountForDay_one"
                      : "calendar.appointmentCountForDay_other",
                    { count: selectedAppointments.length },
                  )}
                </Text>
              </View>

              <View style={styles.summaryActions}>
                <Button mode="contained" onPress={() => openCreateModal(selectedDate)}>
                  {translateText("calendar.newAppointment")}
                </Button>
                <Button mode="text" onPress={() => setSelectedDate(today)}>
                  {translateText("common.today")}
                </Button>
              </View>
            </View>

            <ToggleButton.Row
              onValueChange={(value) => setViewMode(value as ViewMode)}
              value={viewMode}
              style={styles.toggleRow}
            >
              <ToggleButton icon="calendar-month" value="month" />
              <ToggleButton icon="calendar-week" value="week" />
              <ToggleButton icon="calendar-today" value="day" />
            </ToggleButton.Row>
          </Card.Content>
        </Card>

        {viewMode === "month" ? (
          <Card
            style={[
              styles.calendarCard,
              theme.layout.shadows.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            mode="contained"
          >
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                    {translateText("calendar.monthView")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    {formatLongDate(visibleMonth, locale)}
                  </Text>
                </View>
                <Button mode="text" onPress={() => openCreateModal(selectedDate)}>
                  {translateText("calendar.schedule")}
                </Button>
              </View>

              <Calendar
                current={selectedDate}
                markingType="custom"
                markedDates={markedDates}
                onDayPress={(day) => handleSelectDay(day.dateString)}
                onDayLongPress={(day) => openCreateModal(day.dateString)}
                onMonthChange={(month) => setVisibleMonth(month.dateString)}
                theme={{
                  backgroundColor: theme.colors.surface,
                  calendarBackground: theme.colors.surface,
                  dayTextColor: theme.colors.textPrimary,
                  monthTextColor: theme.colors.textPrimary,
                  textDisabledColor: theme.colors.textSecondary,
                  todayTextColor: theme.colors.secondary,
                  arrowColor: theme.colors.primary,
                  textSectionTitleColor: theme.colors.textSecondary,
                }}
                style={styles.calendar}
              />

              <Text style={[styles.calendarHint, { color: theme.colors.textSecondary }]}>
                {translateText("calendar.hint")}
              </Text>

              <Divider style={styles.divider} />

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                    {translateText("calendar.agendaDay")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    {formatLongDate(selectedDate, locale)}
                  </Text>
                </View>
              </View>

              {renderAppointmentList(
                selectedAppointments,
                translateText("calendar.emptyBodyMonth"),
              )}
            </Card.Content>
          </Card>
        ) : null}

        {viewMode === "week" ? (
          <Card
            style={[
              styles.calendarCard,
              theme.layout.shadows.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            mode="contained"
          >
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                    {translateText("calendar.viewWeek")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    {translateText("calendar.weekOf", { date: formatLongDate(selectedDate, locale) })}
                  </Text>
                </View>
                <Button mode="text" onPress={() => openCreateModal(selectedDate)}>
                  {translateText("calendar.schedule")}
                </Button>
              </View>

              <View style={styles.weekRow}>
                {weekAgenda.map(({ date, appointments: dayAppointments }) => {
                  const isSelected = date === selectedDate;

                  return (
                    <Pressable
                      key={date}
                      onPress={() => setSelectedDate(date)}
                      style={[
                        styles.weekDayChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isSelected
                            ? theme.colors.surface
                            : theme.colors.textSecondary,
                          fontSize: 12,
                        }}
                      >
                        {formatWeekday(date, locale)}
                      </Text>
                      <Text
                        style={{
                          color: isSelected
                            ? theme.colors.surface
                            : theme.colors.textPrimary,
                          fontSize: 18,
                          fontWeight: "700",
                        }}
                      >
                        {formatDayNumber(date, locale)}
                      </Text>
                      <Text
                        style={{
                          color: isSelected
                            ? theme.colors.surface
                            : theme.colors.textSecondary,
                          fontSize: 11,
                        }}
                      >
                        {translateText(
                          dayAppointments.length === 1
                            ? "calendar.weekSummary_one"
                            : "calendar.weekSummary_other",
                          { count: dayAppointments.length },
                        )}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Divider style={styles.divider} />

              {renderAppointmentList(
                selectedAppointments,
                translateText("calendar.emptyBodyWeek"),
              )}
            </Card.Content>
          </Card>
        ) : null}

        {viewMode === "day" ? (
          <Card
            style={[
              styles.calendarCard,
              theme.layout.shadows.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            mode="contained"
          >
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                    {translateText("calendar.viewDay")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    {formatLongDate(selectedDate, locale)}
                  </Text>
                </View>
                <Button mode="contained" onPress={() => openCreateModal(selectedDate)}>
                  {translateText("calendar.newAppointment")}
                </Button>
              </View>

              {renderAppointmentList(
                selectedAppointments,
                translateText("calendar.emptyBodyDay"),
              )}
            </Card.Content>
          </Card>
        ) : null}

        <AppointmentModal
          visible={modalVisible}
          date={selectedDate}
          editingAppointment={editingAppointment}
          onClose={() => {
            setEditingAppointment(null);
            setModalVisible(false);
          }}
          onSave={handleSaveAppointment}
        />
      </KeyboardAwareScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 16,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
  },
  summaryTopRow: {
    gap: 16,
  },
  summaryTextBlock: {
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryDate: {
    fontSize: 28,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  summaryCount: {
    fontSize: 14,
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  toggleRow: {
    marginTop: 16,
  },
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1,
  },
  calendar: {
    marginTop: 8,
  },
  calendarHint: {
    fontSize: 13,
    marginTop: 12,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "capitalize",
  },
  divider: {
    marginVertical: 20,
  },
  weekRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  weekDayChip: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  listContent: {
    marginTop: 16,
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});