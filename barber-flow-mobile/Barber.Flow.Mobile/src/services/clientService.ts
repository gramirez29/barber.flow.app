import { apiFetch } from "../services/apis/apiClient";
import type { Client, PaginationParams } from "../types/clients";

    export const clientsService = {
    create: async (payload: Client) => {
        return apiFetch("/api/clients/create", { method: "POST", json: payload });
    },

    update: async (id: string, payload: Client) => {
        return apiFetch(`/api/clients/update/${id}`, { method: "PUT", json: payload });
    },

    delete: async (id: string) => {
        await apiFetch(`/api/clients/delete/${id}`, { method: "DELETE" });
        return;
    },

    find: async (query?: string, pagination?: PaginationParams): Promise<Client[]> => {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (pagination) {
            // Sent to backend now so the API can start consuming them when ready.
            // TODO: when backend returns PaginatedResult<Client>, update the return type here.
            params.set("page", String(pagination.page));
            params.set("pageSize", String(pagination.pageSize));
        }
        const qs = params.size > 0 ? `?${params.toString()}` : "";
        return apiFetch(`/api/clients/search${qs}`, { method: "GET" });
    },
    };