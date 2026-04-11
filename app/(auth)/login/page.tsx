"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    // redirect to /projects
    window.location.href = "/projects";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary mb-2">Welcome back</h1>
        <p className="text-text-muted">
          Sign in to your ScriptMind AI account.
        </p>
      </div>

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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-3.5 h-3.5 rounded accent-[#7C3AED]" />
            <span className="text-sm text-text-muted">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-accent hover:text-accent-light transition-colors">
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

        <div className="relative flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {["Google", "GitHub"].map((provider) => (
            <Button key={provider} variant="secondary" size="sm" type="button">
              {provider}
            </Button>
          ))}
        </div>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent hover:text-accent-light font-medium transition-colors">
          Sign up free
        </Link>
      </p>
    </motion.div>
  );
}
