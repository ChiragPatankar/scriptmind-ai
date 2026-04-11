"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const perks = [
  "Free forever plan",
  "5 script analyses/month",
  "AI dialogue generator",
  "Access to 100 scripts/month",
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    window.location.href = "/projects";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-black text-text-primary mb-2">Create your account</h1>
        <p className="text-text-muted">Join 50,000+ Bollywood storytellers on ScriptMind AI.</p>
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

        {password && (
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  password.length >= level * 3
                    ? level <= 1 ? "bg-red-500"
                    : level <= 2 ? "bg-gold"
                    : level <= 3 ? "bg-blue-400"
                    : "bg-secondary"
                    : "bg-surface-3"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          <input type="checkbox" className="w-3.5 h-3.5 rounded accent-[#7C3AED] mt-0.5 flex-shrink-0" required />
          <span className="text-xs text-text-muted leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-accent hover:text-accent-light transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-accent hover:text-accent-light transition-colors">Privacy Policy</Link>
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

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">or</span>
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
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
