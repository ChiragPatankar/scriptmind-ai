import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Project, Script } from "./types";

// ─── UI Store ───────────────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  searchQuery: string;
  activeModal: string | null;
  notifications: Notification[];

  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  theme: "dark",
  searchQuery: "",
  activeModal: null,
  notifications: [],

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// ─── Auth Store ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// ─── Script Store ─────────────────────────────────────────────────────────────

interface ScriptState {
  scripts: Script[];
  selectedScript: Script | null;
  searchResults: Script[];
  isSearching: boolean;

  setScripts: (scripts: Script[]) => void;
  setSelectedScript: (script: Script | null) => void;
  setSearchResults: (results: Script[]) => void;
  setIsSearching: (searching: boolean) => void;
}

export const useScriptStore = create<ScriptState>()((set) => ({
  scripts: [],
  selectedScript: null,
  searchResults: [],
  isSearching: false,

  setScripts: (scripts) => set({ scripts }),
  setSelectedScript: (script) => set({ selectedScript: script }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (searching) => set({ isSearching: searching }),
}));

// ─── Project Store ────────────────────────────────────────────────────────────

const SEED_PROJECTS: Project[] = [
  {
    id: "seed-1",
    name: "Mumbai Monsoon",
    description: "A romantic drama set during Mumbai rains about two strangers who meet on a local train and discover an unexpected connection.",
    type: "screenplay",
    status: "in-progress",
    genre: "Romantic Drama",
    tags: ["Mumbai", "Romance", "Drama"],
    wordCount: 12400,
    targetWordCount: 18000,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "seed-2",
    name: "Dialogue Analysis — Sholay",
    description: "Deep analysis of iconic Sholay dialogues, character voice mapping, sentiment flow and originality scoring.",
    type: "analysis",
    status: "completed",
    genre: "Action",
    tags: ["Classic", "Analysis", "Bollywood"],
    wordCount: 4200,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "seed-3",
    name: "Villain Monologue Pack",
    description: "AI-generated villain dialogues for a period Mughal drama — intense, poetic, and menacing. 12 scenes written.",
    type: "dialogue",
    status: "draft",
    genre: "Period Drama",
    tags: ["Villain", "Dialogue", "Mughal"],
    wordCount: 3200,
    targetWordCount: 8000,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "seed-4",
    name: "Heist in Delhi",
    description: "A fast-paced heist thriller set in Connaught Place. Think Bollywood meets Ocean's Eleven — with a desi twist.",
    type: "story",
    status: "draft",
    genre: "Thriller",
    tags: ["Heist", "Delhi", "Thriller"],
    wordCount: 5800,
    targetWordCount: 20000,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    budget: 450000,
  },
  {
    id: "seed-5",
    name: "Comedy of Errors — Punjabi",
    description: "A laugh-out-loud family comedy set at a Punjabi wedding. Mistaken identities, chaotic families, and unexpected love.",
    type: "screenplay",
    status: "completed",
    genre: "Comedy",
    tags: ["Comedy", "Punjabi", "Family"],
    wordCount: 16800,
    targetWordCount: 16000,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  _seeded: boolean;

  setProjects:        (projects: Project[]) => void;
  setActiveProject:   (project: Project | null) => void;
  addProject:         (project: Project) => void;
  updateProject:      (id: string, updates: Partial<Project>) => void;
  removeProject:      (id: string) => void;
  duplicateProject:   (id: string) => void;
  initializeDefaults: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProject: null,
      _seeded: false,

      setProjects:      (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProject: state.activeProject?.id === id ? null : state.activeProject,
        })),

      duplicateProject: (id) => {
        const original = get().projects.find((p) => p.id === id);
        if (!original) return;
        const copy: Project = {
          ...original,
          id: `proj-${Date.now()}`,
          name: `${original.name} (Copy)`,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ projects: [copy, ...state.projects] }));
      },

      initializeDefaults: () => {
        const { projects, _seeded } = get();
        if (!_seeded && projects.length === 0) {
          set({ projects: SEED_PROJECTS, _seeded: true });
        }
      },
    }),
    {
      name: "scriptmind-projects",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
