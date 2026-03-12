import { apiFetch } from "../services/apis/apiClient";

    export const clientsService = {
    create: async (payload: any) => {
        return apiFetch("/api/clients/create", { method: "POST", json: payload });
    },

    update: async (id: string, payload: any) => {
        return apiFetch(`/api/clients/update/${id}`, { method: "PUT", json: payload });
    },

    delete: async (id: string) => {
        await apiFetch(`/api/clients/delete/${id}`, { method: "DELETE" });
        return;
    },

    find: async (query?: string) => {
        const q = query ? `?query=${encodeURIComponent(query)}` : "";
        return apiFetch(`/api/clients/search${q}`, { method: "GET" });
    },
    };