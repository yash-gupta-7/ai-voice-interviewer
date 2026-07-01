const BASE = import.meta.env.VITE_API_URL || "/api";

function token() {
  return localStorage.getItem("token") || "";
}

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText);
  return res.json();
}

/** Derive the WebSocket base URL from the API base URL */
export function wsBase(): string {
  // If API URL is absolute (e.g. https://my-backend.com/api), derive ws(s) from it
  if (BASE.startsWith("http")) {
    const url = new URL(BASE);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}${url.pathname}`;
  }
  // Relative URL — use current window location (local dev with proxy)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${BASE}`;
}

export const api = {
  /** Register a new user */
  signup: (email: string, password: string, name?: string) =>
    req("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name: name || "" }) }),

  /** Sign in with email + password */
  login: (email: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  createInterview: (b: any) => req("/interviews", { method: "POST", body: JSON.stringify(b) }),
  complete: (id: string) => req(`/interviews/${id}/complete`, { method: "POST" }),
  list: () => req("/interviews"),
  report: (id: string) => req(`/interviews/${id}/report`),
  remove: (id: string) => req(`/interviews/${id}`, { method: "DELETE" }),
};
