import { create } from "zustand";
import type { ApplicationUser } from '../types/applicationUser';

type AuthState = {
  user: ApplicationUser | null;
  setUser: (user: ApplicationUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
