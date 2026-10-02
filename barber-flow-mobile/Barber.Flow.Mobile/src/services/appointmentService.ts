import { apiFetch } from "./apis/apiClient";
import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
  AppointmentPaymentMethod,
  RecurrenceFrequency,
  RecurringAppointmentsResult,
} from "../features/appointments/appointments.types";

export interface AppointmentSearchParams {
  date?: string;
  endDate?: string;
  status?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

const mapResponse = (raw: Record<string, unknown>): Appointment => ({
  id: ((raw.id ?? raw.Id) as string) ?? "",
  clientName: ((raw.clientName ?? raw.ClientName) as string) ?? "",
  phone: ((raw.phone ?? raw.Phone) as string) ?? "",
  date: ((raw.date ?? raw.Date) as string) ?? "",
  time: ((raw.time ?? raw.Time) as string) ?? "",
  status:
    ((raw.status ?? raw.Status) as AppointmentStatus | undefined) ??
    "scheduled",
  completedAt: (raw.completedAt ?? raw.CompletedAt) as string | undefined,
  paymentMethodUsed: (raw.paymentMethodUsed ??
    raw.PaymentMethodUsed) as AppointmentPaymentMethod | undefined,
  serviceName: (raw.serviceName ?? raw.ServiceName) as string | undefined,
  servicePrice: (raw.servicePrice ?? raw.ServicePrice) as number | undefined,
  notes: (raw.notes ?? raw.Notes) as string | undefined,
  seriesId: (raw.seriesId ?? raw.SeriesId) as string | undefined,
});

const mapRequest = (draft: AppointmentDraft) => ({
  ClientName: draft.clientName,
  Phone: draft.phone,
  Date: draft.date,
  Time: draft.time,
  Status: draft.status ?? "scheduled",
  CompletedAt: draft.completedAt ?? null,
  PaymentMethodUsed: draft.paymentMethodUsed ?? null,
  ServiceName: draft.serviceName ?? null,
  ServicePrice: draft.servicePrice ?? null,
  Notes: draft.notes ?? null,
});

export const appointmentService = {
  create: async (draft: AppointmentDraft): Promise<Appointment> => {
    const response = await apiFetch("/api/appointments/create", {
      method: "POST",
      json: mapRequest(draft),
    });
    return mapResponse(response);
  },

  /**
   * Creates a recurring series. How many appointments are created is decided by the backend from the
   * authenticated barber's setting (never sent by the client); colliding dates come back in `conflicts`.
   */
  createRecurring: async (
    draft: AppointmentDraft,
    frequency: RecurrenceFrequency,
  ): Promise<RecurringAppointmentsResult> => {
    const response = await apiFetch("/api/appointments/create-recurring", {
      method: "POST",
      json: { Frequency: frequency, Appointment: mapRequest(draft) },
    });
    const created = (response.created ?? response.Created ?? []) as Record<string, unknown>[];
    const conflicts = (response.conflicts ?? response.Conflicts ?? []) as Record<string, unknown>[];
    return {
      seriesId: ((response.seriesId ?? response.SeriesId) as string) ?? "",
      requestedCount: ((response.requestedCount ?? response.RequestedCount) as number) ?? created.length,
      created: created.map(mapResponse),
      conflicts: conflicts.map((c) => ({
        date: ((c.date ?? c.Date) as string) ?? "",
        time: ((c.time ?? c.Time) as string) ?? "",
      })),
    };
  },

  update: async (id: string, draft: AppointmentDraft): Promise<Appointment> => {
    const response = await apiFetch(`/api/appointments/update/${id}`, {
      method: "PUT",
      json: mapRequest(draft),
    });
    return mapResponse(response);
  },

  move: async (id: string, newDate: string, newTime?: string): Promise<Appointment> => {
    const response = await apiFetch(`/api/appointments/move/${id}`, {
      method: "PATCH",
      json: newTime ? { NewDate: newDate, NewTime: newTime } : { NewDate: newDate },
    });
    return mapResponse(response);
  },

  remove: async (id: string): Promise<void> => {
    await apiFetch(`/api/appointments/delete/${id}`, { method: "DELETE" });
  },

  find: async (params?: AppointmentSearchParams): Promise<Appointment[]> => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.status) query.set("status", params.status);
    if (params?.query) query.set("query", params.query);
    if (params?.page != null) query.set("page", String(params.page));
    if (params?.pageSize != null)
      query.set("pageSize", String(params.pageSize));
    const qs = query.toString() ? `?${query.toString()}` : "";
    const response = await apiFetch(`/api/appointments/search${qs}`, {
      method: "GET",
    });
    return Array.isArray(response) ? response.map(mapResponse) : [];
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await apiFetch(`/api/appointments/getById/${id}`, {
      method: "GET",
    });
    return mapResponse(response);
  },

  getNextId: async (): Promise<string> => {
    const response = await apiFetch("/api/appointments/nextBarberId", {
      method: "GET",
    });
    return (response?.nextId as string | undefined) ?? "";
  },
};
