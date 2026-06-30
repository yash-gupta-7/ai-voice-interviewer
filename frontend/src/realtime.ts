// Voice Activity Detection (VAD) based AudioRecorder
// Uses Web Audio API to detect silence after speech, then auto-stops.
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: ReturnType<typeof setInterval> | null = null;

  // VAD config
  private readonly SILENCE_THRESHOLD = 10;     // RMS below this = silence
  private readonly SPEECH_THRESHOLD = 18;      // RMS above this = speech detected
  private readonly SILENCE_DURATION_MS = 1800; // ms of silence before auto-stop
  private readonly MIN_SPEECH_MS = 400;        // min ms of speech before we consider stopping

  private onStopCallback: ((b64: string) => void) | null = null;
  private speechStartedAt: number | null = null;
  private silenceStartedAt: number | null = null;
  private hasSpeech = false;

  async start(onStop?: (b64: string) => void): Promise<void> {
    this.onStopCallback = onStop || null;
    this.hasSpeech = false;
    this.speechStartedAt = null;
    this.silenceStartedAt = null;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up Web Audio API for VAD
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.start(100); // collect in 100ms chunks

      // Start VAD polling if a callback is provided
      if (onStop) {
        this._startVAD();
      }
    } catch (err) {
      throw new Error("Microphone access denied or not available.");
    }
  }

  private _getRMS(): number {
    if (!this.analyser) return 0;
    const buf = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(buf);
    const sum = buf.reduce((a, b) => a + b, 0);
    return sum / buf.length;
  }

  private _startVAD() {
    this.vadInterval = setInterval(() => {
      const rms = this._getRMS();
      const now = Date.now();

      if (rms > this.SPEECH_THRESHOLD) {
        // Speech detected
        if (!this.hasSpeech) {
          this.hasSpeech = true;
          this.speechStartedAt = now;
        }
        this.silenceStartedAt = null; // reset silence timer
      } else if (rms < this.SILENCE_THRESHOLD) {
        // Silence detected
        if (this.hasSpeech) {
          if (!this.silenceStartedAt) {
            this.silenceStartedAt = now;
          }
          const speechDuration = this.speechStartedAt ? now - this.speechStartedAt : 0;
          const silenceDuration = now - this.silenceStartedAt;

          // Auto-stop if we have enough speech followed by enough silence
          if (speechDuration > this.MIN_SPEECH_MS && silenceDuration > this.SILENCE_DURATION_MS) {
            this._autoStop();
          }
        }
      }
    }, 50);
  }

  private _autoStop() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    this._collectAndResolve().then((b64) => {
      if (this.onStopCallback) this.onStopCallback(b64);
    });
  }

  /** Manual stop — returns base64 audio string */
  async stop(): Promise<string> {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    return this._collectAndResolve();
  }

  private _collectAndResolve(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject("No active recording");

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const b64 = reader.result?.toString().split(',')[1] || "";
          resolve(b64);
        };
        this._cleanup();
      };

      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      } else {
        this._cleanup();
        resolve("");
      }
    });
  }

  private _cleanup() {
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.audioContext) this.audioContext.close();
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
  }

  cancel() {
    if (this.vadInterval) { clearInterval(this.vadInterval); this.vadInterval = null; }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") this.mediaRecorder.stop();
    this._cleanup();
  }

  get isRecording(): boolean {
    return !!(this.mediaRecorder && this.mediaRecorder.state === "recording");
  }
}

export function playAudioBase64(base64: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio("data:audio/mp3;base64," + base64);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}
