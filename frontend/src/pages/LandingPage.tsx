import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Mic2, Zap, BarChart3, Shield, CheckCircle2, ArrowRight,
  Star, Brain, Target, Clock
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Interviews",
    desc: "Our AI conducts real system design interviews with dynamic follow-up questions tailored to your job description.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Mic2,
    title: "Real-Time Voice Conversation",
    desc: "Speak naturally — our Voice Activity Detection listens automatically and responds without any button clicks.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Detailed Performance Reports",
    desc: "Get rubric-based feedback on every dimension: system design, communication, scalability thinking, and more.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Target,
    title: "JD-Matched Questions",
    desc: "Paste a job description and our AI extracts the key skills to focus your interview session.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Clock,
    title: "Flexible Sessions",
    desc: "Choose 5, 10, or 15 minute sessions. Practice during lunch breaks or do deep-dives on weekends.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Your transcripts are encrypted and you control exactly what gets saved. Full data privacy guaranteed.",
    color: "from-amber-500 to-yellow-500",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started and practice today",
    highlight: false,
    cta: "Start Free",
    features: [
      "3 interviews per day",
      "5-minute sessions",
      "Basic performance report",
      "Voice conversation",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For serious candidates who want to nail it",
    highlight: true,
    cta: "Start Free Trial",
    badge: "Most Popular",
    features: [
      "Unlimited interviews",
      "5, 10 & 15-minute sessions",
      "Advanced rubric reports",
      "JD skill extraction",
      "Interview history & trends",
      "Priority support",
      "Export transcripts (PDF)",
    ],
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per seat / month",
    description: "For teams and coding bootcamps",
    highlight: false,
    cta: "Contact Sales",
    features: [
      "Everything in Pro",
      "Team dashboard",
      "Bulk interview scheduling",
      "Custom question sets",
      "Analytics & reporting",
      "Dedicated success manager",
      "SLA & uptime guarantee",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "SWE @ Google",
    avatar: "PS",
    quote: "InterviewerAI helped me practice daily for 2 weeks. The voice conversations feel shockingly real. Got the Google offer on my 3rd try!",
    stars: 5,
  },
  {
    name: "Marcus L.",
    role: "Senior Engineer @ Meta",
    avatar: "ML",
    quote: "The JD skill extraction is brilliant. It focused my practice exactly where I needed it. The AI follow-ups are surprisingly sharp.",
    stars: 5,
  },
  {
    name: "Aisha K.",
    role: "Staff Eng @ Stripe",
    avatar: "AK",
    quote: "Used it every morning for a month. The detailed reports showed me exactly where I was weak. Negotiated a $240k package.",
    stars: 5,
  },
];

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">

      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-cyan-600/6 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#050507]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/25">
              <Mic2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">InterviewerAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav("/login")}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => nav("/signup")}
              className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-lg px-4 py-2 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-300">
                <Zap size={12} className="fill-current" />
                Powered by Groq AI — LLaMA · Whisper · TTS
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            >
              Ace your{" "}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                system design
              </span>
              <br />
              interview on the first try.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
            >
              Practice with a real AI interviewer that listens to your voice, asks intelligent follow-ups, and gives you detailed feedback — just like a real FAANG interview.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => nav("/signup")}
                className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold text-base rounded-xl px-8 py-4 transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
              >
                Start Practicing Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => nav("/login")}
                className="flex items-center gap-2 text-zinc-400 hover:text-white font-medium text-base rounded-xl px-8 py-4 border border-white/10 hover:border-white/20 transition-all hover:bg-white/5"
              >
                Sign In
              </button>
            </motion.div>

            <motion.p variants={fadeUp} custom={4} className="mt-6 text-sm text-zinc-500">
              No credit card required · 3 free interviews per day · Cancel anytime
            </motion.p>
          </motion.div>

          {/* Mock UI preview */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 relative"
          >
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-zinc-900/80">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-zinc-500 font-mono">Live Mock Interview · 04:32</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Listening...
                </span>
              </div>
              <div className="p-6 space-y-4 text-left">
                <div className="flex justify-start">
                  <div className="max-w-[70%]">
                    <p className="text-xs text-zinc-500 mb-1 uppercase font-semibold tracking-wider">Interviewer AI</p>
                    <div className="bg-zinc-800/80 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-3.5 text-[15px] text-zinc-100">
                      Great answer! Now, how would you handle database sharding when one shard becomes a hotspot receiving 80% of your traffic?
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[70%]">
                    <p className="text-xs text-zinc-500 mb-1 uppercase font-semibold tracking-wider text-right">You</p>
                    <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl rounded-tr-sm px-5 py-3.5 text-[15px] text-white">
                      I'd implement consistent hashing with virtual nodes, so we can redistribute load without a full reshard...
                    </div>
                  </div>
                </div>
                {/* Listening indicator */}
                <div className="flex items-center justify-center pt-2">
                  <div className="flex items-center gap-3 bg-zinc-800/80 px-5 py-2.5 rounded-full border border-white/10">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    </span>
                    <span className="text-sm text-zinc-300 font-medium">VAD — listening automatically</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect below the window */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-violet-600/20 blur-2xl rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: "12,000+", label: "Interviews Conducted" },
            { val: "94%", label: "Pass Rate Improvement" },
            { val: "< 2s", label: "AI Response Time" },
            { val: "50+", label: "Companies Cracked" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{s.val}</p>
              <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-violet-400 tracking-widest uppercase mb-3">Features</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">land the job</span>
            </motion.h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} mb-4 shadow-lg`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-violet-400 tracking-widest uppercase mb-3">Testimonials</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-extrabold">Loved by engineers worldwide</motion.h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i}
                className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-6"
              >
                <div className="flex">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-violet-400 tracking-widest uppercase mb-3">Pricing</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-zinc-400 mt-4 text-lg">
              Start free. Upgrade when you're ready.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 items-stretch"
          >
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                custom={i}
                className={`relative flex flex-col rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlight
                    ? "border-violet-500/50 bg-gradient-to-b from-violet-900/20 to-blue-900/10 shadow-2xl shadow-violet-500/20 scale-[1.02]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <p className="text-sm font-semibold text-zinc-400 mb-2">{plan.name}</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? "text-white" : "text-zinc-100"}`}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-zinc-500 mb-2">/{plan.period}</span>
                </div>
                <p className="text-sm text-zinc-500 mb-8">{plan.description}</p>
                <button
                  onClick={() => nav("/signup")}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all mb-8 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/30"
                      : "bg-white/5 text-zinc-200 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {plan.cta}
                </button>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/30 to-blue-900/20 p-12 text-center overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                Ready to get hired?
              </h2>
              <p className="text-zinc-400 text-lg mb-8">
                Join 12,000+ engineers who've transformed their interview performance with AI.
              </p>
              <button
                onClick={() => nav("/signup")}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold text-base rounded-xl px-10 py-4 transition-all shadow-2xl shadow-violet-500/40 hover:scale-105"
              >
                Start for Free Today
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-4 text-sm text-zinc-500">No credit card required</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
              <Mic2 size={14} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">InterviewerAI</span>
          </div>
          <p className="text-sm text-zinc-600">© 2025 InterviewerAI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
