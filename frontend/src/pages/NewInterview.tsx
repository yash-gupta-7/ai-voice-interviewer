import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { ArrowRight, Briefcase } from "lucide-react";

export default function NewInterview() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    jd_text: "",
    duration_min: 15,
    difficulty: "medium",
    save_transcript: true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jd_text.trim()) {
      setErr("Job description is required.");
      return;
    }
    
    setLoading(true);
    setErr("");
    try {
      const res = await api.createInterview(form);
      nav(`/live/${res.id}`);
    } catch (e: any) {
      setErr(e.message || "Failed to create");
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="container mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Configure Interview</h1>
        <p className="text-zinc-400 mt-1">Set up the parameters for your mock system design interview.</p>
      </div>

      <form onSubmit={submit}>
        <Card className="glass-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 text-zinc-100 mb-1">
              <Briefcase size={18} className="text-primary" />
              <CardTitle>Role Details</CardTitle>
            </div>
            <CardDescription>
              Paste the job description or role requirements. The AI will extract key skills to test you on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.jd_text}
              onChange={(e) => setForm({ ...form, jd_text: e.target.value })}
              placeholder="e.g. We are looking for a Senior Backend Engineer with experience in distributed systems, microservices, Kafka, and Redis..."
              className="min-h-[160px] text-base"
              autoFocus
            />
            {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Difficulty Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy (Junior)</option>
                <option value="medium">Medium (Mid-level)</option>
                <option value="hard">Hard (Senior/Staff)</option>
              </Select>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="5"
                  max="60"
                  value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 15 })}
                />
                <span className="text-sm text-zinc-400 font-medium w-16">minutes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => nav("/history")}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="gap-2">
            Start Interview
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}
