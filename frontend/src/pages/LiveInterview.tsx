import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { startRealtime } from "../realtime";

type Status = "connecting" | "live" | "ending" | "error";

export default function LiveInterview() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [phase, setPhase] = useState("requirements");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<null | (() => void)>(null);
  const startedAt = useRef<number>(Date.now());
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  const onError = useCallback((msg: string) => {
    console.error("[LiveInterview]", msg);
    setErrorMsg(msg);
    setStatus("error");
  }, []);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket;

    (async () => {
      try {
        // ── Step 1: Open control WebSocket (passes JWT as query param) ──
        const jwtToken = localStorage.getItem("token") || "";
        const proto = location.protocol === "https:" ? "wss" : "ws";
        ws = new WebSocket(
          `${proto}://${location.host}/api/ws/interviews/${id}/control?token=${encodeURIComponent(jwtToken)}`
        );
        wsRef.current = ws;

        // Wait for WS to open before proceeding
        await new Promise<void>((resolve, reject) => {
          ws.onopen = () => resolve();
          ws.onerror = () => reject(new Error("Control channel failed to connect"));
          ws.onclose = (e) => {
            if (e.code === 4404) reject(new Error("Interview not found (4404)"));
            if (e.code === 4401 || e.code === 4403) reject(new Error("Unauthorized (session expired)"));
          };
        });

        if (cancelled) return;

        ws.onmessage = (e) => {
          try {
            const m = JSON.parse(e.data);
            if (m.type === "state") {
              setPhase(m.phase);
              setRemaining(m.time_remaining_sec);
            }
          } catch {}
        };
        ws.onerror = () => onError("Control channel disconnected.");

        // ── Step 2: Start WebRTC — SDP proxied through our backend ──
        const rt = await startRealtime(
          id!,
          (sdpOffer) => api.exchangeSdp(id!, sdpOffer),
          (role, text) => {
            setTranscript((t) => [...t, { role, text }]);
            const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "turn", role, text, elapsed_sec: elapsed }));
            }
          },
          onError
        );

        if (cancelled) {
          rt.stop();
          return;
        }

        stopRef.current = rt.stop;
        setStatus("live");
      } catch (err: any) {
        if (!cancelled) onError(err.message || "Failed to start interview session.");
      }
    })();

    return () => {
      cancelled = true;
      stopRef.current?.();
      wsRef.current?.close();
    };
  }, [id, onError]);

  async function end() {
    if (status === "ending") return;
    setStatus("ending");
    try {
      stopRef.current?.();
      wsRef.current?.close();
      await api.complete(id!);
      nav(`/report/${id}`);
    } catch (err: any) {
      onError(`Failed to generate report: ${err.message}`);
    }
  }

  const statusColor: Record<Status, string> = {
    connecting: "text-yellow-400",
    live: "text-green-400",
    ending: "text-blue-400",
    error: "text-red-400",
  };

  const statusLabel: Record<Status, string> = {
    connecting: "Connecting…",
    live: "🎙 Live",
    ending: "Finishing…",
    error: "Error",
  };

  const mins = remaining !== null ? Math.floor(remaining / 60) : null;
  const secs = remaining !== null ? remaining % 60 : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ── Top bar ── */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Phase</span>
          <span className="font-semibold text-white capitalize">{phase.replace("_", " ")}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold ${statusColor[status]}`}>
            {statusLabel[status]}
          </span>
          {mins !== null && secs !== null && (
            <span className="text-sm text-gray-400 tabular-nums">
              {mins}:{String(secs).padStart(2, "0")} left
            </span>
          )}
          <button
            onClick={end}
            disabled={status === "connecting" || status === "ending"}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            {status === "ending" ? "Ending…" : "End Interview"}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {errorMsg && (
        <div className="bg-red-950 border-b border-red-700 text-red-300 text-sm px-6 py-3 flex gap-2">
          <span>⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Connecting overlay ── */}
      {status === "connecting" && !errorMsg && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-base font-medium">Setting up your interview…</p>
          <p className="text-sm text-gray-600">Requesting microphone • Connecting AI interviewer</p>
        </div>
      )}

      {/* ── Transcript ── */}
      {(status === "live" || status === "ending") && (
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl w-full mx-auto"
        >
          {transcript.length === 0 && (
            <p className="text-gray-600 text-sm text-center mt-16">
              The AI interviewer will speak first — listen and respond naturally.
            </p>
          )}
          {transcript.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "candidate" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  m.role === "interviewer"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {m.role === "interviewer" ? "AI" : "Me"}
              </div>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[75%] ${
                  m.role === "interviewer"
                    ? "bg-gray-800 text-gray-100 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      {status === "live" && (
        <div className="border-t border-gray-800 bg-gray-900 px-6 py-3 text-center text-xs text-gray-500">
          🎙 Microphone active — speak naturally. You can interrupt the AI anytime.
        </div>
      )}
    </div>
  );
}
