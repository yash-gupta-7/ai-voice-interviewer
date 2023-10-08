// Connects the BROWSER directly to OpenAI Realtime via WebRTC using the
// ephemeral token minted by our backend. Audio never touches our server.
// // TODO: confirm provider/SDK details.
export async function startRealtime(ephemeralKey: string, model: string,
                                    onTranscript: (role: string, text: string) => void) {
  const pc = new RTCPeerConnection();

  // Remote audio playback
  const audioEl = new Audio();
  audioEl.autoplay = true;
  pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

  // Mic capture
  const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  mic.getTracks().forEach((t) => pc.addTrack(t, mic));

  // Data channel for events/transcripts (barge-in handled by server VAD)
  const dc = pc.createDataChannel("oai-events");
  dc.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === "response.audio_transcript.done")
        onTranscript("interviewer", msg.transcript || "");
      if (msg.type === "conversation.item.input_audio_transcription.completed")
        onTranscript("candidate", msg.transcript || "");
    } catch {}
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const resp = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: { Authorization: `Bearer ${ephemeralKey}`, "Content-Type": "application/sdp" },
  });
  const answer = { type: "answer" as const, sdp: await resp.text() };
  await pc.setRemoteDescription(answer);
  return { pc, stop: () => { pc.close(); mic.getTracks().forEach((t) => t.stop()); } };
}
