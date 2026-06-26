import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NewInterview() {
  const [jd, setJd] = useState("");
  const [duration, setDuration] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [save, setSave] = useState(true);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function start() {
    setError(null);
    if (!consent) {
      setError("Please consent to audio recording to continue.");
      return;
    }
    setLoading(true);
    try {
      const { id } = await api.createInterview({
        jd_text: jd,
        duration_min: duration,
        difficulty,
        save_transcript: save,
      });
      nav(`/interview/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create interview. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">New Interview</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure your mock interview session below.
          </p>
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Duration</label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
            >
              <option value={5}>5 min — Rapid Screen</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* JD textarea */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Job Description <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 h-40 resize-none"
            placeholder="Paste the JD here — the AI will tailor questions to it. Leave blank for a generic system-design interview."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-500"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
            />
            <span className="text-sm text-gray-300">Save transcript and report after this session</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-500"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span className="text-sm text-gray-300">
              I consent to audio recording and AI transcription for this session
            </span>
          </label>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={start}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? "Setting up your interview…" : "Start Interview →"}
        </button>

        <p className="text-xs text-gray-600 text-center">
          Make sure your microphone is connected and browser permission is granted.
        </p>
      </div>
    </div>
  );
}
