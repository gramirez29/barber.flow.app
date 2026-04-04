export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export type AppointmentPaymentMethod = "cash" | "card" | "transfer";

export const getAppointmentPaymentMethodLabel = (
    paymentMethod: AppointmentPaymentMethod,
    translateText: (key: string) => string,
) => translateText(`appointments.paymentMethods.${paymentMethod}`);

export const APPOINTMENT_PAYMENT_METHOD_OPTIONS: AppointmentPaymentMethod[] = [
    "cash",
    "card",
    "transfer",
];

export interface AppointmentDraft {
    clientName: string;
    phone: string;
    date: string;
    time: string;
    completedAt?: string;
    paymentMethodUsed?: AppointmentPaymentMethod;
    serviceName?: string;
    servicePrice?: number;
    notes?: string;
    status?: AppointmentStatus;
}

export interface Appointment extends AppointmentDraft {
    id: string;
    status: AppointmentStatus;
}