import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import NewInterview from "./pages/NewInterview";
import LiveInterview from "./pages/LiveInterview";
import History from "./pages/History";
import Report from "./pages/Report";
import { Navbar } from "./components/layout/Navbar";

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

function ProtectedRoute({ element }: { element: JSX.Element }) {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no navbar */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />

        {/* App routes — with navbar */}
        <Route
          path="/*"
          element={
            <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
              <Navbar />
              <Routes>
                <Route path="/new" element={<ProtectedRoute element={<NewInterview />} />} />
                <Route path="/live/:id" element={<ProtectedRoute element={<LiveInterview />} />} />
                <Route path="/history" element={<ProtectedRoute element={<History />} />} />
                <Route path="/report/:id" element={<ProtectedRoute element={<Report />} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
