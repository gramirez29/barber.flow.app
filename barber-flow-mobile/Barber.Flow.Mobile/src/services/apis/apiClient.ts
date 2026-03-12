import { useAuthStore } from "../../store/auth.store";
import { BASE_URL } from "../../config";

export type ApiFetchOptions = Omit<RequestInit, "body" | "headers"> & { json?: any; headers?: Record<string, string> };

    export async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
    const user = useAuthStore.getState().user;
    const token = user?.token;
    const headers: Record<string, string> = { ...(opts.headers || {}) };

    if (opts.json !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const init: RequestInit = {
        method: opts.method ?? (opts.json ? "POST" : "GET"),
        ...opts,
        headers,
    };

    if (opts.json !== undefined) {
        init.body = JSON.stringify(opts.json);
    }

    const res = await fetch(`${BASE_URL}${path}`, init);

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Request failed (${res.status})`);
    }

    if (res.status === 204) return null;
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
    }