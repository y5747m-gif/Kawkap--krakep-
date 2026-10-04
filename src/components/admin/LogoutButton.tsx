"use client";

import { LogOut } from "lucide-react";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-white/10">
      <LogOut size={15} /> تسجيل الخروج
    </button>
  );
}
