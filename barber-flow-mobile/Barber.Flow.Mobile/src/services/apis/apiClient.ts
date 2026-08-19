import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../../store/auth.store";
import { BASE_URL } from "../../config";
import type { ApplicationUser } from "../../types/applicationUser";
import { showGlobalAlert } from "../../context/DialogContext";
import { translate } from "../../localization/i18n";

const APPLICATION_USER_STORAGE_KEY = "applicationUser";

// Thrown when a 401 survives a refresh attempt. The global "session expired"
// dialog is already shown at the point this is thrown (clearSessionOnUnauthorized),
// so callers should treat it as already-handled rather than a generic fetch failure.
export class SessionExpiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SessionExpiredError";
    }
}

// Thrown when the backend rejects a request with 403 ACCOUNT_BLOCKED. The auth store's
// isBlocked flag is already updated at the point this is thrown, so RootNavigator picks
// up the change on its next render and shows BlockedScreen — callers can treat this as
// already-handled, same as SessionExpiredError.
export class AccountBlockedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountBlockedError";
    }
}

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
    showGlobalAlert(translate("session.expiredTitle"), translate("session.expiredMessage"));
};

// Duplicates a few lines of authService.login's raw-fetch shape deliberately:
// authService.ts imports apiFetch from this module, so importing authService
// here would create a circular dependency.
let refreshPromise: Promise<ApplicationUser | null> | null = null;

const doRefresh = async (): Promise<ApplicationUser | null> => {
    const storedUser = await getStoredUser();
    if (!storedUser?.refreshToken) {
        return null;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: storedUser.refreshToken }),
        });

        if (!res.ok) {
            return null;
        }

        const data: ApplicationUser = await res.json();
        await SecureStore.setItemAsync(APPLICATION_USER_STORAGE_KEY, JSON.stringify(data));
        useAuthStore.getState().updateTokens(data.token, data.refreshToken);
        return data;
    } catch {
        return null;
    }
};

const refreshSession = (): Promise<ApplicationUser | null> => {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

const extractErrorMessage = (body: unknown, status: number): string => {
    if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;

        if (typeof record.message === "string" && record.message.trim()) {
            return record.message;
        }

        if (record.errors && typeof record.errors === "object") {
            const messages = Object.values(record.errors as Record<string, unknown>)
                .flatMap((value) => (Array.isArray(value) ? value : [value]))
                .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

            if (messages.length > 0) {
                return messages.join("\n");
            }
        }

        if (typeof record.title === "string" && record.title.trim()) {
            return record.title;
        }
    }

    return `Request failed (${status})`;
};

export type ApiFetchOptions = Omit<RequestInit, "body" | "headers"> & { json?: unknown; headers?: Record<string, string> };

export async function apiFetch(path: string, opts: ApiFetchOptions = {}, _isRetry = false): Promise<any> {
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

    if (!response.ok && response.status === 401 && !_isRetry) {
        const refreshed = await refreshSession();
        if (refreshed?.token) {
            return apiFetch(path, opts, true);
        }

        await clearSessionOnUnauthorized();
        throw new SessionExpiredError(translate("session.expiredMessage"));
    }

    if (!response.ok && response.status === 401) {
        await clearSessionOnUnauthorized();
        throw new SessionExpiredError(translate("session.expiredMessage"));
    }

    if (!response.ok && response.status === 403 && (response.body as { code?: string } | null)?.code === "ACCOUNT_BLOCKED") {
        useAuthStore.getState().setBlocked(true);
        throw new AccountBlockedError(extractErrorMessage(response.body, response.status));
    }

    if (!response.ok) {
        throw new Error(extractErrorMessage(response.body, response.status));
    }

    return response.body;
}