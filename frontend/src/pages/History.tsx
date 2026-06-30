import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Plus, Clock, Play, Trash2, FileText, Bot } from "lucide-react";

export default function History() {
  const [ivs, setIvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const load = async () => {
    try {
      const data = await api.list();
      setIvs(data);
    } catch (e: any) {
      setErr(e.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this interview?")) return;
    try {
      await api.remove(id);
      load();
    } catch (e: any) {
      alert("Failed to delete.");
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="success">Completed</Badge>;
      case "running": return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="default">Pending</Badge>;
    }
  };

  return (
    <PageWrapper className="container mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Interviews</h1>
          <p className="text-zinc-400 mt-1">Manage your past and upcoming system design interviews.</p>
        </div>
        <Button onClick={() => nav("/new")} className="gap-2">
          <Plus size={16} />
          New Interview
        </Button>
      </div>

      {err && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 text-red-400 text-sm">{err}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ivs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 text-zinc-400 mb-4 border border-white/5">
            <Bot size={32} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">No interviews yet</h3>
          <p className="text-sm text-zinc-400 max-w-sm mt-1 mb-6">
            Start your first system design mock interview to test your skills and get feedback.
          </p>
          <Button onClick={() => nav("/new")}>Start practicing now</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ivs.map((i) => (
            <Card key={i.id} className="glass-card group hover:border-zinc-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  {renderStatus(i.status)}
                  <div className="flex items-center text-xs text-zinc-500 gap-1 font-medium">
                    <Clock size={12} />
                    {i.duration_min}m
                  </div>
                </div>
                <CardTitle className="text-base truncate">
                  {i.state_json ? JSON.parse(i.state_json).jd_text?.substring(0, 40) + "..." : "System Design Interview"}
                </CardTitle>
                <CardDescription className="text-xs mt-1.5 flex items-center gap-1.5">
                  <span className="capitalize text-zinc-300">{i.difficulty}</span>
                  <span className="text-zinc-600">•</span>
                  <span>{new Date(i.created_at).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  {i.status === "completed" ? (
                    <Button size="sm" variant="secondary" onClick={() => nav(`/report/${i.id}`)} className="gap-1.5">
                      <FileText size={14} />
                      Report
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => nav(`/live/${i.id}`)} className="gap-1.5">
                      <Play size={14} />
                      Resume
                    </Button>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDel(i.id)} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                  <Trash2 size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
