"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Film, MessageSquare, BarChart3, BookOpen,
  DollarSign, Clock, CheckCircle2, FileEdit, Trash2,
  Calendar, Type, Tag, StickyNote, Target,
  Sparkles, PenLine, TrendingUp, Play, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/types";
import { useProjectStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalBody, ModalFooter,
} from "@/components/ui/modal";

// ── Config (same as projects list page) ──────────────────────────────────────

const TYPE_CONFIG = {
  story:      { icon: BookOpen,      color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  label: "Story",      border: "rgba(245,158,11,0.3)" },
  screenplay: { icon: Film,          color: "#1D77C5", bg: "rgba(29,119,197,0.12)",  label: "Screenplay", border: "rgba(29,119,197,0.3)" },
  dialogue:   { icon: MessageSquare, color: "#00C2E0", bg: "rgba(0,194,224,0.12)",   label: "Dialogue",   border: "rgba(0,194,224,0.3)" },
  analysis:   { icon: BarChart3,     color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "Analysis",   border: "rgba(167,139,250,0.3)" },
} as const;

const STATUS_CONFIG = {
  draft:         { label: "Draft",       variant: "secondary" as const, icon: FileEdit,     color: "#6B7280" },
  "in-progress": { label: "In Progress", variant: "warning"   as const, icon: Clock,        color: "#F59E0B" },
  completed:     { label: "Completed",   variant: "success"   as const, icon: CheckCircle2, color: "#22C55E" },
  archived:      { label: "Archived",    variant: "outline"   as const, icon: FileEdit,     color: "#6B7280" },
} as const;

// ── Quick action tools ────────────────────────────────────────────────────────

const TOOLS = [
  {
    icon: PenLine,
    label: "Open Script Studio",
    desc: "Write and edit your screenplay",
    color: "#1D77C5",
    bg: "rgba(29,119,197,0.1)",
    border: "rgba(29,119,197,0.25)",
    href: "/dialogue",
  },
  {
    icon: MessageSquare,
    label: "Generate Dialogue",
    desc: "AI-powered scene dialogue",
    color: "#00C2E0",
    bg: "rgba(0,194,224,0.1)",
    border: "rgba(0,194,224,0.25)",
    href: "/dialogue",
  },
  {
    icon: BarChart3,
    label: "Analyse Script",
    desc: "Emotional flow & originality",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.25)",
    href: "/analyse",
  },
  {
    icon: DollarSign,
    label: "Plan Budget",
    desc: "Budget & revenue forecast",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    href: "/download-scripts",
  },
  {
    icon: TrendingUp,
    label: "Create Story",
    desc: "Expand your concept",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    href: "/create-story",
  },
  {
    icon: Play,
    label: "Download Script",
    desc: "Export as PDF / Final Draft",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.1)",
    border: "rgba(236,72,153,0.25)",
    href: "/download-scripts",
  },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-black text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteModal({ open, name, onClose, onConfirm }: {
  open: boolean; name: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <ModalContent className="max-w-[400px]">
        <ModalHeader>
          <ModalTitle>Delete Project</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">&ldquo;{name}&rdquo;</span>?
            This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={onConfirm}>
            Delete Project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { projects, updateProject, removeProject, duplicateProject } = useProjectStore();

  const [project, setProject] = useState<Project | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  // Hydrate from store
  useEffect(() => {
    const found = projects.find((p) => p.id === params.id);
    if (found) {
      setProject(found);
      setNotesValue(found.notes ?? "");
    }
  }, [projects, params.id]);

  const handleSaveNotes = () => {
    if (!project) return;
    updateProject(project.id, { notes: notesValue.trim() || undefined });
    setNotesDirty(false);
  };

  const handleDelete = () => {
    if (!project) return;
    removeProject(project.id);
    router.push("/projects");
  };

  const handleDuplicate = () => {
    if (!project) return;
    duplicateProject(project.id);
    router.push("/projects");
  };

  // Not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "rgba(29,119,197,0.1)", border: "1px solid rgba(29,119,197,0.2)" }}>
          <Film className="w-7 h-7 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Project not found</h2>
        <p className="text-sm text-text-muted mb-6">This project may have been deleted or doesn&apos;t exist.</p>
        <Link href="/projects">
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />} variant="secondary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const type   = TYPE_CONFIG[project.type];
  const status = STATUS_CONFIG[project.status];
  const TypeIcon   = type.icon;
  const StatusIcon = status.icon;
  const progress   = project.targetWordCount && project.wordCount
    ? Math.min(Math.round((project.wordCount / project.targetWordCount) * 100), 100)
    : null;

  return (
    <div>
      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-8 text-sm"
      >
        <Link href="/projects" className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          My Projects
        </Link>
        <span className="text-text-muted/40">/</span>
        <span className="text-text-primary font-medium truncate max-w-xs">{project.name}</span>
      </motion.div>

      {/* ── Project Header ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-6 mb-8"
        style={{ background: "rgba(16,16,26,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Top accent line */}
        <div className="h-0.5 rounded-full mb-5" style={{ background: `linear-gradient(90deg, ${type.color}, ${type.color}30, transparent)` }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: type.bg, border: `1px solid ${type.border}` }}>
            <TypeIcon className="w-7 h-7" style={{ color: type.color }} />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: type.color }}>{type.label}</span>
              {project.genre && (
                <span className="text-[11px] px-2 py-0.5 rounded-full text-text-muted" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {project.genre}
                </span>
              )}
              <Badge variant={status.variant} className="text-[10px]">
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight leading-tight">{project.name}</h1>
            <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{project.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              onClick={handleDuplicate}
            >
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex justify-between mb-2 text-xs">
              <span className="text-text-muted">Writing Progress</span>
              <span className="font-semibold" style={{ color: type.color }}>
                {project.wordCount?.toLocaleString()} / {project.targetWordCount?.toLocaleString()} words ({progress}%)
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, ${type.color}80, ${type.color})` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: Tools + Stats ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS.map((tool) => (
                <Link href={tool.href} key={tool.label}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="group p-4 rounded-xl cursor-pointer transition-all duration-200"
                    style={{ background: tool.bg, border: `1px solid ${tool.border}` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${tool.color}20`, border: `1px solid ${tool.color}30` }}>
                      <tool.icon className="w-4 h-4" style={{ color: tool.color }} />
                    </div>
                    <p className="text-sm font-semibold text-text-primary leading-snug mb-0.5">{tool.label}</p>
                    <p className="text-xs text-text-muted">{tool.desc}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-accent" />
                Project Notes
              </h2>
              {notesDirty && (
                <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <textarea
                className="w-full p-4 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-accent/20 rounded-2xl transition-all min-h-[160px]"
                placeholder="Add private notes, ideas, reminders about this project..."
                value={notesValue}
                onChange={(e) => { setNotesValue(e.target.value); setNotesDirty(true); }}
              />
            </div>
          </motion.div>
        </div>

        {/* ── Right: Project Info ─────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard icon={Type}      label="Type"    value={type.label}    color={type.color} />
            <StatCard icon={StatusIcon} label="Status"  value={status.label}  color={status.color} />
            {project.wordCount !== undefined && (
              <StatCard icon={BookOpen}  label="Words"   value={project.wordCount.toLocaleString()} sub="written" color="#1D77C5" />
            )}
            {project.targetWordCount && (
              <StatCard icon={Target}   label="Target"  value={project.targetWordCount.toLocaleString()} sub="goal" color="#00C2E0" />
            )}
          </motion.div>

          {/* Details card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl p-5"
            style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Project Info</h3>
            <div className="space-y-3">
              <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Created" value={formatDate(project.createdAt)} />
              <InfoRow icon={<Clock className="w-3.5 h-3.5" />}    label="Updated" value={formatDate(project.updatedAt)} />
              {project.genre && <InfoRow icon={<Film className="w-3.5 h-3.5" />} label="Genre" value={project.genre} />}
              {project.tags && project.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full text-text-muted"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.budget !== undefined && (
                <InfoRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Budget" value={`₹${project.budget.toLocaleString()}`} />
              )}
            </div>
          </motion.div>

          {/* Status changer */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5"
            style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Change Status</h3>
            <div className="space-y-1.5">
              {(Object.keys(STATUS_CONFIG) as Project["status"][]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const active = project.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateProject(project.id, { status: s })}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: active ? `${cfg.color}18` : "rgba(255,255,255,0.03)",
                      border: active ? `1px solid ${cfg.color}40` : "1px solid transparent",
                      color: active ? cfg.color : "rgba(255,255,255,0.45)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <cfg.icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>
                    {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Delete modal ──────────────────────────────────────────────── */}
      <DeleteModal
        open={deleteOpen}
        name={project.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted flex-shrink-0">{icon}</span>
      <span className="text-xs text-text-muted flex-shrink-0 w-16">{label}</span>
      <span className="text-xs text-text-secondary font-medium truncate">{value}</span>
    </div>
  );
}
