import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Project, Script } from "./types";
import { createClient } from "./supabase-browser";

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
  userId: string | null;

  setProjects:      (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setUserId:        (userId: string | null) => void;
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
      userId: null,

      setProjects:      (projects) => set({ projects }),
      setActiveProject: (project) => set({ activeProject: project }),
      setUserId:        (userId) => set({ userId }),

      addProject: (project) => {
        set((state) => ({ projects: [project, ...state.projects] }));

        const userId = get().userId;
        if (userId && userId !== "anonymous") {
          const supabase = createClient();
          supabase.from("projects").insert({
            id: project.id,
            user_id: userId,
            name: project.name,
            description: project.description,
            type: project.type,
            status: project.status,
            genre: project.genre,
            tags: project.tags,
            word_count: project.wordCount,
            target_word_count: project.targetWordCount,
            script_id: project.scriptId,
            budget: project.budget,
            notes: project.notes,
            created_at: project.createdAt,
            updated_at: project.updatedAt,
          }).then(({ error }) => {
            if (error) {
              console.error("[useProjectStore] Failed to insert project to Supabase:", error.message, error.details, error.hint);
            } else {
              console.log("[useProjectStore] Successfully synced project creation to Supabase.");
            }
          });
        }
      },

      updateProject: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p
          ),
          activeProject: state.activeProject?.id === id
            ? { ...state.activeProject, ...updates, updatedAt: now }
            : state.activeProject,
        }));

        const userId = get().userId;
        if (userId && userId !== "anonymous") {
          const supabase = createClient();
          supabase.from("projects").update({
            name: updates.name,
            description: updates.description,
            type: updates.type,
            status: updates.status,
            genre: updates.genre,
            tags: updates.tags,
            word_count: updates.wordCount,
            target_word_count: updates.targetWordCount,
            script_id: updates.scriptId,
            budget: updates.budget,
            notes: updates.notes,
            updated_at: now,
          }).eq("id", id).then(({ error }) => {
            if (error) {
              console.error("[useProjectStore] Failed to update project in Supabase:", error.message, error.details, error.hint);
            } else {
              console.log("[useProjectStore] Successfully synced project update to Supabase.");
            }
          });
        }
      },

      removeProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProject: state.activeProject?.id === id ? null : state.activeProject,
        }));

        const userId = get().userId;
        if (userId && userId !== "anonymous") {
          const supabase = createClient();
          supabase.from("projects").delete().eq("id", id).then(({ error }) => {
            if (error) {
              console.error("[useProjectStore] Failed to delete project from Supabase:", error.message, error.details, error.hint);
            } else {
              console.log("[useProjectStore] Successfully synced project deletion to Supabase.");
            }
          });
        }
      },

      duplicateProject: (id) => {
        const original = get().projects.find((p) => p.id === id);
        if (!original) return;
        const now = new Date().toISOString();
        const copy: Project = {
          ...original,
          id: `proj-${Date.now()}`,
          name: `${original.name} (Copy)`,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ projects: [copy, ...state.projects] }));

        const userId = get().userId;
        if (userId && userId !== "anonymous") {
          const supabase = createClient();
          supabase.from("projects").insert({
            id: copy.id,
            user_id: userId,
            name: copy.name,
            description: copy.description,
            type: copy.type,
            status: copy.status,
            genre: copy.genre,
            tags: copy.tags,
            word_count: copy.wordCount,
            target_word_count: copy.targetWordCount,
            script_id: copy.scriptId,
            budget: copy.budget,
            notes: copy.notes,
            created_at: copy.createdAt,
            updated_at: copy.updatedAt,
          }).then(({ error }) => {
            if (error) {
              console.error("[useProjectStore] Failed to duplicate project in Supabase:", error.message, error.details, error.hint);
            } else {
              console.log("[useProjectStore] Successfully synced duplicated project to Supabase.");
            }
          });
        }
      },
    }),
    {
      name: "scriptmind-projects:anonymous",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Dynamic user session storage isolation
if (typeof window !== "undefined") {
  const supabase = createClient();

  const syncProjectsUser = async (userId: string) => {
    const name = `scriptmind-projects:${userId}`;
    
    // Explicitly reset the in-memory store state to prevent cross-user leakage
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      userId: userId,
    });

    useProjectStore.persist.setOptions({ name });
    useProjectStore.persist.rehydrate();

    // If authenticated user, sync from Supabase database table
    if (userId !== "anonymous") {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[useProjectStore] error syncing from Supabase:", error);
          return;
        }

        if (data) {
          const dbProjects: Project[] = (data as Array<Record<string, unknown>>).map((p) => ({
            id: p.id as string,
            name: p.name as string,
            description: p.description as string,
            type: p.type as Project["type"],
            status: p.status as Project["status"],
            genre: (p.genre as string) || undefined,
            tags: (p.tags as string[]) || [],
            createdAt: p.created_at as string,
            updatedAt: p.updated_at as string,
            wordCount: (p.word_count as number) || undefined,
            targetWordCount: (p.target_word_count as number) || undefined,
            scriptId: (p.script_id as string) || undefined,
            budget: p.budget ? parseFloat(p.budget as string) : undefined,
            notes: (p.notes as string) || undefined,
          }));

          useProjectStore.setState({
            projects: dbProjects,
            activeProject: dbProjects.length > 0 ? dbProjects[0] : null,
          });
        }
      } catch (err) {
        console.error("[useProjectStore] failed to fetch projects from Supabase:", err);
      }
    }
  };

  // Sync initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    const userId = session?.user?.id ?? "anonymous";
    syncProjectsUser(userId);
  });

  // Listen for login/logout events
  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id ?? "anonymous";
    syncProjectsUser(userId);
  });
}
