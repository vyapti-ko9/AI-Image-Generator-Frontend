import axios from "axios";

type ViteEnv = {
  VITE_API_URL?: string;
};

const envApiBase =
  (import.meta as { env: ViteEnv }).env.VITE_API_URL ?? "http://localhost:5000";

/** Base URL including `/api` (e.g. `http://localhost:5000/api`). */
export const API_BASE = envApiBase.endsWith("/api")
  ? envApiBase
  : `${envApiBase.replace(/\/$/, "")}/api`;

export const AUTH_TOKEN_KEY = "auth_token";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem(AUTH_TOKEN_KEY);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
