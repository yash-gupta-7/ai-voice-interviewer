import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit() {
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { token } = await api.login(email);
      localStorage.setItem("token", token);
      nav("/new");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">AI Voice Interviewer</h1>
          <p className="text-gray-400 text-sm">Enter your email to start practicing</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={loading}
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={submit}
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Signing in…" : "Continue →"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          No password needed — magic-link style auth.
        </p>
      </div>
    </div>
  );
}
