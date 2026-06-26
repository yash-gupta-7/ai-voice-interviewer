// Connects the BROWSER directly to OpenAI Realtime via WebRTC.
// The SDP handshake is proxied through OUR backend (not directly to OpenAI),
// so the real API key never leaves the server.

export type RealtimeSession = {
  pc: RTCPeerConnection;
  stop: () => void;
};

export async function startRealtime(
  interviewId: string,
  exchangeSdp: (offer: string) => Promise<{ sdp: string; instructions: string }>,
  onTranscript: (role: string, text: string) => void,
  onError?: (err: string) => void
): Promise<RealtimeSession> {
  let sessionInstructions = "";
  // 1) Request microphone access
  let mic: MediaStream;
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    const msg = "Microphone access denied. Please allow microphone access in your browser and try again.";
    onError?.(msg);
    throw new Error(msg);
  }

  const pc = new RTCPeerConnection();

  // 2) Attach remote audio to a persistent DOM element (prevents GC)
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  audioEl.id = `oi-audio-${interviewId}`;
  document.getElementById(audioEl.id)?.remove();
  document.body.appendChild(audioEl);

  pc.ontrack = (e) => {
    if (e.streams && e.streams[0]) {
      audioEl.srcObject = e.streams[0];
    }
  };

  // 3) Add mic tracks BEFORE creating offer (required for proper SDP)
  mic.getTracks().forEach((t) => pc.addTrack(t, mic));

  // 4) Data channel for transcript events
  const dc = pc.createDataChannel("oai-events");

  dc.onopen = () => {
    console.log("[Realtime] data channel open");
    // Send session.update to strictly ground the AI instructions
    if (sessionInstructions) {
      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            instructions: sessionInstructions,
          },
        })
      );
    }
  };

  dc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      // AI interviewer transcript
      if (msg.type === "response.audio_transcript.done" && msg.transcript) {
        onTranscript("interviewer", msg.transcript);
      }
      // Candidate transcript (requires input_audio_transcription enabled)
      if (
        msg.type === "conversation.item.input_audio_transcription.completed" &&
        msg.transcript
      ) {
        onTranscript("candidate", msg.transcript);
      }
      // Log errors from OpenAI
      if (msg.type === "error") {
        console.error("[Realtime] error event:", msg);
        onError?.(`AI error: ${msg.error?.message || JSON.stringify(msg.error)}`);
      }
    } catch (err) {
      console.warn("[Realtime] failed to parse data channel message:", e.data);
    }
  };

  dc.onerror = (e) => {
    console.error("[Realtime] data channel error", e);
    onError?.("Real-time data channel error — the AI connection dropped.");
  };

  // 5) Create SDP offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  if (!offer.sdp) {
    throw new Error("Failed to create SDP offer");
  }

  // 6) Exchange SDP through our backend (which calls OpenAI)
  let sdpAnswer: string;
  try {
    const res = await exchangeSdp(offer.sdp);
    sdpAnswer = res.sdp;
    sessionInstructions = res.instructions;
  } catch (err: any) {
    onError?.(err.message || "Failed to connect to AI — check backend logs.");
    throw err;
  }

  // 7) Set remote description to complete WebRTC handshake
  await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });

  console.log("[Realtime] WebRTC connection established");

  const stop = () => {
    try {
      pc.close();
      mic.getTracks().forEach((t) => t.stop());
      document.getElementById(audioEl.id)?.remove();
    } catch {}
  };

  return { pc, stop };
}
