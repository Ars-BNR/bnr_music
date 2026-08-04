import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { create } from "zustand";
import userService from "@/entities/user-service";
import { user } from "../types/auth";

export interface ArgsForAction { email: string; password: string; router: AppRouterInstance; }
export interface AuthState {
  profiles: user | null;
  isAuth: boolean;
  isLoading: boolean;
  login: (args: ArgsForAction) => Promise<void>;
  registration: (args: ArgsForAction) => Promise<void>;
  logout: (router: AppRouterInstance) => Promise<void>;
  checkAuth: (router: AppRouterInstance) => Promise<boolean>;
}

const clearSession = () => ({ profiles: null, isAuth: false });

const AuthStore = create<AuthState>((set) => ({
  ...clearSession(),
  isLoading: false,
  login: async ({ email, password, router }) => {
    set({ isLoading: true });
    try {
      const data = await userService.login(email, password);
      localStorage.setItem("token", data.accessToken);
      localStorage.removeItem("collection");
      set({ profiles: data, isAuth: true });
      router.replace("/");
    } finally { set({ isLoading: false }); }
  },
  registration: async ({ email, password, router }) => {
    set({ isLoading: true });
    try {
      const data = await userService.registration(email, password);
      localStorage.setItem("token", data.accessToken);
      localStorage.removeItem("collection");
      set({ profiles: data, isAuth: true });
      router.replace("/");
    } finally { set({ isLoading: false }); }
  },
  logout: async (router) => {
    set({ isLoading: true });
    try { await userService.logout(); } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("collection");
      set(clearSession());
      set({ isLoading: false });
      router.replace("/login");
    }
  },
  checkAuth: async (router) => {
    set({ isLoading: true });
    try {
      const data = await userService.refresh();
      localStorage.setItem("token", data.accessToken);
      localStorage.removeItem("collection");
      set({ profiles: data, isAuth: true });
      return true;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("collection");
      set(clearSession());
      router.replace("/login");
      return false;
    } finally { set({ isLoading: false }); }
  },
}));
export default AuthStore;
