import { create } from "zustand";

type AuthState = {
  username: string | null;
  token: string | null;
  setAuth: (username: string, token: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  token: null,
  setAuth: (username, token) => set({ username, token }),
  clearAuth: () => set({ username: null, token: null }),
}));
