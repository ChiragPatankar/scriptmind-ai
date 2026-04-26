"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, CreditCard, Shield, Palette, Key, Save, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  id:         string;
  full_name:  string | null;
  username:   string | null;
  email:      string | null;
  location:   string | null;
  bio:        string | null;
  avatar_url: string | null;
}

interface FormState {
  full_name: string;
  username:  string;
  location:  string;
  bio:       string;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id:      number;
  type:    "success" | "error";
  message: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto",
              t.type === "success"
                ? "bg-green-500/15 border border-green-500/30 text-green-400"
                : "bg-red-500/15 border border-red-500/30 text-red-400"
            )}
          >
            {t.type === "success"
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <XCircle className="w-4 h-4 flex-shrink-0" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const tabs = [
  { id: "profile",       label: "Profile",       icon: User       },
  { id: "notifications", label: "Notifications", icon: Bell       },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "security",      label: "Security",      icon: Shield     },
  { id: "appearance",    label: "Appearance",    icon: Palette    },
  { id: "api",           label: "API Keys",      icon: Key        },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("profile");

  // Auth + profile state
  const [user,        setUser]        = useState<SupabaseUser | null>(null);
  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Editable form fields
  const [form, setForm] = useState<FormState>({
    full_name: "",
    username:  "",
    location:  "",
    bio:       "",
  });

  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Fetch user + profile ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setProfileLoading(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setProfileLoading(false); return; }
      setUser(authUser);

      // Fetch existing profile
      let { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      // First-time user — create profile row
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id:        authUser.id,
          full_name: authUser.user_metadata?.full_name ?? "",
          email:     authUser.email ?? "",
        });

        const { data: newProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        existingProfile = newProfile;
      }

      setProfile(existingProfile);
      setProfileLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync form when profile loads ────────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        username:  profile.username  ?? "",
        location:  profile.location  ?? "",
        bio:       profile.bio       ?? "",
      });
    }
  }, [profile]);

  // ── Save handler ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from("profiles").upsert({
      id:        user.id,
      full_name: form.full_name,
      username:  form.username,
      location:  form.location,
      bio:       form.bio,
      email:     user.email ?? "",
    });

    setSaving(false);

    if (error) {
      addToast("error", "Failed to save profile. Please try again.");
    } else {
      addToast("success", "Profile saved successfully!");
      // Keep local profile in sync
      setProfile((prev) => prev ? { ...prev, ...form } : prev);
    }
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const displayName  = form.full_name || user?.email?.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} />

      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-text-primary mb-1">Settings</h1>
          <p className="text-text-muted">Manage your account and preferences.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-48 flex-shrink-0"
          >
            <div className="space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left",
                      activeTab === tab.id
                        ? "bg-accent/15 text-accent"
                        : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-1 min-w-0"
          >
            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card variant="default" hover={false}>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">

                    {profileLoading ? (
                      <div className="flex items-center gap-3 py-6 text-text-muted">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading profile…</span>
                      </div>
                    ) : (
                      <>
                        {/* Avatar */}
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {profile?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-black text-white">{avatarLetter}</span>
                            )}
                          </div>
                          <div>
                            <Button variant="secondary" size="sm">Change Avatar</Button>
                            <p className="text-xs text-text-muted mt-1.5">JPG, GIF or PNG. Max 2MB.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Full Name"
                            value={form.full_name}
                            placeholder="Your full name"
                            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                          />
                          {/* Email — read-only, always from auth */}
                          <Input
                            label="Email Address"
                            type="email"
                            value={user?.email ?? ""}
                            readOnly
                            className="opacity-60 cursor-not-allowed"
                          />
                          <Input
                            label="Username"
                            value={form.username}
                            placeholder="your_username"
                            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                          />
                          <Input
                            label="Location"
                            value={form.location}
                            placeholder="City, Country"
                            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-text-secondary block mb-1.5">Bio</label>
                          <textarea
                            value={form.bio}
                            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                            placeholder="Tell us about yourself…"
                            rows={3}
                            className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                          />
                        </div>

                        <Button
                          leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save Changes"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Billing Tab ── */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <Card variant="default" hover={false}>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/30">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-black text-text-primary">Free Plan</span>
                          <Badge variant="secondary">Current</Badge>
                        </div>
                        <p className="text-sm text-text-muted">5 analyses/mo · 10 dialogue generations · 2 stories</p>
                      </div>
                      <Button>Upgrade to Pro</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="default" hover={false}>
                  <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { name: "Free", price: "₹0", period: "/mo", features: ["5 script analyses", "10 dialogue gens", "2 stories", "100 downloads"] },
                        { name: "Pro", price: "₹799", period: "/mo", features: ["Unlimited analyses", "Unlimited dialogues", "Unlimited stories", "Full library access"], highlighted: true },
                        { name: "Enterprise", price: "Custom", period: "", features: ["Everything in Pro", "API access", "Priority support", "Custom training"] },
                      ].map((plan) => (
                        <div
                          key={plan.name}
                          className={cn(
                            "rounded-xl p-4 border",
                            plan.highlighted ? "border-accent/40 bg-accent/10" : "border-border bg-surface-2"
                          )}
                        >
                          <div className="text-base font-bold text-text-primary mb-1">{plan.name}</div>
                          <div className="flex items-baseline gap-0.5 mb-4">
                            <span className="text-2xl font-black text-text-primary">{plan.price}</span>
                            <span className="text-sm text-text-muted">{plan.period}</span>
                          </div>
                          <ul className="space-y-1.5 mb-4">
                            {plan.features.map((f) => (
                              <li key={f} className="text-xs text-text-muted flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-secondary flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Button
                            variant={plan.highlighted ? "default" : "secondary"}
                            size="sm"
                            className="w-full"
                          >
                            {plan.name === "Free" ? "Current" : `Get ${plan.name}`}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── API Keys Tab ── */}
            {activeTab === "api" && (
              <Card variant="default" hover={false}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    API Keys
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-text-muted">
                    Use API keys to access ScriptMind AI programmatically. Keep your keys secret.
                  </p>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Production Key</p>
                      <p className="text-xs text-text-muted font-mono mt-1">sm_prod_••••••••••••••••••••</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Copy</Button>
                      <Button variant="destructive" size="sm">Revoke</Button>
                    </div>
                  </div>
                  <Button variant="secondary" leftIcon={<Key className="w-4 h-4" />}>
                    Generate New Key
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── Coming-soon tabs ── */}
            {!["profile", "billing", "api"].includes(activeTab) && (
              <Card variant="default" hover={false}>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                    {React.createElement(tabs.find((t) => t.id === activeTab)?.icon || User, {
                      className: "w-6 h-6 text-text-muted",
                    })}
                  </div>
                  <p className="text-text-secondary font-medium capitalize">{activeTab} Settings</p>
                  <p className="text-text-muted text-sm mt-1">Coming soon — stay tuned!</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
