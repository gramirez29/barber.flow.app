export type NotificationRouteTarget = "Calendar" | "Clients";

export type NotificationType = "next-day-summary" | "delayed-client-summary";

export interface NextDaySummaryPayload {
  appointmentCount: number;
  clientNames: string[];
  date: string;
  route: "Calendar";
}

export interface DelayedClientSummaryPayload {
  clientName: string;
  daysSinceLastAppointment: number;
  lastAppointmentDate: string;
  phone?: string;
  route: "Clients";
}

export type NotificationPayload =
  | NextDaySummaryPayload
  | DelayedClientSummaryPayload;

export interface NotificationItem {
  createdAt: string;
  dismissedAt?: string;
  effectiveDate: string;
  id: string;
  isRead: boolean;
  message: string;
  payload: NotificationPayload;
  title: string;
  type: NotificationType;
}

export interface NotificationCollection {
  items: NotificationItem[];
  updatedAt: string;
}