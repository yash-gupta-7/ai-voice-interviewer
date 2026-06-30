import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  mode: "login" | "signup";
}

export default function AuthPage({ mode }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!email || !email.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isSignup) {
        res = await api.signup(email, password, name);
      } else {
        res = await api.login(email, password);
      }
      localStorage.setItem("token", res.token);
      nav("/history");
    } catch (e: any) {
      setErr(e.message || (isSignup ? "Failed to create account." : "Failed to sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Back button */}
      <div className="relative z-10 p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>

      {/* Form container */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-2xl shadow-violet-500/30 mb-4">
              <Mic2 size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              {isSignup
                ? "Start practicing interviews for free today."
                : "Sign in to continue your practice sessions."}
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/50"
          >
            <AnimatePresence mode="wait">
              {err && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                >
                  {err}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus={!isSignup}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignup ? "At least 6 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  isSignup ? "Create Account" : "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isSignup ? (
                <span className="text-zinc-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    Sign In
                  </Link>
                </span>
              ) : (
                <span className="text-zinc-500">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    Sign Up Free
                  </Link>
                </span>
              )}
            </div>
          </motion.div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
