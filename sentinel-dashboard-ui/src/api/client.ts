import ky from "ky";
import type { Result } from "./types";

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

const apiClient = ky.create({
  ...(apiBaseUrl ? { prefixUrl: apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/` } : {}),
  credentials: "include",
  hooks: {
    afterResponse: [
      async (state) => {
        if (state.response.status === 401) {
          window.location.hash = "#/login";
          return new Response(JSON.stringify({ success: false, msg: "Unauthorized" }), {
            status: 401,
          });
        }
        return state.response;
      },
    ],
  },
});

export async function get<T>(url: string, searchParams?: Record<string, string | number | boolean>): Promise<Result<T>> {
  return apiClient.get(url, { searchParams }).json<Result<T>>();
}

export async function post<T>(url: string, json?: unknown): Promise<Result<T>> {
  return apiClient.post(url, { json }).json<Result<T>>();
}

export async function put<T>(url: string, json?: unknown): Promise<Result<T>> {
  return apiClient.put(url, { json }).json<Result<T>>();
}

export async function del<T>(url: string, searchParams?: Record<string, string | number | boolean>): Promise<Result<T>> {
  return apiClient.delete(url, { searchParams }).json<Result<T>>();
}

export async function postWithParams<T>(url: string, searchParams?: Record<string, string | number | boolean>): Promise<Result<T>> {
  return apiClient.post(url, { searchParams }).json<Result<T>>();
}

export async function putWithParams<T>(url: string, searchParams?: Record<string, string | number | boolean>): Promise<Result<T>> {
  return apiClient.put(url, { searchParams }).json<Result<T>>();
}

export default apiClient;
