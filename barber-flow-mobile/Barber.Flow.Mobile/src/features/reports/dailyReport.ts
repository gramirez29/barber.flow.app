import type { Appointment, AppointmentPaymentMethod } from "../appointments/appointments.types";
import {
  APPOINTMENT_PAYMENT_METHOD_OPTIONS,
} from "../appointments/appointments.types";
import type { ReportCalculationSettings } from "../../types/settings";

export interface DailyReportPaymentBreakdown {
  appointmentCount: number;
  paymentMethod: AppointmentPaymentMethod;
  total: number;
}

export interface DailyReportSummary {
  commissionAmount: number;
  completedAppointments: Appointment[];
  fixedDailyExpense: number;
  grossRevenue: number;
  netProfit: number;
  paymentBreakdown: DailyReportPaymentBreakdown[];
  selectedDate: string;
  totalCustomersServed: number;
}

export const calculateDailyReportSummary = (
  appointments: Appointment[],
  selectedDate: string,
  settings: ReportCalculationSettings,
): DailyReportSummary => {
  const completedAppointments = appointments
    .filter(
      (appointment) =>
        appointment.date === selectedDate && appointment.status === "completed",
    )
    .sort((left, right) => left.time.localeCompare(right.time));

  const grossRevenue = completedAppointments.reduce(
    (total, appointment) => total + (appointment.servicePrice ?? 0),
    0,
  );
  const commissionAmount = grossRevenue * (settings.commissionPercentage / 100);
  const paymentBreakdown = APPOINTMENT_PAYMENT_METHOD_OPTIONS.map((paymentMethod) => {
    const paymentMethodAppointments = completedAppointments.filter(
      (appointment) => appointment.paymentMethodUsed === paymentMethod,
    );

    return {
      appointmentCount: paymentMethodAppointments.length,
      paymentMethod,
      total: paymentMethodAppointments.reduce(
        (total, appointment) => total + (appointment.servicePrice ?? 0),
        0,
      ),
    };
  });

  return {
    commissionAmount,
    completedAppointments,
    fixedDailyExpense: settings.fixedDailyExpense,
    grossRevenue,
    netProfit: grossRevenue - commissionAmount - settings.fixedDailyExpense,
    paymentBreakdown,
    selectedDate,
    totalCustomersServed: completedAppointments.length,
  };
};