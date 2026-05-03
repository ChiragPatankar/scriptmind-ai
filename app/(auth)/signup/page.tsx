"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, User, UserPlus,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-browser";

const perks = [
  "Free forever plan",
  "AI script analysis & insights",
  "Multi-language dialogue generator",
  "Box office & OTT projections",
];

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

function passwordStrength(pw: string) {
  if (pw.length === 0) return 0;
  if (pw.length < 6) return 1;
  if (pw.length < 10) return 2;
  if (/[^a-zA-Z0-9]/.test(pw)) return 4;
  return 3;
}

const strengthColors = ["bg-surface-3", "bg-red-500", "bg-gold", "bg-blue-400", "bg-secondary"];

export default function SignupPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = passwordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is OFF, session is active — send to plan selection.
    // If ON, user must confirm first; show message and the callback will redirect.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/onboarding");
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.");
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?new=1`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-black text-text-primary mb-2">Create your account</h1>
        <p className="text-text-muted">Join 50,000+ filmmakers and storytellers on ScriptMind AI.</p>
      </div>

      {/* Perks */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6">
        {perks.map((perk) => (
          <div key={perk} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            {perk}
          </div>
        ))}
      </div>

      {/* Google OAuth — primary CTA */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full mb-4 border-border hover:border-accent/30 gap-3"
        onClick={handleGoogleSignup}
        loading={googleLoading}
        leftIcon={!googleLoading ? <GoogleIcon /> : undefined}
      >
        Sign up with Google
      </Button>

      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or sign up with email</span>
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

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 mb-4"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </motion.div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Arjun Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

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

        {/* Password strength bar */}
        {password && (
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  strength >= level ? strengthColors[strength] : "bg-surface-3"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded accent-[#7C3AED] mt-0.5 flex-shrink-0"
            required
          />
          <span className="text-xs text-text-muted leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-accent hover:text-accent-light transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent hover:text-accent-light transition-colors">
              Privacy Policy
            </Link>
          </span>
        </div>

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Create Free Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent hover:text-accent-light font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
