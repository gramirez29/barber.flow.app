import AsyncStorage from "@react-native-async-storage/async-storage";
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import type { Appointment } from "../features/appointments/appointments.types";
import type {
  DelayedClientSummaryPayload,
  NextDaySummaryPayload,
  NotificationCollection,
  NotificationItem,
} from "../types/notifications";

const NOTIFICATIONS_STORAGE_KEY = "barber-flow-notifications";
const DELAYED_CLIENT_THRESHOLD_DAYS = 30;

type ClientHistory = {
  clientKey: string;
  clientName: string;
  phone?: string;
  dates: string[];
  hasFutureAppointment: boolean;
  lastPastDate?: string;
};

const buildNextDaySummaryId = (date: string) => `next-day-summary:${date}`;

const buildDelayedClientId = (clientKey: string) => `delayed-client-summary:${clientKey}`;

const createClientKey = (clientName: string, phone?: string) => {
  const normalizedName = clientName.trim().toLowerCase().replace(/\s+/g, "-");
  const normalizedPhone = phone?.replace(/\D+/g, "") || "no-phone";
  return `${normalizedName}:${normalizedPhone}`;
};

const isScheduledAppointment = (appointment: Appointment) =>
  appointment.status !== "cancelled";

const sortNotifications = (items: NotificationItem[]) =>
  [...items].sort((left, right) => {
    if (left.effectiveDate === right.effectiveDate) {
      return left.title.localeCompare(right.title);
    }

    return right.effectiveDate.localeCompare(left.effectiveDate);
  });

const buildNextDaySummary = (
  appointments: Appointment[],
  date: string,
  existing?: NotificationItem,
): NotificationItem | null => {
  const tomorrowAppointments = appointments.filter(
    (appointment) => isScheduledAppointment(appointment) && appointment.date === date,
  );

  if (tomorrowAppointments.length === 0) {
    return null;
  }

  const clientNames = Array.from(
    new Set(
      tomorrowAppointments
        .map((appointment) => appointment.clientName.trim())
        .filter(Boolean),
    ),
  );

  const payload: NextDaySummaryPayload = {
    appointmentCount: tomorrowAppointments.length,
    clientNames,
    date,
    route: "Calendar",
  };

  return {
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    dismissedAt: existing?.dismissedAt,
    effectiveDate: date,
    id: buildNextDaySummaryId(date),
    isRead: existing?.isRead ?? false,
    message:
      tomorrowAppointments.length === 1
        ? `You have 1 appointment scheduled for tomorrow with ${clientNames[0] ?? "a client"}.`
        : `You have ${tomorrowAppointments.length} appointments scheduled for tomorrow.`,
    payload,
    title: "Tomorrow's agenda",
    type: "next-day-summary",
  };
};

const buildClientHistories = (
  appointments: Appointment[],
  today: Date,
): ClientHistory[] => {
  const historyMap = new Map<string, ClientHistory>();
  const todayKey = format(today, "yyyy-MM-dd");

  appointments
    .filter(isScheduledAppointment)
    .forEach((appointment) => {
      const clientName = appointment.clientName.trim();

      if (!clientName) {
        return;
      }

      const clientKey = createClientKey(clientName, appointment.phone);
      const current = historyMap.get(clientKey) ?? {
        clientKey,
        clientName,
        dates: [],
        hasFutureAppointment: false,
        phone: appointment.phone,
      };

      current.dates.push(appointment.date);
      current.hasFutureAppointment = current.hasFutureAppointment || appointment.date > todayKey;

      if (appointment.date <= todayKey) {
        current.lastPastDate =
          !current.lastPastDate || appointment.date > current.lastPastDate
            ? appointment.date
            : current.lastPastDate;
      }

      historyMap.set(clientKey, current);
    });

  return Array.from(historyMap.values());
};

const buildDelayedClientSummaries = (
  appointments: Appointment[],
  today: Date,
  existingItems: Map<string, NotificationItem>,
) => {
  const histories = buildClientHistories(appointments, today);
  const results: NotificationItem[] = [];

  histories.forEach((history) => {
    if (!history.lastPastDate || history.hasFutureAppointment) {
      return;
    }

    const lastAppointment = parseISO(history.lastPastDate);
    const daysSinceLastAppointment = differenceInCalendarDays(startOfDay(today), lastAppointment);

    if (daysSinceLastAppointment < DELAYED_CLIENT_THRESHOLD_DAYS) {
      return;
    }

    const id = buildDelayedClientId(history.clientKey);
    const existing = existingItems.get(id);
    const payload: DelayedClientSummaryPayload = {
      clientName: history.clientName,
      daysSinceLastAppointment,
      lastAppointmentDate: history.lastPastDate,
      phone: history.phone,
      route: "Clients",
    };

    results.push({
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      dismissedAt: existing?.dismissedAt,
      effectiveDate: history.lastPastDate,
      id,
      isRead: existing?.isRead ?? false,
      message: `${history.clientName} has not visited in ${daysSinceLastAppointment} days.`,
      payload,
      title: "Client follow-up needed",
      type: "delayed-client-summary",
    });
  });

  return results;
};

const mergeNotificationState = (
  derivedItems: NotificationItem[],
  existingItems: NotificationItem[],
) => {
  const existingMap = new Map(existingItems.map((item) => [item.id, item]));

  return derivedItems.map((item) => {
    const existing = existingMap.get(item.id);

    if (!existing) {
      return item;
    }

    return {
      ...item,
      createdAt: existing.createdAt,
      dismissedAt: existing.dismissedAt,
      isRead: existing.isRead,
    };
  });
};

export const getNotificationDisplayText = (
  item: NotificationItem,
  translateText: (key: string, options?: Record<string, string | number>) => string,
) => {
  if (item.type === "next-day-summary") {
    const payload = item.payload as NextDaySummaryPayload;
    return {
      message:
        payload.appointmentCount === 1
          ? translateText("notifications.tomorrowMessageOne", {
              name: payload.clientNames[0] ?? "a client",
            })
          : translateText("notifications.tomorrowMessageOther", {
              count: payload.appointmentCount,
            }),
      title: translateText("notifications.tomorrowTitle"),
    };
  }

  const payload = item.payload as DelayedClientSummaryPayload;
  return {
    message: translateText("notifications.delayedClientMessage", {
      days: payload.daysSinceLastAppointment,
      name: payload.clientName,
    }),
    title: translateText("notifications.delayedClientsTitle"),
  };
};

export const notificationService = {
  async getStoredCollection(): Promise<NotificationCollection> {
    const rawValue = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

    if (!rawValue) {
      return { items: [], updatedAt: new Date(0).toISOString() };
    }

    return JSON.parse(rawValue) as NotificationCollection;
  },

  async refreshNotifications(
    appointments: Appointment[],
    now = new Date(),
  ): Promise<NotificationCollection> {
    const existingCollection = await notificationService.getStoredCollection();
    const tomorrowDate = format(addDays(startOfDay(now), 1), "yyyy-MM-dd");
    const existingItemsMap = new Map(
      existingCollection.items.map((item) => [item.id, item]),
    );

    const nextDaySummary = buildNextDaySummary(
      appointments,
      tomorrowDate,
      existingItemsMap.get(buildNextDaySummaryId(tomorrowDate)),
    );

    const delayedClientItems = buildDelayedClientSummaries(
      appointments,
      startOfDay(now),
      existingItemsMap,
    );

    const derivedItems = [
      ...(nextDaySummary ? [nextDaySummary] : []),
      ...delayedClientItems,
    ];

    const items = sortNotifications(
      mergeNotificationState(derivedItems, existingCollection.items),
    );

    const nextCollection: NotificationCollection = {
      items,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(nextCollection),
    );

    return nextCollection;
  },

  async markAllAsRead(items: NotificationItem[]) {
    const collection = await notificationService.getStoredCollection();
    const ids = new Set(items.map((item) => item.id));
    const nextCollection: NotificationCollection = {
      items: collection.items.map((item) =>
        ids.has(item.id) ? { ...item, isRead: true } : item,
      ),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(nextCollection),
    );

    return nextCollection;
  },

  async markAsRead(notificationId: string) {
    const collection = await notificationService.getStoredCollection();
    const nextCollection: NotificationCollection = {
      items: collection.items.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(nextCollection),
    );

    return nextCollection;
  },

  async dismissNotification(notificationId: string) {
    const collection = await notificationService.getStoredCollection();
    const dismissedAt = new Date().toISOString();
    const nextCollection: NotificationCollection = {
      items: collection.items.map((item) =>
        item.id === notificationId ? { ...item, dismissedAt, isRead: true } : item,
      ),
      updatedAt: dismissedAt,
    };

    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(nextCollection),
    );

    return nextCollection;
  },
};