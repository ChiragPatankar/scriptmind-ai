"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, CreditCard, Shield, Palette, Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("Arjun Sharma");
  const [email, setEmail] = useState("arjun@example.com");

  return (
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
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card variant="default" hover={false}>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-black text-white">A</span>
                    </div>
                    <div>
                      <Button variant="secondary" size="sm">Change Avatar</Button>
                      <p className="text-xs text-text-muted mt-1.5">JPG, GIF or PNG. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input label="Username" defaultValue="arjun_sharma" />
                    <Input label="Location" defaultValue="Mumbai, India" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary block mb-1.5">Bio</label>
                    <textarea
                      defaultValue="Screenwriter & filmmaker based in Mumbai. Passionate about Bollywood storytelling."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>

                  <Button leftIcon={<Save className="w-4 h-4" />}>Save Changes</Button>
                </CardContent>
              </Card>
            </div>
          )}

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
                          plan.highlighted
                            ? "border-accent/40 bg-accent/10"
                            : "border-border bg-surface-2"
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

          {!["profile", "billing", "api"].includes(activeTab) && (
            <Card variant="default" hover={false}>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                  {React.createElement(tabs.find(t => t.id === activeTab)?.icon || User, {
                    className: "w-6 h-6 text-text-muted"
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
  );
}
