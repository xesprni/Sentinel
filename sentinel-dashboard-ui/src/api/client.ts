import ky from "ky";
import type { Result } from "./types";

const apiClient = ky.create({
  prefix: import.meta.env.VITE_API_BASE_URL || "",
  credentials: "include",
  hooks: {
    afterResponse: [
      async (state) => {
        if (state.response.status === 401) {
          window.location.href = "/#/login";
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

export default apiClient;
