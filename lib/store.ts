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

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;

  setProjects:      (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  addProject:       (project: Project) => void;
  updateProject:    (id: string, updates: Partial<Project>) => void;
  removeProject:    (id: string) => void;
  duplicateProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProject: null,

      setProjects:      (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),

      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),

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
    }),
    {
      name: "scriptmind-projects",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
