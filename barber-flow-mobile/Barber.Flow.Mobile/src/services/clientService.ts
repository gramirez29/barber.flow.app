// copy the BASE_URL pattern used in authService
// const BASE_URL = __DEV__ ? 'https://localhost:7016' : 'https://barberflowapp-develop.up.railway.app/';
const BASE_URL = "https://barberflowapp-develop.up.railway.app";

export const clientsService = {
create: async (payload: any) => {
    const res = await fetch(`${BASE_URL}/api/clients/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Create client failed");
    }
    return res.json();
},

update: async (id: string, payload: any) => {
    const res = await fetch(`${BASE_URL}/api/clients/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Update client failed");
    }
    return res.json();
},

delete: async (id: string) => {
    const res = await fetch(`${BASE_URL}/api/clients/delete/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Delete client failed");
    }
    return;
},

find: async (query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const res = await fetch(`${BASE_URL}/api/clients/search${q}`, { method: "GET" });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Fetch clients failed");
    }
    return res.json();
},
};
