"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiChangePassword } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";

interface Props {
  forced?: boolean;
  onClose?: () => void;
}

export default function ChangePasswordModal({ forced = false, onClose }: Props) {
  const { markPasswordChanged, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password cannot be the same as your temporary password.");
      return;
    }

    try {
      setLoading(true);
      await apiChangePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        markPasswordChanged();
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#fae5d7] dark:border-[#1F293D] bg-white dark:bg-[#111827] p-6 shadow-2xl transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">
              {forced ? "Set Your New Password" : "Change Password"}
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              {forced
                ? "First login requires updating your temporary password"
                : "Update your account password"}
            </p>
          </div>
        </div>

        {forced && (
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Security Notice:</strong> Your account was created with a temporary password by an administrator. You must set a private password before using Retail POS.
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Password updated successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Current / Temporary Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1">
              Current / Temporary Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Temporary password from Admin"
                required
                className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50/50 dark:bg-[#162035] text-stone-900 dark:text-white dark:placeholder:text-slate-500 py-2.5 pl-3.5 pr-10 text-sm focus:border-brand-500 focus:bg-white dark:focus:bg-[#162035] focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1">
              New Password (min 6 characters)
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
                minLength={6}
                className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50/50 dark:bg-[#162035] text-stone-900 dark:text-white dark:placeholder:text-slate-500 py-2.5 pl-3.5 pr-10 text-sm focus:border-brand-500 focus:bg-white dark:focus:bg-[#162035] focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
              minLength={6}
              className="w-full rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50/50 dark:bg-[#162035] text-stone-900 dark:text-white dark:placeholder:text-slate-500 py-2.5 px-3.5 text-sm focus:border-brand-500 focus:bg-white dark:focus:bg-[#162035] focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-stone-100 dark:border-[#1F293D]">
            {forced ? (
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
              >
                Logout instead
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
