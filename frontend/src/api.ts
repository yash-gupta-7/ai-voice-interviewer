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
  login: (email: string) => req("/auth/login", { method: "POST", body: JSON.stringify({ email }) }),
  createInterview: (b: any) => req("/interviews", { method: "POST", body: JSON.stringify(b) }),
  mintSession: (id: string) => req(`/interviews/${id}/session`, { method: "POST" }),
  complete: (id: string) => req(`/interviews/${id}/complete`, { method: "POST" }),
  list: () => req("/interviews"),
  report: (id: string) => req(`/interviews/${id}/report`),
  remove: (id: string) => req(`/interviews/${id}`, { method: "DELETE" }),
};
