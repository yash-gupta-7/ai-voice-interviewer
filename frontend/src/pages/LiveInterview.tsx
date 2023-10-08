import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { startRealtime } from "../realtime";

const MODEL = "gpt-4o-realtime-preview"; // // TODO: confirm

export default function LiveInterview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [phase, setPhase] = useState("requirements");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const stopRef = useRef<null | (() => void)>(null);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    let ws: WebSocket;
    (async () => {
      // 1) control channel
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/api/ws/interviews/${id}/control`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.type === "state") { setPhase(m.phase); setRemaining(m.time_remaining_sec); }
      };
      // 2) mint ephemeral token + connect audio DIRECT to provider
      const sess = await api.mintSession(id!);
      const key = sess.client_secret?.value || sess.client_secret;
      const rt = await startRealtime(key, MODEL, (role, text) => {
        setTranscript((t) => [...t, { role, text }]);
        const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
        ws.readyState === 1 &&
          ws.send(JSON.stringify({ type: "turn", role, text, elapsed_sec: elapsed }));
      });
      stopRef.current = rt.stop;
    })();
    return () => { stopRef.current?.(); wsRef.current?.close(); };
  }, [id]);

  async function end() {
    stopRef.current?.(); wsRef.current?.close();
    await api.complete(id!);
    nav(`/report/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-4">
      <div className="flex justify-between">
        <span className="font-semibold">Phase: {phase}</span>
        <span>{remaining !== null ? `${remaining}s left` : "…"}</span>
        <button className="bg-red-600 text-white px-3 rounded" onClick={end}>End</button>
      </div>
      <div className="border rounded p-3 h-96 overflow-y-auto space-y-2">
        {transcript.map((m, i) => (
          <div key={i}><b>{m.role}:</b> {m.text}</div>
        ))}
      </div>
      <p className="text-sm text-gray-500">Speak naturally — you can interrupt the interviewer anytime.</p>
    </div>
  );
}
