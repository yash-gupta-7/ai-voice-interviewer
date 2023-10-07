import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const nav = useNavigate();
  async function submit() {
    const { token } = await api.login(email);
    localStorage.setItem("token", token);
    nav("/new");
  }
  return (
    <div className="max-w-sm mx-auto mt-24 space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <input className="border w-full p-2 rounded" placeholder="you@example.com"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="bg-black text-white w-full p-2 rounded" onClick={submit}>
        Continue
      </button>
    </div>
  );
}
