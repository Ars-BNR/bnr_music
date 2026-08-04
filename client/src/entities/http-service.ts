import axios, { InternalAxiosRequestConfig } from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8340";

const $api = axios.create({ withCredentials: true, baseURL: API_URL });

$api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest: Promise<string> | null = null;
$api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!request || error.response?.status !== 401 || request._retry || request.url?.includes("/refresh")) {
      return Promise.reject(error);
    }
    request._retry = true;
    refreshRequest ??= axios.post<{ accessToken: string }>(`${API_URL}/refresh`, undefined, { withCredentials: true })
      .then((response) => response.data.accessToken)
      .finally(() => { refreshRequest = null; });
    try {
      const token = await refreshRequest;
      localStorage.setItem("token", token);
      request.headers.Authorization = `Bearer ${token}`;
      return $api.request(request);
    } catch (refreshError) {
      localStorage.removeItem("token");
      return Promise.reject(refreshError);
    }
  },
);

export default $api;
