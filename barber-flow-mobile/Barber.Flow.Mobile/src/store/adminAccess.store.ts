import { create } from "zustand";

type AdminAccessState = {
	isSafeModeEnabled: boolean;
	setSafeModeEnabled: (value: boolean) => void;
};

// In-memory only (no persist middleware): safe mode must always start
// enabled on a fresh login, never remembered across sessions.
export const useAdminAccessStore = create<AdminAccessState>((set) => ({
	isSafeModeEnabled: true,
	setSafeModeEnabled: (value) => set({ isSafeModeEnabled: value }),
}));
