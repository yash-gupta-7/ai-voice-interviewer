const BASE = "/api";

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
