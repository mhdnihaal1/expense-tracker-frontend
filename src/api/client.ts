import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The deployed API on Render, used by production builds (Vercel web, release apps).
const PRODUCTION_API_URL = 'https://expense-tracker-backend.onrender.com/api';

// Resolve the API URL: explicit env var, else the deployed API in production builds,
// else the same host that serves the Expo bundle (simulators, emulators, Expo Go on the same Wi-Fi).
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (!__DEV__) return PRODUCTION_API_URL;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:4000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api';
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type Query = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, query?: Query) {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_URL}${path}${params ? `?${params}` : ''}`;
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  { body, query, raw }: { body?: unknown; query?: Query; raw?: boolean } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Can't reach the server at ${API_URL}. Is the backend running?`);
  }

  if (res.status === 401 && authToken) onUnauthorized?.();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`, data.fields);
  }
  if (res.status === 204) return undefined as T;
  return (raw ? res.text() : res.json()) as Promise<T>;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: (path: string, query?: Query) => request<void>('DELETE', path, { query }),
  text: (path: string, query?: Query) => request<string>('GET', path, { query, raw: true }),
};

// Local timezone offset so the server computes month/day boundaries in the user's calendar.
export const tz = () => ({ tzOffset: new Date().getTimezoneOffset() });
