import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { ArrowLeft, FileCheck2, Download } from "lucide-react";

export default function Report() {
  const { id } = useParams();
  const nav = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.report(id!);
        setReport(res);
      } catch (e: any) {
        setErr(e.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // A very basic markdown renderer for the premium typography styling
  const renderMarkdownText = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-bold mt-8 mb-4 text-zinc-100">{line.replace("### ", "")}</h3>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold mt-10 mb-5 text-zinc-100 border-b border-white/10 pb-2">{line.replace("## ", "")}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-extrabold mt-12 mb-6 text-zinc-100">{line.replace("# ", "")}</h1>;
      if (line.startsWith("- ")) return <li key={i} className="ml-6 mb-2 list-disc text-zinc-300 leading-relaxed">{line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')}</li>;
      if (line.trim() === "") return <div key={i} className="h-4"></div>;
      
      // Bold text handling for paragraphs
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>');
      return <p key={i} className="mb-4 text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  return (
    <PageWrapper className="container mx-auto max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => nav("/history")} className="mb-6 -ml-4 text-zinc-400 hover:text-zinc-100">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
              <FileCheck2 className="text-primary" size={28} />
              Interview Evaluation
            </h1>
            <p className="text-zinc-400 mt-2">Comprehensive AI-generated feedback and scoring.</p>
          </div>
          <Button variant="outline" className="gap-2" disabled={loading}>
            <Download size={16} />
            Export PDF
          </Button>
        </div>
      </div>

      {err && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 text-red-400 text-sm">{err}</CardContent>
        </Card>
      )}

      <Card className="glass-card shadow-2xl shadow-black/50">
        <CardContent className="p-8 md:p-12">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-1/3 mb-8" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <div className="py-4"></div>
              <Skeleton className="h-8 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : report && report.feedback_md ? (
            <div className="prose prose-invert max-w-none">
              {renderMarkdownText(report.feedback_md)}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              <p>No report data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
