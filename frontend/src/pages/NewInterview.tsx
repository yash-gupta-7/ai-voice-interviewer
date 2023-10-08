import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NewInterview() {
  const [jd, setJd] = useState("");
  const [duration, setDuration] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [save, setSave] = useState(true);
  const [consent, setConsent] = useState(false);
  const nav = useNavigate();

  async function start() {
    if (!consent) return alert("Please consent to recording to continue.");
    const { id } = await api.createInterview({
      jd_text: jd, duration_min: duration, difficulty, save_transcript: save,
    });
    nav(`/interview/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-4">
      <h1 className="text-2xl font-bold">New interview</h1>
      <div className="flex gap-4">
        <label>Duration
          <select className="border ml-2 p-1" value={duration}
            onChange={(e) => setDuration(+e.target.value)}>
            <option value={5}>5 (Rapid screen)</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </label>
        <label>Difficulty
          <select className="border ml-2 p-1" value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>
      <textarea className="border w-full p-2 rounded h-48"
        placeholder="Paste the job description (optional — falls back to a preset)"
        value={jd} onChange={(e) => setJd(e.target.value)} />
      <label className="flex gap-2 items-center">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
        Save this interview (transcript + report)
      </label>
      <label className="flex gap-2 items-center">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I consent to audio + transcript recording for this session
      </label>
      <button className="bg-black text-white p-2 rounded" onClick={start}>Start</button>
    </div>
  );
}
