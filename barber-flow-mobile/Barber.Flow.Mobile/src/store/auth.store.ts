import { create } from "zustand";
import type { ApplicationUser } from '../types/applicationUser';
import { useAdminAccessStore } from "./adminAccess.store";

type AuthState = {
	user: ApplicationUser | null;
	setUser: (user: ApplicationUser) => void;
	clearUser: () => void;
	updateTokens: (token: string, refreshToken?: string) => void;
	setBlocked: (isBlocked: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	setUser: (user) => {
		set({ user });
		// Every login (or restored session) starts with the admin safe mode
		// re-armed, so it can never be silently left unlocked from a previous session.
		useAdminAccessStore.getState().setSafeModeEnabled(true);
	},
	clearUser: () => set({ user: null }),
	// Used by a silent background token refresh — unlike setUser, this must NOT
	// re-arm admin safe mode, since the user didn't actually re-authenticate.
	updateTokens: (token, refreshToken) =>
		set((state) => (state.user ? { user: { ...state.user, token, refreshToken } } : state)),
	// Used by the blocked-status poll and by the 403 ACCOUNT_BLOCKED interceptor — same
	// rationale as updateTokens, this isn't a re-authentication so it must not touch safe mode.
	setBlocked: (isBlocked) =>
		set((state) => (state.user ? { user: { ...state.user, isBlocked } } : state)),
}));
