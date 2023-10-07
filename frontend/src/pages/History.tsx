import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function History() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.list().then(setRows).catch(() => {}); }, []);
  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-2">
      <h1 className="text-2xl font-bold">History</h1>
      {rows.map((r) => (
        <div key={r.id} className="border rounded p-2 flex justify-between">
          <span>{r.created_at.slice(0, 16)} · {r.duration_min}m · {r.difficulty} · {r.status}</span>
          <Link className="text-blue-600" to={`/report/${r.id}`}>Report</Link>
        </div>
      ))}
    </div>
  );
}
