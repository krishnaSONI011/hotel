"use client";
import { useState } from "react";

export default function AuthTabs({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // mock auth
    localStorage.setItem("user", JSON.stringify(form));
    onAuthSuccess();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <div className="flex space-x-4 mb-4">
        <button onClick={() => setTab("login")} className={tab === "login" ? "font-bold" : ""}>Login neeraj</button>
        <button onClick={() => setTab("register")} className={tab === "register" ? "font-bold" : ""}>Register</button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          className="border p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">
          {tab === "login" ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}
