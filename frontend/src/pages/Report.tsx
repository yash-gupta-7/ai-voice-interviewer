import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function Report() {
  const { id } = useParams();
  const [md, setMd] = useState("Loading report...");
  useEffect(() => { api.report(id!).then((r) => setMd(r.report_md)).catch(() => setMd("No report yet.")); }, [id]);
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <pre className="whitespace-pre-wrap font-sans">{md}</pre>
    </div>
  );
}
