import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import SignIn from "./pages/SignIn";
import NewInterview from "./pages/NewInterview";
import LiveInterview from "./pages/LiveInterview";
import Report from "./pages/Report";
import History from "./pages/History";

function Guard({ children }: { children: JSX.Element }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-3 border-b flex gap-4">
        <Link to="/new">New</Link><Link to="/history">History</Link>
      </nav>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/new" element={<Guard><NewInterview /></Guard>} />
        <Route path="/interview/:id" element={<Guard><LiveInterview /></Guard>} />
        <Route path="/report/:id" element={<Guard><Report /></Guard>} />
        <Route path="/history" element={<Guard><History /></Guard>} />
      </Routes>
    </BrowserRouter>
  );
}
