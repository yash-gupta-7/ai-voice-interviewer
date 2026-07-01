import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, wsBase } from "../api";
import { AudioRecorder, playAudioBase64 } from "../realtime";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Mic, MicOff, Square, Activity, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TranscriptRow = { role: string; text: string };
type UIState = "connecting" | "idle" | "listening" | "thinking" | "speaking" | "ended";

export default function LiveInterview() {
  const { id } = useParams();
  const nav = useNavigate();

  const [uiState, setUiState] = useState<UIState>("connecting");
  const [err, setErr] = useState("");
  const [transcript, setTranscript] = useState<TranscriptRow[]>([]);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolume] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const startedAt = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  // Avoid double-triggering VAD auto-stop
  const isSendingRef = useRef(false);

  const onError = (msg: string) => {
    setErr(msg);
    setUiState("ended");
  };

  // Kick off a new listening round after the AI finishes speaking
  const startListening = () => {
    if (cancelledRef.current || !recorderRef.current) return;
    if (isSendingRef.current) return;
    setUiState("listening");
    recorderRef.current.start((b64) => {
      // VAD auto-stopped — send audio
      if (cancelledRef.current || isSendingRef.current) return;
      isSendingRef.current = true;
      setUiState("thinking");
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      wsRef.current?.send(JSON.stringify({ type: "audio_chunk", audio_b64: b64, elapsed_sec: elapsed }));
      isSendingRef.current = false;
    }).catch((e: any) => {
      console.error(e);
      if (!cancelledRef.current) setUiState("idle");
    });
  };

  useEffect(() => {
    cancelledRef.current = false;
    let volumeInterval: ReturnType<typeof setInterval> | null = null;

    try {
      startedAt.current = Date.now();
      const token = localStorage.getItem("token");
      const wsUrl = `${wsBase()}/ws/interviews/${id}/control?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      recorderRef.current = new AudioRecorder();

      ws.onopen = () => {
        // The backend immediately starts generating the AI's first greeting.
        // We set the UI to 'thinking' so the user knows the AI is preparing.
        if (!cancelledRef.current) setUiState("thinking");
      };

      ws.onmessage = async (e) => {
        if (cancelledRef.current) return;
        try {
          const data = JSON.parse(e.data);
          if (data.type === "error") {
            onError(data.message);
          } else if (data.type === "state") {
            if (data.candidate_text) {
              setTranscript((t) => [...t, { role: "candidate", text: data.candidate_text }]);
            }
          } else if (data.type === "ai_response") {
            setTranscript((t) => [...t, { role: "interviewer", text: data.text }]);
            setUiState("speaking");
            await playAudioBase64(data.audio_b64);
            // After the AI finishes speaking, auto-start listening
            if (!cancelledRef.current) {
              startListening();
            }
          }
        } catch (err) {
          console.error("WS parse error", err);
        }
      };

      ws.onerror = () => {
        if (!cancelledRef.current) onError("Control channel disconnected.");
      };
    } catch (err: any) {
      if (!cancelledRef.current) onError(err.message || "Failed to start session.");
    }

    return () => {
      cancelledRef.current = true;
      if (volumeInterval) clearInterval(volumeInterval);
      if (wsRef.current) wsRef.current.close();
      if (recorderRef.current) recorderRef.current.cancel();
    };
  }, [id]);

  // Duration timer
  useEffect(() => {
    if (uiState === "connecting" || uiState === "ended") return;
    const interval = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [uiState]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [transcript]);

  const endSession = async () => {
    if (!confirm("End the interview now?")) return;
    cancelledRef.current = true;
    if (recorderRef.current) recorderRef.current.cancel();
    if (wsRef.current) wsRef.current.close();
    setUiState("ended");
    try {
      await api.complete(id!);
      nav(`/report/${id}`);
    } catch (e: any) {
      setErr(e.message || "Failed to finalize interview");
    }
  };

  /** Manual mic toggle (override/interrupt) */
  const toggleRecording = async () => {
    if (!recorderRef.current || uiState === "ended" || uiState === "thinking" || uiState === "speaking") return;

    if (uiState === "listening") {
      // Manual stop
      setUiState("thinking");
      try {
        const b64 = await recorderRef.current.stop();
        if (!b64) { setUiState("idle"); return; }
        const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
        wsRef.current?.send(JSON.stringify({ type: "audio_chunk", audio_b64: b64, elapsed_sec: elapsed }));
      } catch (e) {
        console.error(e);
        setUiState("idle");
      }
    } else {
      // Manual start listening
      startListening();
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stateLabel: Record<UIState, string> = {
    connecting: "Connecting...",
    idle: "Ready",
    listening: "Listening...",
    thinking: "AI Thinking...",
    speaking: "AI Speaking...",
    ended: "Ended",
  };

  const isActiveState = uiState !== "connecting" && uiState !== "ended";

  return (
    <PageWrapper className="container mx-auto max-w-4xl flex flex-col h-full max-h-[calc(100vh-3.5rem)] pb-4">

      {/* Sticky Header */}
      <Card className="glass-card mb-6 flex-shrink-0 z-10 sticky top-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
              uiState === "listening"
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : uiState === "speaking"
                ? "bg-violet-500/20 text-violet-400 animate-pulse"
                : "bg-primary/20 text-primary"
            }`}>
              {uiState === "listening" ? <Mic size={20} /> : <MicOff size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Live Mock Interview</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isActiveState ? (
                  <Badge
                    variant={uiState === "listening" ? "error" : uiState === "speaking" ? "success" : "warning"}
                    className={uiState === "listening" || uiState === "speaking" ? "animate-pulse" : ""}
                  >
                    {stateLabel[uiState]}
                  </Badge>
                ) : uiState === "connecting" ? (
                  <Badge variant="warning">Connecting...</Badge>
                ) : (
                  <Badge variant="default">Ended</Badge>
                )}
                <span className="text-xs font-medium text-zinc-400 font-mono tracking-wider">
                  {formatTime(durationSec)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="danger"
            onClick={endSession}
            disabled={uiState === "ended"}
            className="gap-2"
          >
            <Square size={16} fill="currentColor" />
            End Session
          </Button>
        </div>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden relative rounded-xl border border-white/5 bg-zinc-900/30">

        {err && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-md">
              <div className="p-4 text-sm font-medium text-red-400">Error: {err}</div>
            </Card>
          </div>
        )}

        {uiState === "connecting" && !err && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-950/50 backdrop-blur-sm z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="font-medium animate-pulse">Connecting to AI Interviewer...</p>
          </div>
        )}

        {/* Chat Transcript */}
        <div ref={scrollRef} className="h-full overflow-y-auto p-6 space-y-6 scroll-smooth pb-36">
          {transcript.length === 0 && uiState === "idle" && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
              <Activity size={48} className="mb-4 text-zinc-700" />
              <p>Waiting for the AI to start the interview...</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {transcript.map((row, i) => {
              const isAI = row.role === "interviewer";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                >
                  <div className={`flex max-w-[80%] flex-col gap-1 ${isAI ? "items-start" : "items-end"}`}>
                    <span className="text-xs font-semibold tracking-wider text-zinc-500 px-1 uppercase">
                      {isAI ? "Interviewer AI" : "You"}
                    </span>
                    <div
                      className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        isAI
                          ? "bg-zinc-800/80 text-zinc-100 rounded-tl-sm border border-white/5"
                          : "bg-primary text-primary-foreground rounded-tr-sm"
                      }`}
                    >
                      {row.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Status / Action Bar */}
        {isActiveState && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent flex justify-center">
            {uiState === "thinking" ? (
              <div className="flex items-center gap-3 bg-zinc-800/80 px-6 py-3 rounded-full border border-white/10 text-sm font-medium text-zinc-300">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                AI is thinking...
              </div>
            ) : uiState === "speaking" ? (
              <div className="flex items-center gap-3 bg-violet-500/20 px-6 py-3 rounded-full border border-violet-500/30 text-sm font-medium text-violet-300">
                <Activity className="h-4 w-4 animate-pulse" />
                AI is speaking — listening starts automatically after
              </div>
            ) : uiState === "listening" ? (
              <div className="flex flex-col items-center gap-3">
                {/* Animated mic indicator */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-16 w-16 rounded-full bg-red-500/20 animate-ping" />
                  <button
                    onClick={toggleRecording}
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-colors"
                  >
                    <Mic size={26} />
                  </button>
                </div>
                <span className="text-xs text-zinc-400 font-medium">Listening — click to send early</span>
              </div>
            ) : (
              <Button
                onClick={toggleRecording}
                variant="primary"
                className="rounded-full px-8 py-6 shadow-xl hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-center gap-2">
                  <Mic size={20} />
                  <span className="font-bold text-lg">Start Speaking</span>
                </div>
              </Button>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
