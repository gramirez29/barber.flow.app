import { create } from "zustand";
import type { ApplicationUser } from '../types/applicationUser';
import { useAdminAccessStore } from "./adminAccess.store";

type AuthState = {
	user: ApplicationUser | null;
	setUser: (user: ApplicationUser) => void;
	clearUser: () => void;
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
}));
