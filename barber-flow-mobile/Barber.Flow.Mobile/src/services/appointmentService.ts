import { apiFetch } from "./apis/apiClient";
import type {
  Appointment,
  AppointmentDraft,
  AppointmentStatus,
  AppointmentPaymentMethod,
} from "../features/appointments/appointments.types";

export interface AppointmentSearchParams {
  date?: string;
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

  update: async (id: string, draft: AppointmentDraft): Promise<Appointment> => {
    const response = await apiFetch(`/api/appointments/update/${id}`, {
      method: "PUT",
      json: mapRequest(draft),
    });
    return mapResponse(response);
  },

  move: async (id: string, newDate: string): Promise<Appointment> => {
    const response = await apiFetch(`/api/appointments/move/${id}`, {
      method: "PATCH",
      json: { NewDate: newDate },
    });
    return mapResponse(response);
  },

  remove: async (id: string): Promise<void> => {
    await apiFetch(`/api/appointments/delete/${id}`, { method: "DELETE" });
  },

  find: async (params?: AppointmentSearchParams): Promise<Appointment[]> => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
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
