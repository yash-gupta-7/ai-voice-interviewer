import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

// Simple markdown renderer for the report
function RenderMd({ md }: { md: string }) {
  const lines = md.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return <h1 key={i} className="text-2xl font-bold text-white mt-4">{line.slice(2)}</h1>;
        if (line.startsWith("## "))
          return <h2 key={i} className="text-lg font-semibold text-blue-400 mt-4 border-b border-gray-800 pb-1">{line.slice(3)}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} className="text-base font-semibold text-gray-200 mt-3">{line.slice(4)}</h3>;
        if (line.startsWith("- "))
          return <li key={i} className="text-gray-300 text-sm ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="text-white font-semibold text-sm">{line.slice(2, -2)}</p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-gray-300 text-sm">{line}</p>;
      })}
    </div>
  );
}

export default function Report() {
  const { id } = useParams();
  const [md, setMd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.report(id!)
      .then((r) => setMd(r.report_md))
      .catch((err) => setError(err.message || "No report found."));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Interview Report</h1>
          <Link to="/history" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to History
          </Link>
        </div>

        {!md && !error && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            Loading report…
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {md && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <RenderMd md={md} />
          </div>
        )}
      </div>
    </div>
  );
}
