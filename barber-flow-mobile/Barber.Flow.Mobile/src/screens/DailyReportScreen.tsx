import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Button, Text } from "react-native-paper";
import { FormCard } from "../components/ui/FormCard";
import { ScreenLayout } from "../components/ScreenLayout";
import { ScreenTitle } from "../components/ui/ScreenTitle";
import { APPOINTMENT_PAYMENT_METHOD_LABELS } from "../features/appointments/appointments.types";
import { useAppointmentStore } from "../features/appointments/appointment.store";
import { calculateDailyReportSummary } from "../features/reports/dailyReport";
import { settingsService } from "../services/apis/settingsService";
import { useAppTheme } from "../theme/ThemeContext";
import {
  DEFAULT_REPORT_CALCULATION_SETTINGS,
  type ReportCalculationSettings,
} from "../types/settings";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CR", {
    currency: "CRC",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);

const formatLongDate = (date: string) =>
  new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));

export const DailyReportScreen = () => {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  const appointments = useAppointmentStore((state) => state.appointments);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportSettings, setReportSettings] = useState<ReportCalculationSettings>(
    DEFAULT_REPORT_CALCULATION_SETTINGS,
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadReportSettings = async () => {
        const nextSettings = await settingsService.getReportCalculationSettings();

        if (active) {
          setReportSettings(nextSettings);
        }
      };

      void loadReportSettings();

      return () => {
        active = false;
      };
    }, []),
  );

  const report = useMemo(
    () => calculateDailyReportSummary(appointments, selectedDate, reportSettings),
    [appointments, reportSettings, selectedDate],
  );

  const metricCards = [
    { label: "Customers served", value: String(report.totalCustomersServed) },
    { label: "Gross revenue", value: formatCurrency(report.grossRevenue) },
    { label: "Net profit", value: formatCurrency(report.netProfit) },
  ];

  return (
    <ScreenLayout
      title="Daily Closure"
      backgroundColor={theme.colors.background}
      onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FormCard style={styles.heroCard}>
          <ScreenTitle
            eyebrow="Shop owner summary"
            size="lg"
            subtitle="Track completed services, collected sales, and actual daily profit from one operational report."
            title="Daily closure report"
          />

          <View style={styles.heroActions}>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={[
                styles.dateSelector,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.dateSelectorLabel, { color: theme.colors.textSecondary }]}>Selected day</Text>
              <Text style={[styles.dateSelectorValue, { color: theme.colors.textPrimary }]}> 
                {formatLongDate(selectedDate)}
              </Text>
            </Pressable>

            <View style={styles.heroButtons}>
              <Button mode="contained" onPress={() => setDatePickerVisible(true)}>
                Change day
              </Button>
              <Button mode="text" onPress={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
                Today
              </Button>
            </View>
          </View>

          <View style={styles.formulaRow}>
            <View style={[styles.formulaPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.formulaLabel, { color: theme.colors.textSecondary }]}>Commission</Text>
              <Text style={[styles.formulaValue, { color: theme.colors.textPrimary }]}>{reportSettings.commissionPercentage}%</Text>
            </View>
            <View style={[styles.formulaPill, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.formulaLabel, { color: theme.colors.textSecondary }]}>Daily expense</Text>
              <Text style={[styles.formulaValue, { color: theme.colors.textPrimary }]}>{formatCurrency(reportSettings.fixedDailyExpense)}</Text>
            </View>
          </View>
        </FormCard>

        <View style={styles.metricsGrid}>
          {metricCards.map((card) => (
            <View
              key={card.label}
              style={[
                styles.metricCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                theme.layout.shadows.card,
              ]}
            >
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{card.label}</Text>
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{card.value}</Text>
            </View>
          ))}
        </View>

        <FormCard>
          <ScreenTitle
            eyebrow="Profit formula"
            size="sm"
            subtitle="Net profit = gross revenue - barber commission - fixed daily expense"
            title="Daily earnings"
          />

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Commission amount</Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.textPrimary }]}>{formatCurrency(report.commissionAmount)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Fixed daily expense</Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.textPrimary }]}>{formatCurrency(report.fixedDailyExpense)}</Text>
            </View>
          </View>
        </FormCard>

        <FormCard>
          <ScreenTitle
            eyebrow="Collections"
            size="sm"
            subtitle="Review how the day's completed sales were paid to reconcile the cash drawer and digital collections."
            title="Payment method breakdown"
          />

          <View style={styles.paymentList}>
            {report.paymentBreakdown.map((item) => (
              <View
                key={item.paymentMethod}
                style={[
                  styles.paymentRow,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View>
                  <Text style={[styles.paymentMethod, { color: theme.colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.paymentMeta, { color: theme.colors.textSecondary }]}> 
                    {item.appointmentCount} completed appointment{item.appointmentCount === 1 ? "" : "s"}
                  </Text>
                </View>
                <Text style={[styles.paymentTotal, { color: theme.colors.textPrimary }]}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        </FormCard>

        <FormCard>
          <ScreenTitle
            eyebrow="Attendance"
            size="sm"
            subtitle="Detailed ledger of the completed clients counted in this closure."
            title="Completed appointments"
          />

          {report.completedAppointments.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No completed appointments</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Mark appointments as completed in Calendar to include them in the daily closure report.</Text>
            </View>
          ) : (
            <View style={styles.ledgerList}>
              {report.completedAppointments.map((appointment) => (
                <View
                  key={appointment.id}
                  style={[
                    styles.ledgerRow,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.ledgerCopy}>
                    <Text style={[styles.ledgerTitle, { color: theme.colors.textPrimary }]}>{appointment.clientName}</Text>
                    <Text style={[styles.ledgerMeta, { color: theme.colors.textSecondary }]}> 
                      {appointment.time} • {appointment.serviceName ?? "General service"}
                    </Text>
                    <Text style={[styles.ledgerMeta, { color: theme.colors.textSecondary }]}> 
                      {appointment.paymentMethodUsed
                        ? APPOINTMENT_PAYMENT_METHOD_LABELS[appointment.paymentMethodUsed]
                        : "Payment method not set"}
                    </Text>
                  </View>
                  <Text style={[styles.ledgerAmount, { color: theme.colors.textPrimary }]}>{formatCurrency(appointment.servicePrice ?? 0)}</Text>
                </View>
              ))}
            </View>
          )}
        </FormCard>
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={new Date(`${selectedDate}T12:00:00`)}
        onConfirm={(nextDate) => {
          setSelectedDate(format(nextDate, "yyyy-MM-dd"));
          setDatePickerVisible(false);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 32,
    paddingTop: 18,
  },
  heroCard: {
    gap: 18,
  },
  heroActions: {
    gap: 12,
  },
  dateSelector: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateSelectorLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  dateSelectorValue: {
    fontSize: 18,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  heroButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formulaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  formulaPill: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formulaLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  formulaValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    borderRadius: 22,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  breakdownItem: {
    flex: 1,
    minWidth: 150,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  paymentList: {
    gap: 10,
    marginTop: 16,
  },
  paymentRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  paymentMethod: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  paymentMeta: {
    fontSize: 13,
  },
  paymentTotal: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  ledgerList: {
    gap: 10,
    marginTop: 16,
  },
  ledgerRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  ledgerCopy: {
    flex: 1,
  },
  ledgerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  ledgerMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});