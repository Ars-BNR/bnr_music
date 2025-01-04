import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { user } from "../types/auth";
import { create } from "zustand";
import userService from "@/entities/user-service";

export interface ArgsForAction {
  email: string;
  password: string;
  router: AppRouterInstance;
}
export interface AuthState {
  profiles: user;
  isAuth: boolean;
  isLoading: boolean;
  login: (args: ArgsForAction) => Promise<void>;
  registration: (args: ArgsForAction) => Promise<void>;
  logout: (router: AppRouterInstance) => Promise<void>;
  checkAuth: (router: AppRouterInstance) => Promise<void>;
}

const AuthStore = create<AuthState>((set) => ({
  profiles: {
    accessToken: "",
    user: {},
    refreshToken: "",
  },
  isAuth: false,
  isLoading: false,

  login: async ({ email, password, router }) => {
    try {
      set({ isLoading: true });
      const data = await userService.login(email, password);
      localStorage.setItem("token", data.accessToken);
      set({ profiles: data, isAuth: true });
      router.replace("/");
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  registration: async ({ email, password, router }) => {
    try {
      set({ isLoading: true });
      const data = await userService.registration(email, password);
      localStorage.setItem("token", data.accessToken);
      set({ profiles: data, isAuth: true });
      router.replace("/");
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async (router) => {
    try {
      set({ isLoading: true });
      await userService.logout();
      localStorage.removeItem("token");
      set({
        profiles: {
          accessToken: "",
          user: {},
          refreshToken: "",
        },
        isAuth: false,
      });
      router.replace("/login");
    } catch (error) {
      console.log("error", error);
    } finally {
      set({ isLoading: false });
    }
  },
  checkAuth: async (router) => {
    try {
      set({ isLoading: true });
      const data = await userService.refresh();
      localStorage.setItem("token", data.accessToken);
      set({ profiles: data, isAuth: true });
      if (!data) {
        router.replace("/login");
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
export default AuthStore;
