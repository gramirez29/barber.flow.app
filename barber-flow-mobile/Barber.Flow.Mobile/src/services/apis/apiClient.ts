import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../../store/auth.store";
import { BASE_URL } from "../../config";
import type { ApplicationUser } from "../../types/applicationUser";

const APPLICATION_USER_STORAGE_KEY = "applicationUser";

const getStoredUser = async (): Promise<ApplicationUser | null> => {
    const storedUser = await SecureStore.getItemAsync(APPLICATION_USER_STORAGE_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as ApplicationUser;
    } catch {
        return null;
    }
};

const buildRequestInit = (opts: ApiFetchOptions, token?: string): RequestInit => {
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

    return init;
};

const parseResponse = async (res: Response) => {
    if (res.status === 204) {
        return null;
    }

    const text = await res.text();

    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
};

const clearSessionOnUnauthorized = async () => {
    await SecureStore.deleteItemAsync(APPLICATION_USER_STORAGE_KEY);
    useAuthStore.getState().clearUser();
};

export type ApiFetchOptions = Omit<RequestInit, "body" | "headers"> & { json?: unknown; headers?: Record<string, string> };

export async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
    const storedUser = await getStoredUser();
    const currentUser = useAuthStore.getState().user;
    const initialToken = currentUser?.token ?? storedUser?.token;

    const runRequest = async (token?: string) => {
        const res = await fetch(`${BASE_URL}${path}`, buildRequestInit(opts, token));

        if (!res.ok) {
            const body = await res.json().catch(() => null);
            return {
                body,
                ok: false as const,
                status: res.status,
            };
        }

        return {
            body: await parseResponse(res),
            ok: true as const,
            status: res.status,
        };
    };

    let response = await runRequest(initialToken);

    if (!response.ok && response.status === 401) {
        await clearSessionOnUnauthorized();
        throw new Error("Sesión expirada. Por favor vuelve a iniciar sesión.");
    }

    if (!response.ok) {
        throw new Error(response.body?.message ?? `Request failed (${response.status})`);
    }

    return response.body;
}