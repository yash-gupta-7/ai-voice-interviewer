import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mic2, LogOut, History, Plus } from "lucide-react";

export function Navbar() {
  const nav = useNavigate();
  const location = useLocation();

  function logout() {
    localStorage.removeItem("token");
    nav("/");
  }

  const isLoggedIn = !!localStorage.getItem("token");
  if (!isLoggedIn) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 glass">
      <div className="container mx-auto max-w-5xl flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link to="/history" className="flex items-center gap-2 font-semibold text-zinc-100 transition-colors hover:text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Mic2 size={16} />
            </div>
            <span>Interviewer AI</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              to="/new"
              className={`flex items-center gap-1.5 transition-colors hover:text-zinc-100 ${
                isActive("/new") ? "text-zinc-100" : "text-zinc-400"
              }`}
            >
              <Plus size={16} />
              New Interview
            </Link>
            <Link
              to="/history"
              className={`flex items-center gap-1.5 transition-colors hover:text-zinc-100 ${
                isActive("/history") ? "text-zinc-100" : "text-zinc-400"
              }`}
            >
              <History size={16} />
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
