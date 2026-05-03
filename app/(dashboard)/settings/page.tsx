"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, CreditCard, Shield, Palette, Key,
  Save, CheckCircle2, XCircle, Loader2, AlertCircle,
  Copy, RefreshCw, Trash2, Moon, Sun, Monitor,
  Lock, LogOut, Eye, EyeOff, Zap, Crown, Star,
  MapPin, AtSign, FileText, Camera,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";
import { createClient } from "@/lib/supabase-browser";
import { useRazorpay }  from "@/hooks/useRazorpay";
import { useCredits }   from "@/hooks/useCredits";
import { useTheme }     from "next-themes";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotifPrefs {
  email_updates:    boolean;
  credit_alerts:    boolean;
  project_activity: boolean;
  weekly_digest:    boolean;
  marketing:        boolean;
}

interface Profile {
  id:                 string;
  full_name:          string | null;
  username:           string | null;
  email:              string | null;
  location:           string | null;
  bio:                string | null;
  avatar_url:         string | null;
  notification_prefs: NotifPrefs | null;
  theme_preference:   string | null;
}

interface FormState {
  full_name: string;
  username:  string;
  location:  string;
  bio:       string;
}

interface Toast { id: number; type: "success" | "error" | "info"; message: string; }

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_NOTIFS: NotifPrefs = {
  email_updates:    true,
  credit_alerts:    true,
  project_activity: false,
  weekly_digest:    true,
  marketing:        false,
};

// ── Sub-components ────────────────────────────────────────────────────────────

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
              "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto",
              t.type === "success" ? "bg-green-500/15 border border-green-500/30 text-green-400"
                : t.type === "error" ? "bg-red-500/15 border border-red-500/30 text-red-400"
                : "bg-accent/15 border border-accent/30 text-accent"
            )}
          >
            {t.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : t.type === "error" ? <XCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-accent" : "bg-surface-2 border border-border"
      )}
    >
      <span className={cn(
        "inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        {desc && <p className="text-xs text-text-muted mt-0.5">{desc}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Plan meta ─────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, { label: string; color: string; icon: React.ElementType; credits: string }> = {
  free:  { label: "Free",  color: "#6B7280", icon: Star,  credits: "20 credits" },
  basic: { label: "Basic", color: "#0EA5E9", icon: Zap,   credits: "250 credits/mo" },
  pro:   { label: "Pro",   color: "#A78BFA", icon: Crown, credits: "700 credits/mo" },
};

const TABS = [
  { id: "profile",       label: "Profile",       icon: User       },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell       },
  { id: "security",      label: "Security",      icon: Shield     },
  { id: "appearance",    label: "Appearance",    icon: Palette    },
  { id: "api",           label: "API Keys",      icon: Key        },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase        = createClient();
  const { pay, paying } = useRazorpay();
  const { credits, plan: currentPlan, planExpiresAt, isExpired } = useCredits();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile");
  const fileRef = useRef<HTMLInputElement>(null);

  // Auth + profile
  const [user,           setUser]           = useState<SupabaseUser | null>(null);
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form fields
  const [form,        setForm]        = useState<FormState>({ full_name: "", username: "", location: "", bio: "" });
  const [saving,      setSaving]      = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Notifications (synced from DB)
  const [notifs,        setNotifs]        = useState<NotifPrefs>(DEFAULT_NOTIFS);
  const [notifsSaving,  setNotifsSaving]  = useState(false);

  // Appearance (synced from DB)
  const [themeSaving, setThemeSaving] = useState(false);

  // Payment
  const [payError,   setPayError]   = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payingPlan, setPayingPlan] = useState<"basic" | "pro" | null>(null);

  // Security
  const [pwForm,       setPwForm]       = useState({ next: "", confirm: "" });
  const [showPw,       setShowPw]       = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [deleteInput,  setDeleteInput]  = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // API Keys
  const [apiKey,     setApiKey]     = useState("sm_prod_" + "•".repeat(24));
  const [keyVisible, setKeyVisible] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Load user + profile ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setProfileLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setProfileLoading(false); return; }
      setUser(authUser);

      let { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!existing) {
        await supabase.from("profiles").insert({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name ?? "",
          email: authUser.email ?? "",
        });
        const { data: newP } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
        existing = newP;
      }

      setProfile(existing as Profile);

      // Sync notification prefs from DB
      if (existing?.notification_prefs) {
        setNotifs({ ...DEFAULT_NOTIFS, ...(existing.notification_prefs as Partial<NotifPrefs>) });
      }

      // Sync theme from DB
      if (existing?.theme_preference) {
        setTheme(existing.theme_preference);
      }

      setProfileLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Profile save ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, email: user.email ?? "",
      full_name: form.full_name, username: form.username,
      location: form.location,  bio: form.bio,
    });
    setSaving(false);
    if (error) { addToast("error", "Failed to save profile."); } else { addToast("success", "Profile saved!"); setProfile((p) => p ? { ...p, ...form } : p); }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) { addToast("error", "File too large. Max 2 MB."); return; }
    if (!file.type.startsWith("image/")) { addToast("error", "Please select a valid image file."); return; }

    setAvatarUploading(true);

    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) { addToast("error", "Upload failed. " + uploadErr.message); setAvatarUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    // Append cache-buster
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase.from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    setAvatarUploading(false);

    if (dbErr) { addToast("error", "Could not save avatar URL."); return; }
    setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p);
    addToast("success", "Avatar updated!");
  }

  // ── Notification prefs save ───────────────────────────────────────────────
  async function handleSaveNotifs() {
    if (!user) return;
    setNotifsSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ notification_prefs: notifs })
      .eq("id", user.id);
    setNotifsSaving(false);
    if (error) { addToast("error", "Failed to save preferences."); } else { addToast("success", "Preferences saved!"); }
  }

  // ── Theme save ────────────────────────────────────────────────────────────
  async function handleThemeChange(newTheme: string) {
    setTheme(newTheme);
    if (!user) return;
    setThemeSaving(true);
    await supabase.from("profiles").update({ theme_preference: newTheme }).eq("id", user.id);
    setThemeSaving(false);
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  const handlePayment = async (plan: "basic" | "pro") => {
    setPayError(null); setPaySuccess(null); setPayingPlan(plan);
    await pay(plan, {
      onSuccess: (_p, c) => setPaySuccess(`You're now on ${plan.charAt(0).toUpperCase() + plan.slice(1)} with ${c} credits!`),
      onError:   (msg)   => setPayError(msg),
    });
    setPayingPlan(null);
  };

  // ── Password change ───────────────────────────────────────────────────────
  async function handlePasswordChange() {
    if (pwForm.next !== pwForm.confirm) { addToast("error", "Passwords do not match."); return; }
    if (pwForm.next.length < 8)         { addToast("error", "Minimum 8 characters required."); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) { addToast("error", error.message); } else { addToast("success", "Password updated successfully!"); setPwForm({ next: "", confirm: "" }); }
  }

  // ── Sign out all devices ──────────────────────────────────────────────────
  async function handleSignOutAll() {
    setSignOutLoading(true);
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/login";
  }

  // ── Delete account ────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (!user || deleteInput !== user.email) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error ?? "Deletion failed."); setDeleteLoading(false); return; }
      await supabase.auth.signOut();
      window.location.href = "/?deleted=1";
    } catch {
      addToast("error", "Network error. Please try again.");
      setDeleteLoading(false);
    }
  }

  // ── API key helpers ───────────────────────────────────────────────────────
  function handleCopyKey() {
    navigator.clipboard.writeText(apiKey).then(() => addToast("info", "API key copied to clipboard."));
  }

  function handleGenerateKey() {
    setGenLoading(true);
    setTimeout(() => {
      setApiKey("sm_prod_" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0")).join(""));
      setGenLoading(false);
      addToast("success", "New API key generated. Copy and store it safely.");
    }, 1000);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName  = form.full_name || user?.email?.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const planKey      = currentPlan ?? "free";
  const planMeta     = PLAN_META[planKey] ?? PLAN_META.free;
  const PlanIcon     = planMeta.icon;
  const expiryStr    = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* Hidden file input for avatar */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-text-primary mb-1">Settings</h1>
          <p className="text-text-muted text-sm">Manage your account, billing, and preferences.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-52 flex-shrink-0"
          >
            {/* Mini profile */}
            <div className="rounded-2xl border border-border bg-surface p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 overflow-hidden text-white font-black text-base">
                {profile?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  : avatarLetter}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <PlanIcon className="w-3 h-3 flex-shrink-0" style={{ color: planMeta.color }} />
                  <span className="text-xs capitalize" style={{ color: planMeta.color }}>{planMeta.label}</span>
                </div>
              </div>
            </div>

            <nav className="space-y-0.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
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
            </nav>
          </motion.aside>

          {/* ── Content ── */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0 space-y-5"
          >

            {/* ════ PROFILE ════ */}
            {activeTab === "profile" && (
              <Section title="Profile Information" desc="Visible to your collaborators on shared projects.">
                {profileLoading ? (
                  <div className="flex items-center gap-3 py-8 text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={avatarUploading}
                        className="relative group w-20 h-20 rounded-2xl bg-gradient-accent flex items-center justify-center flex-shrink-0 overflow-hidden focus:outline-none"
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-white">{avatarLetter}</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </button>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{displayName}</p>
                        <p className="text-xs text-text-muted mb-2">{user?.email}</p>
                        <Button
                          variant="secondary" size="sm"
                          leftIcon={avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                          onClick={() => fileRef.current?.click()}
                          disabled={avatarUploading}
                        >
                          {avatarUploading ? "Uploading…" : "Change Photo"}
                        </Button>
                        <p className="text-[10px] text-text-muted mt-1">JPG, PNG or GIF · Max 2 MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        value={form.full_name}
                        placeholder="Your full name"
                        onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                      />
                      <Input
                        label="Email Address" type="email"
                        value={user?.email ?? ""}
                        readOnly className="opacity-60 cursor-not-allowed"
                      />
                      <div className="relative">
                        <Input
                          label="Username" value={form.username}
                          placeholder="your_username"
                          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                        />
                        <AtSign className="absolute right-3 bottom-3 w-4 h-4 text-text-muted pointer-events-none" />
                      </div>
                      <div className="relative">
                        <Input
                          label="Location" value={form.location}
                          placeholder="Mumbai, India"
                          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        />
                        <MapPin className="absolute right-3 bottom-3 w-4 h-4 text-text-muted pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
                        <FileText className="w-3.5 h-3.5" /> Bio
                      </label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value.slice(0, 280) }))}
                        placeholder="Filmmaker, screenwriter, storyteller…"
                        rows={3}
                        className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                      <p className="text-xs text-text-muted mt-1 text-right">{form.bio.length}/280</p>
                    </div>

                    <Button
                      leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      onClick={handleSave} disabled={saving}
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                )}
              </Section>
            )}

            {/* ════ BILLING ════ */}
            {activeTab === "billing" && (
              <>
                {payError   && <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"><AlertCircle className="w-4 h-4 flex-shrink-0" />{payError}</div>}
                {paySuccess && <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{paySuccess}</div>}

                <Section title="Current Plan">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border"
                    style={{ background: `${planMeta.color}10`, borderColor: `${planMeta.color}30` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${planMeta.color}20` }}>
                        <PlanIcon className="w-5 h-5" style={{ color: planMeta.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-text-primary">{planMeta.label} Plan</span>
                          <Badge variant="secondary">Active</Badge>
                          {isExpired && <Badge variant="destructive">Expired</Badge>}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          {credits !== null ? `${credits} credits remaining` : planMeta.credits}
                          {expiryStr && ` · Renews ${expiryStr}`}
                        </p>
                      </div>
                    </div>
                    {planKey !== "pro" && (
                      <Button onClick={() => handlePayment("pro")} loading={paying && payingPlan === "pro"} disabled={paying} size="sm">
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </Section>

                <Section title="Available Plans" desc="All paid plans include a 30-day subscription period.">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { name: "Free",  planId: null,           price: "₹0",     period: "/mo", color: "#6B7280", icon: Star,
                        features: ["20 credits total", "Script analysis · 2cr", "AI Dialogue · 1cr", "Story Creator · 2cr", "Scene Visualizer · 3cr"] },
                      { name: "Basic", planId: "basic" as const, price: "₹499",   period: "/mo", color: "#0EA5E9", icon: Zap,
                        features: ["250 credits / month", "All AI tools", "Finance Studio (1 trial)", "Priority support"] },
                      { name: "Pro",   planId: "pro"  as const, price: "₹1,299", period: "/mo", color: "#A78BFA", icon: Crown,
                        features: ["700 credits / month", "Full Finance Studio", "Unlimited reports", "Projection insights", "Everything in Basic"] },
                    ].map((p) => {
                      const PIcon  = p.icon;
                      const active = planKey === p.name.toLowerCase();
                      return (
                        <div
                          key={p.name}
                          className="rounded-xl p-5 border flex flex-col"
                          style={active
                            ? { borderColor: p.color, background: `${p.color}08`, boxShadow: `0 0 0 2px ${p.color}` }
                            : { borderColor: "var(--border)", background: "var(--surface-2)" }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <PIcon className="w-4 h-4" style={{ color: p.color }} />
                            <span className="text-sm font-bold text-text-primary">{p.name}</span>
                            {active && <Badge variant="secondary" className="ml-auto text-[10px]">Current</Badge>}
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-4">
                            <span className="text-2xl font-black text-text-primary">{p.price}</span>
                            <span className="text-xs text-text-muted">{p.period}</span>
                          </div>
                          <ul className="space-y-1.5 mb-5 flex-1">
                            {p.features.map((f) => (
                              <li key={f} className="text-xs text-text-muted flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: p.color }} />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Button
                            variant={active ? "secondary" : "default"}
                            size="sm" className="w-full"
                            style={!active && p.planId ? { background: p.color } : {}}
                            loading={paying && payingPlan === p.planId}
                            disabled={paying || active || p.planId === null}
                            onClick={() => p.planId && handlePayment(p.planId)}
                          >
                            {active ? "Current Plan" : p.planId === null ? "Free Plan" : `Get ${p.name}`}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </>
            )}

            {/* ════ NOTIFICATIONS ════ */}
            {activeTab === "notifications" && (
              <Section title="Notification Preferences" desc="Saved to your account — applies across all devices.">
                <div className="divide-y divide-border">
                  {([
                    { key: "email_updates",    label: "Email updates",    desc: "Product announcements and new feature releases." },
                    { key: "credit_alerts",    label: "Credit alerts",    desc: "Alert when your credits drop below 20." },
                    { key: "project_activity", label: "Project activity", desc: "Comments and edits on your shared projects." },
                    { key: "weekly_digest",    label: "Weekly digest",    desc: "Summary of your usage and activity every week." },
                    { key: "marketing",        label: "Marketing emails", desc: "Tips, case studies, and promotional offers." },
                  ] as { key: keyof NotifPrefs; label: string; desc: string }[]).map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="mr-8">
                        <p className="text-sm font-medium text-text-primary">{n.label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{n.desc}</p>
                      </div>
                      <Toggle checked={notifs[n.key]} onChange={(v) => setNotifs((p) => ({ ...p, [n.key]: v }))} />
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-border">
                  <Button
                    onClick={handleSaveNotifs}
                    disabled={notifsSaving}
                    leftIcon={notifsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  >
                    {notifsSaving ? "Saving…" : "Save Preferences"}
                  </Button>
                </div>
              </Section>
            )}

            {/* ════ SECURITY ════ */}
            {activeTab === "security" && (
              <>
                <Section title="Change Password" desc="Minimum 8 characters. Applied immediately to your account.">
                  <div className="space-y-4 max-w-md">
                    <div className="relative">
                      <Input
                        label="New Password" type={showPw ? "text" : "password"}
                        value={pwForm.next} placeholder="Min. 8 characters"
                        onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 bottom-3 text-text-muted hover:text-text-secondary">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Input
                      label="Confirm New Password" type="password"
                      value={pwForm.confirm} placeholder="Repeat new password"
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    />
                    <Button
                      leftIcon={pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      onClick={handlePasswordChange} disabled={pwSaving || !pwForm.next}
                    >
                      {pwSaving ? "Updating…" : "Update Password"}
                    </Button>
                  </div>
                </Section>

                <Section title="Active Sessions" desc="These devices are currently signed into your account.">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border">
                      <div>
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                          Current Browser
                          <Badge variant="secondary" className="text-[10px]">This device</Badge>
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">Active now</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      leftIcon={signOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      onClick={handleSignOutAll}
                      disabled={signOutLoading}
                    >
                      {signOutLoading ? "Signing out…" : "Sign Out of All Devices"}
                    </Button>
                    <p className="text-xs text-text-muted mt-2">
                      This revokes all refresh tokens globally — you&apos;ll be redirected to login.
                    </p>
                  </div>
                </Section>

                <Section title="Danger Zone">
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted">
                      Permanently deletes your account, all projects, credits, and profile data. This cannot be undone.
                    </p>
                    <Input
                      label={`Type your email to confirm: ${user?.email ?? ""}`}
                      value={deleteInput}
                      placeholder={user?.email ?? "your@email.com"}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button
                      variant="destructive"
                      leftIcon={deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      disabled={deleteInput !== (user?.email ?? "") || deleteLoading}
                      onClick={handleDeleteAccount}
                    >
                      {deleteLoading ? "Deleting…" : "Permanently Delete Account"}
                    </Button>
                  </div>
                </Section>
              </>
            )}

            {/* ════ APPEARANCE ════ */}
            {activeTab === "appearance" && (
              <Section title="Appearance" desc="Theme preference is saved to your account and synced across devices.">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-text-primary">Theme</p>
                      {themeSaving && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-w-sm">
                      {[
                        { id: "light",  label: "Light",  icon: Sun     },
                        { id: "dark",   label: "Dark",   icon: Moon    },
                        { id: "system", label: "System", icon: Monitor },
                      ].map((t) => {
                        const Icon   = t.icon;
                        const active = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all",
                              active
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-surface-2 text-text-muted hover:border-accent/30 hover:text-text-secondary"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* ════ API KEYS ════ */}
            {activeTab === "api" && (
              <>
                <Section title="API Keys" desc="Never share your API key publicly or commit it to source code.">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border">
                      <div className="min-w-0 mr-4">
                        <p className="text-sm font-medium text-text-primary">Production Key</p>
                        <p className="text-xs text-text-muted font-mono mt-1 truncate">
                          {keyVisible ? apiKey : "sm_prod_" + "•".repeat(24)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setKeyVisible((v) => !v)}>
                          {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Copy className="w-4 h-4" />} onClick={handleCopyKey}>
                          Copy
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      leftIcon={genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      onClick={handleGenerateKey} disabled={genLoading}
                    >
                      {genLoading ? "Generating…" : "Regenerate Key"}
                    </Button>
                  </div>
                </Section>

                <Section title="Rate Limits" desc="Based on your current plan.">
                  <div className="divide-y divide-border">
                    {[
                      { label: "Script Analysis",  limit: "10 / day",    note: "All plans" },
                      { label: "Story Generation", limit: "Unlimited",    note: "Within credits" },
                      { label: "AI Dialogue",       limit: "Unlimited",   note: "Within credits" },
                      { label: "Scene Visualizer",  limit: "Unlimited",   note: "Within credits" },
                      { label: "Finance Reports",   limit: planKey === "free" ? "1 trial" : "Unlimited", note: planKey === "free" ? "Free plan" : "Paid plan" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <p className="text-sm text-text-secondary">{r.label}</p>
                        <div className="text-right">
                          <p className="text-xs font-medium text-text-primary">{r.limit}</p>
                          <p className="text-[10px] text-text-muted">{r.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

          </motion.div>
        </div>
      </div>
    </>
  );
}
