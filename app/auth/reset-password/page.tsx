"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-browser";

function strengthColors(pw: string): { bars: string[]; label: string } {
  const len = pw.length;
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const score =
    len === 0 ? 0 :
    len < 6   ? 1 :
    len < 10  ? 2 :
    hasSpecial ? 4 : 3;
  const color = ["bg-surface-3", "bg-red-500", "bg-gold", "bg-blue-400", "bg-secondary"][score];
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  return { bars: [1, 2, 3, 4].map((l) => (score >= l ? color : "bg-surface-3")), label };
}

function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the session via the URL hash on redirect — wait for it
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/projects"), 2500);
  };

  const { bars, label } = strengthColors(password);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <p className="font-bold text-text-primary text-base">Password updated!</p>
          <p className="text-sm text-text-muted mt-1">Redirecting you to the dashboard…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary mb-2">Set new password</h1>
        <p className="text-text-muted">Choose a strong password for your account.</p>
      </div>

      {!sessionReady && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Verifying your reset link… if this persists, request a new link.
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type={showPw ? "text" : "password"}
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="hover:text-text-primary transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />

        {/* Strength bar */}
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1.5">
              {bars.map((cls, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${cls}`} />
              ))}
            </div>
            <p className="text-[11px] text-text-muted">{label}</p>
          </div>
        )}

        <Input
          label="Confirm password"
          type={showPw ? "text" : "password"}
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        {confirm && password === confirm && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Passwords match
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={!sessionReady}
          size="lg"
          className="w-full"
          leftIcon={<ShieldCheck className="w-4 h-4" />}
        >
          Update Password
        </Button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
