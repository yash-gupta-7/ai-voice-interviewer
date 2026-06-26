import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import NewInterview from "./pages/NewInterview";
import LiveInterview from "./pages/LiveInterview";
import Report from "./pages/Report";
import History from "./pages/History";

function Guard({ children }: { children: JSX.Element }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" replace />;
}

function Nav() {
  const nav = useNavigate();
  function logout() {
    localStorage.removeItem("token");
    nav("/");
  }
  const isLoggedIn = !!localStorage.getItem("token");
  if (!isLoggedIn) return null;
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-white text-sm">AI Interviewer</span>
      <div className="flex-1 flex gap-4">
        <Link to="/new" className="text-sm text-gray-400 hover:text-white transition-colors">
          New Interview
        </Link>
        <Link to="/history" className="text-sm text-gray-400 hover:text-white transition-colors">
          History
        </Link>
      </div>
      <button
        onClick={logout}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Sign out
      </button>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Nav />
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/new" element={<Guard><NewInterview /></Guard>} />
          <Route path="/interview/:id" element={<Guard><LiveInterview /></Guard>} />
          <Route path="/report/:id" element={<Guard><Report /></Guard>} />
          <Route path="/history" element={<Guard><History /></Guard>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
