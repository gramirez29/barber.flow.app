import { apiFetch } from "./apis/apiClient";
import type { Appointment } from "../features/appointments/appointments.types";
import type { ClientStats } from "../types/clients";

export const clientHistoryService = {
    getHistory: async (clientId: string, page: number = 1, pageSize: number = 20): Promise<Appointment[]> => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        return apiFetch(`/api/clients/${clientId}/appointments/history?${params.toString()}`, { method: "GET" });
    },

    getStats: async (clientId: string): Promise<ClientStats> => {
        return apiFetch(`/api/clients/${clientId}/stats`, { method: "GET" });
    },

    findByPhone: async (phone: string): Promise<{ client?: any; clientName?: string; phone?: string; found: boolean }> => {
        const params = new URLSearchParams();
        params.set("phone", phone);
        return apiFetch(`/api/clients/findByPhone?${params.toString()}`, { method: "GET" });
    },
};
