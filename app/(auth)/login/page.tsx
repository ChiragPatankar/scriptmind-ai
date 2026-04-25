"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-browser";

// Google "G" SVG logo
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.6 35.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.6l6.2 5.2C40.5 36.8 44 30.8 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show callback errors (e.g. auth_failed from /auth/callback)
  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      setError("OAuth login failed. Please try again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/projects";
    router.push(next);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success Supabase redirects to Google → then /auth/callback → /projects
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary mb-2">Welcome back</h1>
          <p className="text-text-muted">Sign in to your ScriptMind AI account.</p>
      </div>

      {/* Google OAuth — primary CTA */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full mb-4 border-border hover:border-accent/30 gap-3"
        onClick={handleGoogleLogin}
        loading={googleLoading}
        leftIcon={!googleLoading ? <GoogleIcon /> : undefined}
      >
        Continue with Google
      </Button>

      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or sign in with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Feedback banners */}
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

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Password"
          type={showPw ? "text" : "password"}
          placeholder="••••••••"
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

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-accent hover:text-accent-light transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full"
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-accent hover:text-accent-light font-medium transition-colors"
        >
          Sign up free
        </Link>
      </p>
    </motion.div>
  );
}
