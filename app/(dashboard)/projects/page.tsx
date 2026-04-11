"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, BarChart3, MessageSquare, Clock,
  CheckCircle2, FileEdit, Trash2, MoreHorizontal, Grid3X3,
  List, X, Film, Copy, ArrowUpRight, Sparkles, FolderOpen,
  ChevronDown, Archive, BookOpen, Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalBody, ModalFooter,
} from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { Project } from "@/lib/types";
import { useProjectStore } from "@/lib/store";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  story:      { icon: BookOpen,     color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  label: "Story",      border: "rgba(245,158,11,0.25)" },
  screenplay: { icon: Film,         color: "#1D77C5", bg: "rgba(29,119,197,0.12)",  label: "Screenplay", border: "rgba(29,119,197,0.25)" },
  dialogue:   { icon: MessageSquare,color: "#00C2E0", bg: "rgba(0,194,224,0.12)",   label: "Dialogue",   border: "rgba(0,194,224,0.25)" },
  analysis:   { icon: BarChart3,    color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "Analysis",   border: "rgba(167,139,250,0.25)" },
} as const;

const STATUS_CONFIG = {
  draft:        { label: "Draft",       variant: "secondary" as const, icon: FileEdit,    color: "#6B7280" },
  "in-progress":{ label: "In Progress", variant: "warning"   as const, icon: Clock,       color: "#F59E0B" },
  completed:    { label: "Completed",   variant: "success"   as const, icon: CheckCircle2,color: "#22C55E" },
  archived:     { label: "Archived",    variant: "outline"   as const, icon: Archive,     color: "#6B7280" },
} as const;

const SORT_OPTIONS = [
  { value: "updated",  label: "Last Updated" },
  { value: "created",  label: "Date Created" },
  { value: "name",     label: "Name (A–Z)" },
  { value: "words",    label: "Word Count" },
] as const;
type SortKey = typeof SORT_OPTIONS[number]["value"];

const TYPE_FILTERS = [
  { value: "all",        label: "All Types" },
  { value: "screenplay", label: "Screenplay" },
  { value: "story",      label: "Story" },
  { value: "dialogue",   label: "Dialogue" },
  { value: "analysis",   label: "Analysis" },
] as const;
type TypeFilter = typeof TYPE_FILTERS[number]["value"];

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastData { id: string; type: "success" | "error" | "info"; message: string; }

function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const show = useCallback((type: ToastData["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastList({ toasts }: { toasts: ToastData[] }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex flex-col gap-2 items-stretch sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-sm font-medium w-full sm:w-auto sm:max-w-xs break-words"
            style={{
              background: t.type === "success" ? "rgba(34,197,94,0.18)" : t.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(29,119,197,0.18)",
              border: `1px solid ${t.type === "success" ? "rgba(34,197,94,0.35)" : t.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(29,119,197,0.35)"}`,
              backdropFilter: "blur(16px)",
              color: t.type === "success" ? "#22C55E" : t.type === "error" ? "#F87171" : "#5BA8E5",
            }}
          >
            {t.type === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <Sparkles className="w-4 h-4 flex-shrink-0" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Project Form (Create / Edit) ──────────────────────────────────────────────

type ProjectFormData = {
  name: string; description: string;
  type: Project["type"]; status: Project["status"];
  genre: string; notes: string;
  targetWordCount: string;
};

const EMPTY_FORM: ProjectFormData = {
  name: "", description: "", type: "screenplay", status: "draft",
  genre: "", notes: "", targetWordCount: "",
};

function projectToForm(p: Project): ProjectFormData {
  return {
    name: p.name, description: p.description,
    type: p.type, status: p.status,
    genre: p.genre ?? "", notes: p.notes ?? "",
    targetWordCount: p.targetWordCount ? String(p.targetWordCount) : "",
  };
}

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave: (data: ProjectFormData) => void;
}

function ProjectModal({ open, onClose, project, onSave }: ProjectModalProps) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({});

  useEffect(() => {
    if (open) {
      setForm(project ? projectToForm(project) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, project]);

  const set = (field: keyof ProjectFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const e: Partial<ProjectFormData> = {};
    if (!form.name.trim()) e.name = "Project name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const inputClass = "w-full h-10 px-3 rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent/60 bg-surface-2 border border-border"
  const selectClass = `${inputClass} cursor-pointer appearance-none`
  const fieldStyle = {}

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <ModalContent className="max-w-[520px]">
        <ModalHeader>
          <ModalTitle>{project ? "Edit Project" : "Create New Project"}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                style={fieldStyle}
                placeholder="e.g. Mumbai Monsoon"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea
                className={`${inputClass} h-20 resize-none py-2.5`}
                style={fieldStyle}
                placeholder="Brief description of your project..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            {/* Type + Genre row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Type</label>
                <div className="relative">
                  <select className={selectClass} style={fieldStyle} value={form.type} onChange={(e) => set("type", e.target.value as Project["type"])}>
                    <option value="screenplay">Screenplay</option>
                    <option value="story">Story</option>
                    <option value="dialogue">Dialogue</option>
                    <option value="analysis">Analysis</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Status</label>
                <div className="relative">
                  <select className={selectClass} style={fieldStyle} value={form.status} onChange={(e) => set("status", e.target.value as Project["status"])}>
                    <option value="draft">Draft</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Genre + Target words row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Genre</label>
                <input
                  className={inputClass}
                  style={fieldStyle}
                  placeholder="e.g. Drama, Thriller"
                  value={form.genre}
                  onChange={(e) => set("genre", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Target Word Count</label>
                <input
                  className={inputClass}
                  style={fieldStyle}
                  type="number"
                  placeholder="e.g. 15000"
                  value={form.targetWordCount}
                  onChange={(e) => set("targetWordCount", e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Notes</label>
              <textarea
                className={`${inputClass} h-16 resize-none py-2.5`}
                style={fieldStyle}
                placeholder="Private notes about this project..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" leftIcon={project ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}>
              {project ? "Save Changes" : "Create Project"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ project, onClose, onConfirm }: { project: Project | null; onClose: () => void; onConfirm: () => void; }) {
  return (
    <Modal open={!!project} onOpenChange={(v) => { if (!v) onClose(); }}>
      <ModalContent className="max-w-[400px]">
        <ModalHeader>
          <ModalTitle>Delete Project</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">&ldquo;{project?.name}&rdquo;</span>?
            This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={onConfirm}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────

interface ContextMenuProps {
  project: Project;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStatusChange: (status: Project["status"]) => void;
}

function ContextMenu({ project, onEdit, onDuplicate, onDelete, onStatusChange }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const statuses: Project["status"][] = ["draft", "in-progress", "completed", "archived"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-50 w-48 rounded-xl py-1 shadow-glass bg-surface border border-border"
            style={{ backdropFilter: "blur(20px)" }}
          >
            <MenuItem icon={<ArrowUpRight className="w-3.5 h-3.5" />} onClick={() => { setOpen(false); }}>
              <Link href={`/projects/${project.id}`} className="w-full text-left">Open Project</Link>
            </MenuItem>
            <MenuItem icon={<FileEdit className="w-3.5 h-3.5" />} onClick={() => { setOpen(false); onEdit(); }}>Edit Details</MenuItem>
            <MenuItem icon={<Copy className="w-3.5 h-3.5" />} onClick={() => { setOpen(false); onDuplicate(); }}>Duplicate</MenuItem>
            <div className="h-px bg-border my-1" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Change Status</p>
            {statuses.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = project.status === s;
              return (
                <MenuItem
                  key={s}
                  icon={active ? <Check className="w-3.5 h-3.5" style={{ color: cfg.color }} /> : <span className="w-3.5 h-3.5" />}
                  onClick={() => { setOpen(false); onStatusChange(s); }}
                  active={active}
                >
                  {cfg.label}
                </MenuItem>
              );
            })}
            <div className="h-px bg-border my-1" />
            <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} danger onClick={() => { setOpen(false); onDelete(); }}>Delete</MenuItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger, active }: {
  icon: React.ReactNode; children: React.ReactNode;
  onClick?: () => void; danger?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
        danger ? "text-red-400 hover:bg-red-500/10" : active ? "text-text-primary bg-surface-2" : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
      }`}
    >
      <span className={danger ? "text-red-400" : "text-text-muted"}>{icon}</span>
      {children}
    </button>
  );
}

// ── Project Card (Grid) ───────────────────────────────────────────────────────

function ProjectCard({ project, onEdit, onDelete, onDuplicate, onStatusChange }: {
  project: Project;
  onEdit: () => void; onDelete: () => void;
  onDuplicate: () => void; onStatusChange: (s: Project["status"]) => void;
}) {
  const type   = TYPE_CONFIG[project.type];
  const status = STATUS_CONFIG[project.status];
  const TypeIcon = type.icon;
  const progress = project.targetWordCount && project.wordCount
    ? Math.min(Math.round((project.wordCount / project.targetWordCount) * 100), 100)
    : null;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="group relative rounded-2xl flex flex-col h-full overflow-hidden cursor-default"
      style={{
        background: "var(--card-bg)",
        border: `1px solid ${type.border}`,
        boxShadow: `0 2px 12px rgba(0,0,0,0.12), 0 0 0 0 ${type.color}00`,
        transition: "box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.18), 0 0 24px ${type.color}14`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"; }}
    >
      {/* Colored top gradient bar */}
      <div className="h-[3px] w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${type.color}cc, ${type.color}44, transparent)` }} />

      {/* Subtle background gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: `radial-gradient(circle at 80% 0%, ${type.color}0c, transparent 65%)` }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: type.bg, border: `1px solid ${type.border}` }}>
              <TypeIcon className="w-4 h-4" style={{ color: type.color }} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: type.color }}>{type.label}</span>
              {project.genre && <p className="text-[10px] text-text-muted leading-none mt-0.5">{project.genre}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={status.variant} className="text-[10px] px-2 py-0.5 h-5">
              {status.label}
            </Badge>
            <ContextMenu
              project={project}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>

        {/* Name + description */}
        <div className="flex-1 mb-4">
          <Link href={`/projects/${project.id}`}
            className="text-base font-bold text-text-primary hover:text-accent transition-colors line-clamp-1 mb-1.5 block"
          >
            {project.name}
          </Link>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{project.description}</p>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="mb-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-text-muted">{project.wordCount?.toLocaleString()} / {project.targetWordCount?.toLocaleString()} words</span>
              <span className="text-[11px] font-bold" style={{ color: type.color }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-surface-3">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, ${type.color}80, ${type.color})` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Updated {formatDate(project.updatedAt)}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="Edit"
            >
              <FileEdit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Project Row (List) ────────────────────────────────────────────────────────

function ProjectRow({ project, onEdit, onDelete, onDuplicate, onStatusChange }: {
  project: Project;
  onEdit: () => void; onDelete: () => void;
  onDuplicate: () => void; onStatusChange: (s: Project["status"]) => void;
}) {
  const type   = TYPE_CONFIG[project.type];
  const status = STATUS_CONFIG[project.status];
  const TypeIcon = type.icon;

  return (
    <motion.div
      layout
      whileHover={{ x: 3, transition: { duration: 0.15 } }}
      className="group flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-border/80 hover:bg-surface-2 transition-all duration-200"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: type.bg, border: `1px solid ${type.border}` }}>
        <TypeIcon className="w-4 h-4" style={{ color: type.color }} />
      </div>

      {/* Name + desc */}
      <div className="flex-1 min-w-0">
        <Link href={`/projects/${project.id}`}
          className="text-sm font-bold text-text-primary hover:text-accent transition-colors block truncate"
        >
          {project.name}
        </Link>
        <p className="text-xs text-text-muted truncate mt-0.5">{project.description}</p>
      </div>

      {/* Meta */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-medium px-2 py-0.5 rounded-lg" style={{ color: type.color, background: type.bg }}>
          {type.label}
        </span>
      </div>

      <Badge variant={status.variant} className="text-[10px] flex-shrink-0 hidden sm:flex">{status.label}</Badge>

      {project.wordCount && (
        <span className="text-xs text-text-muted flex-shrink-0 hidden lg:block">
          {project.wordCount.toLocaleString()} words
        </span>
      )}

      <span className="text-xs text-text-muted flex-shrink-0 hidden md:block">
        {formatDate(project.updatedAt)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
        >
          <FileEdit className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <ContextMenu project={project} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} onStatusChange={onStatusChange} />
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { projects, addProject, updateProject, removeProject, duplicateProject, initializeDefaults } = useProjectStore();
  const { toasts, show: showToast } = useToast();

  // Initialize seed data on first load
  useEffect(() => { initializeDefaults(); }, [initializeDefaults]);

  // Local UI state
  const [search,        setSearch]        = useState("");
  const [typeFilter,    setTypeFilter]    = useState<TypeFilter>("all");
  const [sortBy,        setSortBy]        = useState<SortKey>("updated");
  const [viewMode,      setViewMode]      = useState<"grid" | "list">("grid");
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editProject,   setEditProject]   = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [sortOpen,      setSortOpen]      = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter + sort
  const filtered = React.useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.genre?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    list.sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "name")    return a.name.localeCompare(b.name);
      if (sortBy === "words")   return (b.wordCount ?? 0) - (a.wordCount ?? 0);
      return 0;
    });
    return list;
  }, [projects, search, typeFilter, sortBy]);

  // Stats
  const stats = React.useMemo(() => ({
    total:      projects.length,
    inProgress: projects.filter((p) => p.status === "in-progress").length,
    completed:  projects.filter((p) => p.status === "completed").length,
    drafts:     projects.filter((p) => p.status === "draft").length,
    totalWords: projects.reduce((acc, p) => acc + (p.wordCount ?? 0), 0),
  }), [projects]);

  // Handlers
  const handleCreate = (data: ProjectFormData) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: data.name.trim(),
      description: data.description.trim(),
      type: data.type,
      status: data.status,
      genre: data.genre.trim() || undefined,
      notes: data.notes.trim() || undefined,
      targetWordCount: data.targetWordCount ? parseInt(data.targetWordCount) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    addProject(project);
    setCreateOpen(false);
    showToast("success", `Project "${project.name}" created`);
  };

  const handleEdit = (data: ProjectFormData) => {
    if (!editProject) return;
    updateProject(editProject.id, {
      name: data.name.trim(),
      description: data.description.trim(),
      type: data.type,
      status: data.status,
      genre: data.genre.trim() || undefined,
      notes: data.notes.trim() || undefined,
      targetWordCount: data.targetWordCount ? parseInt(data.targetWordCount) : undefined,
    });
    setEditProject(null);
    showToast("success", "Project updated");
  };

  const handleDelete = () => {
    if (!deleteProject) return;
    removeProject(deleteProject.id);
    showToast("info", `"${deleteProject.name}" deleted`);
    setDeleteProject(null);
  };

  const handleDuplicate = (project: Project) => {
    duplicateProject(project.id);
    showToast("success", `"${project.name}" duplicated`);
  };

  const handleStatusChange = (project: Project, status: Project["status"]) => {
    updateProject(project.id, { status });
    showToast("success", `Status changed to ${STATUS_CONFIG[status].label}`);
  };

  const statCards = [
    {
      label: "Total Projects", value: stats.total,
      color: "#5BA8E5",  icon: FolderOpen,
      bg: "rgba(29,119,197,0.12)", border: "rgba(29,119,197,0.22)",
      glow: "rgba(29,119,197,0.08)", sub: "all time",
    },
    {
      label: "In Progress",    value: stats.inProgress,
      color: "#F59E0B",  icon: Clock,
      bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.22)",
      glow: "rgba(245,158,11,0.08)", sub: "active now",
    },
    {
      label: "Completed",      value: stats.completed,
      color: "#22C55E",  icon: CheckCircle2,
      bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.22)",
      glow: "rgba(34,197,94,0.08)", sub: "finished",
    },
    {
      label: "Total Words",    value: stats.totalWords.toLocaleString(),
      color: "#A78BFA",  icon: Sparkles,
      bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.22)",
      glow: "rgba(167,139,250,0.08)", sub: "written",
    },
  ];

  return (
    <div className="min-h-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-1">My Projects</h1>
          <p className="text-sm text-text-muted">
            {stats.total} project{stats.total !== 1 ? "s" : ""} &middot; {stats.completed} completed &middot; {stats.totalWords.toLocaleString()} words written
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateOpen(true)}
        >
          New Project
        </Button>
      </motion.div>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="rounded-2xl p-5 relative overflow-hidden cursor-default"
              style={{
                background: "var(--card-bg)",
                border: `1px solid ${s.border}`,
                boxShadow: `0 4px 24px ${s.glow}, 0 1px 0 ${s.border} inset`,
              }}
            >
              {/* Colored top bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />

              {/* Ambient glow blob */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${s.color}18 0%, transparent 70%)` }} />

              {/* Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>

              <div className="text-3xl font-black tracking-tight mb-1" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-sm font-semibold text-text-secondary leading-none">{s.label}</div>
              <div className="text-[11px] text-text-muted mt-1">{s.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Filter / Sort / View Bar ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
      >
        {/* Type filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0 bg-surface-2 border border-border">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={typeFilter === f.value
                ? { background: "rgba(29,119,197,0.18)", color: "#5BA8E5", border: "1px solid rgba(29,119,197,0.35)" }
                : { color: "rgb(var(--text-m-rgb))", border: "1px solid transparent" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full h-9 pl-9 pr-8 rounded-xl text-sm bg-surface-2 border border-border text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative flex-shrink-0">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
            >
              <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-10 z-30 w-44 rounded-xl py-1 shadow-glass bg-surface border border-border"
                  style={{ backdropFilter: "blur(20px)" }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <button key={o.value} onClick={() => { setSortBy(o.value); setSortOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      {o.label}
                      {sortBy === o.value && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-xl overflow-hidden flex-shrink-0 bg-surface-2 border border-border">
            {(["grid", "list"] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className="w-9 h-9 flex items-center justify-center transition-all"
                style={viewMode === v
                  ? { background: "rgba(29,119,197,0.18)", color: "#5BA8E5" }
                  : { color: "rgb(var(--text-m-rgb))" }
                }
              >
                {v === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Results count ──────────────────────────────────────────── */}
      {(search || typeFilter !== "all") && (
        <p className="text-xs text-text-muted mb-4">
          Showing {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
          {typeFilter !== "all" && ` · ${typeFilter}`}
        </p>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(29,119,197,0.1)", border: "1px solid rgba(29,119,197,0.2)" }}>
            <FolderOpen className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {search || typeFilter !== "all" ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
            {search ? `No results for "${search}"` : "Create your first project to get started on your filmmaking journey."}
          </p>
          {!search && typeFilter === "all" && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
              Create First Project
            </Button>
          )}
        </motion.div>
      )}

      {/* ── Projects Grid ──────────────────────────────────────────── */}
      {viewMode === "grid" && filtered.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <ProjectCard
                  project={project}
                  onEdit={() => setEditProject(project)}
                  onDelete={() => setDeleteProject(project)}
                  onDuplicate={() => handleDuplicate(project)}
                  onStatusChange={(s) => handleStatusChange(project, s)}
                />
              </motion.div>
            ))}

            {/* New project card */}
            <motion.div
              key="new-card"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: filtered.length * 0.04 + 0.1 }}
            >
              <button
                onClick={() => setCreateOpen(true)}
                className="w-full min-h-[200px] h-full rounded-2xl border-2 border-dashed border-accent/20 hover:border-accent/50 bg-accent/[0.03] hover:bg-accent/[0.06] flex flex-col items-center justify-center gap-3 group transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 bg-accent/10 border border-accent/25 group-hover:bg-accent/15">
                  <Plus className="w-5 h-5 text-accent" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-text-muted group-hover:text-accent transition-colors">New Project</p>
                  <p className="text-xs text-text-muted/60 mt-0.5">Click to create</p>
                </div>
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Projects List ──────────────────────────────────────────── */}
      {viewMode === "list" && filtered.length > 0 && (
        <motion.div layout className="space-y-2">
          {/* List header */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            <span>Project</span>
            <span>Type</span>
            <span>Status</span>
            <span className="hidden lg:block">Words</span>
            <span className="hidden md:block">Updated</span>
          </div>
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <ProjectRow
                  project={project}
                  onEdit={() => setEditProject(project)}
                  onDelete={() => setDeleteProject(project)}
                  onDuplicate={() => handleDuplicate(project)}
                  onStatusChange={(s) => handleStatusChange(project, s)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <ProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      <ProjectModal open={!!editProject} onClose={() => setEditProject(null)} project={editProject} onSave={handleEdit} />
      <DeleteModal project={deleteProject} onClose={() => setDeleteProject(null)} onConfirm={handleDelete} />

      {/* ── Toast Notifications ────────────────────────────────────── */}
      <ToastList toasts={toasts} />
    </div>
  );
}
