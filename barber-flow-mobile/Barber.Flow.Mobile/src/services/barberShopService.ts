import { apiFetch } from "./apis/apiClient";
import type { BarberShop, BarberShopDraft } from "../types/barberShop";

export const barberShopService = {
    create: async (payload: BarberShopDraft): Promise<BarberShop> => {
        return apiFetch("/api/barbershops/create", { method: "POST", json: payload });
    },

    update: async (id: string, payload: BarberShopDraft): Promise<BarberShop> => {
        return apiFetch(`/api/barbershops/update/${id}`, { method: "PUT", json: payload });
    },

    delete: async (id: string): Promise<void> => {
        await apiFetch(`/api/barbershops/delete/${id}`, { method: "DELETE" });
    },

    getAll: async (page: number = 1, pageSize: number = 10): Promise<BarberShop[]> => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        return apiFetch(`/api/barbershops/list?${params.toString()}`, { method: "GET" });
    },

    getById: async (id: string): Promise<BarberShop> => {
        return apiFetch(`/api/barbershops/getById/${id}`, { method: "GET" });
    },
};
