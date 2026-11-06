import axios from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export const TOKEN_KEY = 'issue-tracker-token';
export const SESSION_EXPIRED_EVENT = 'issue-tracker-session-expired';

// The backend uses Bearer tokens. Storage is accessed only in the browser.
export const tokenStorage = {
  get: () =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(TOKEN_KEY),
  set: (token: string) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;
    const isPublicAuth = ['/auth/login', '/auth/register'].includes(
      config?.url,
    );
    const sentToken = config?.headers?.Authorization;
    // A delayed response from an older session must not sign out a newer login.
    if (
      error.response?.status === 401 &&
      !isPublicAuth &&
      typeof window !== 'undefined' &&
      sentToken === `Bearer ${tokenStorage.get()}`
    ) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (!error.response)
      return 'Unable to reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
export default api;
