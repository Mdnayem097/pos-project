"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setLoading(true);
    login(quickEmail, quickPass).catch((err: any) => {
      setError(err.message || "Login failed");
      setLoading(false);
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-[#FFF5EE] via-[#fdf2ea] to-[#fae5d7] dark:from-[#080B12] dark:via-[#0B0F19] dark:to-[#0F172A] px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/25 ring-8 ring-brand-500/10">
            <Store size={32} strokeWidth={2.4} />
          </div>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Retail POS
          </h1>
          <p className="mt-1 text-sm font-medium text-stone-500 dark:text-slate-400">
            Sign in to access your sales terminal & store management
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-8 rounded-2xl border border-[#fae5d7] dark:border-[#1F293D] bg-white dark:bg-[#111827] p-6 shadow-xl dark:shadow-2xl sm:p-8 transition-colors duration-200">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 dark:border-rose-800/50 bg-red-50/90 dark:bg-rose-950/40 p-3.5 text-sm text-red-800 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500 h-4 w-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@retailpos.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50/50 dark:bg-[#162035] py-2.5 pl-10 pr-4 text-sm font-medium text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:bg-white dark:focus:bg-[#162035] focus:outline-none focus:ring-4 focus:ring-brand-500/15 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500 h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50/50 dark:bg-[#162035] py-2.5 pl-10 pr-11 text-sm font-medium text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:bg-white dark:focus:bg-[#162035] focus:outline-none focus:ring-4 focus:ring-brand-500/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-400 hover:text-stone-600 dark:hover:text-white focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-stone-300 dark:border-[#1F293D] text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <span className="text-stone-400 dark:text-slate-500">HS256 JWT & scrypt</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 px-4 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-600 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 border-t border-[#fae5d7] dark:border-[#1F293D] pt-5">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-3">
              ⚡ Quick Demo Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin@retailpos.com", "SuperAdmin@123")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035] px-3 py-2 text-xs font-semibold text-stone-700 dark:text-slate-200 transition hover:bg-white dark:hover:bg-[#1E293B] hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 hover:shadow-sm"
              >
                <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("cashier@retailpos.com", "cashier123")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035] px-3 py-2 text-xs font-semibold text-stone-700 dark:text-slate-200 transition hover:bg-white dark:hover:bg-[#1E293B] hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-400 hover:shadow-sm"
              >
                <UserCheck size={14} className="text-emerald-500 dark:text-emerald-400" />
                <span>Cashier Login</span>
              </button>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-stone-400 dark:text-slate-500">
              Super Admin has master access; Cashier has terminal access with restricted admin functions.
            </p>
          </div>
        </div>

        {/* Security / Technology Note */}
        <div className="mt-6 text-center text-xs text-stone-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-stone-400 dark:text-slate-500" />
          <span>Secured with cryptographic scrypt password hashing & JWT tokens</span>
        </div>
      </div>
    </div>
  );
}
