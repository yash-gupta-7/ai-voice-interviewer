import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

const STATUS_COLOR: Record<string, string> = {
  created: "text-gray-400",
  running: "text-blue-400",
  completed: "text-green-400",
  aborted: "text-red-400",
};

export default function History() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.list()
      .then(setRows)
      .catch((err) => setError(err.message || "Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this interview?")) return;
    try {
      await api.remove(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.message || "Delete failed.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Interview History</h1>
          <Link
            to="/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Interview
          </Link>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg">No interviews yet.</p>
            <Link to="/new" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
              Start your first interview →
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">{r.created_at.slice(0, 16).replace("T", " ")}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-300">{r.duration_min} min</span>
                  <span className="text-gray-600">·</span>
                  <span className={DIFFICULTY_COLOR[r.difficulty] || "text-gray-400"}>
                    {r.difficulty}
                  </span>
                </div>
                <div className={`text-xs font-semibold uppercase tracking-widest ${STATUS_COLOR[r.status] || "text-gray-400"}`}>
                  {r.status}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {r.status === "completed" && (
                  <Link
                    to={`/report/${r.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Report
                  </Link>
                )}
                <button
                  onClick={() => remove(r.id)}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
