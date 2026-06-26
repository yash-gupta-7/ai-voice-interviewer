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

  /** Send our WebRTC SDP offer to the backend; get back the SDP answer. */
  exchangeSdp: async (interviewId: string, sdpOffer: string): Promise<string> => {
    const res = await fetch(`${BASE}/interviews/${interviewId}/sdp`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Bearer ${token()}`,
      },
      body: sdpOffer,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`SDP exchange failed (${res.status}): ${detail}`);
    }
    return res.text(); // SDP answer
  },

  complete: (id: string) => req(`/interviews/${id}/complete`, { method: "POST" }),
  list: () => req("/interviews"),
  report: (id: string) => req(`/interviews/${id}/report`),
  remove: (id: string) => req(`/interviews/${id}`, { method: "DELETE" }),
};
