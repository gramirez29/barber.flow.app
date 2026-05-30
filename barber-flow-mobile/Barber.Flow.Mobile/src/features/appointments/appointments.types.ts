export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export type AppointmentPaymentMethod = "cash" | "card" | "sinpeMovil" | "transfer";

export const getAppointmentPaymentMethodLabel = (
    paymentMethod: AppointmentPaymentMethod,
    translateText: (key: string) => string,
) => translateText(`appointments.paymentMethods.${paymentMethod}`);

export const APPOINTMENT_PAYMENT_METHOD_OPTIONS: AppointmentPaymentMethod[] = [
    "cash",
    "sinpeMovil",
    "card",
    "transfer",
];

export interface AppointmentDraft {
    clientName: string;
    phone: string;
    clientId?: string;
    date: string;
    time: string;
    completedAt?: string;
    paymentMethodUsed?: AppointmentPaymentMethod;
    serviceName?: string;
    servicePrice?: number;
    notes?: string;
    status?: AppointmentStatus;
    shopId?: string;
}

export interface Appointment extends AppointmentDraft {
    id: string;
    status: AppointmentStatus;
}