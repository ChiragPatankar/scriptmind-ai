import {
  Script,
  Project,
  DialogueLine,
  AnalysisResult,
  SearchResult,
  ApiResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.scriptmind.ai/v1";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Script Search
  async searchScripts(
    query: string,
    filters?: {
      genre?: string;
      year?: number;
      language?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    // Placeholder: returns mock data until backend is ready
    return mockSearchScripts(query, filters);
  }

  // Script Upload
  async uploadScript(
    file: File,
    metadata: { title: string; genre: string; year: number }
  ): Promise<Script> {
    // Placeholder: simulates upload response
    return mockUploadScript(file, metadata);
  }

  // Script Download
  async downloadScript(_scriptId: string, _format: "pdf" | "fdx" | "txt"): Promise<Blob> {
    return new Blob(["Script content placeholder"], { type: "text/plain" });
  }

  // AI Dialogue Generation
  async generateDialogue(params: {
    scriptId?: string;
    characters: string[];
    scene: string;
    mood: string;
    language: "hindi" | "english" | "hinglish";
    style?: string;
  }): Promise<DialogueLine[]> {
    // Placeholder: returns mock dialogue
    return mockGenerateDialogue(params);
  }

  // Script Analysis
  async analyseScript(scriptId: string): Promise<AnalysisResult> {
    // Placeholder: returns mock analysis
    return mockAnalyseScript(scriptId);
  }

  // Story Creation
  async createStory(params: {
    title: string;
    genre: string;
    premise: string;
    characters: string[];
    settings: string[];
    tone: string;
  }): Promise<Project> {
    // Placeholder
    return mockCreateStory(params);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return mockGetProjects();
  }

  async getProject(id: string): Promise<Project> {
    const projects = await mockGetProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    return project;
  }

  async createProject(
    data: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Promise<Project> {
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteProject(_id: string): Promise<void> {
    // placeholder
  }
}

// ─── Mock Data Functions ────────────────────────────────────────────────────

function mockSearchScripts(
  query: string,
  _filters?: object
): SearchResult {
  const scripts: Script[] = [
    {
      id: "1",
      title: "Sholay",
      genre: "Action/Drama",
      year: 1975,
      director: "Ramesh Sippy",
      posterUrl: "https://picsum.photos/seed/sholay/300/450",
      rating: 9.2,
      pages: 187,
      language: "Hindi",
      synopsis: "Two criminals are hired to catch a ruthless bandit.",
      tags: ["classic", "action", "friendship", "dacoit"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Dil Chahta Hai",
      genre: "Comedy/Drama",
      year: 2001,
      director: "Farhan Akhtar",
      posterUrl: "https://picsum.photos/seed/dilchahta/300/450",
      rating: 8.7,
      pages: 142,
      language: "Hindi",
      synopsis: "Three best friends navigate life, love, and friendship.",
      tags: ["friendship", "youth", "goa", "love"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "3 Idiots",
      genre: "Comedy/Drama",
      year: 2009,
      director: "Rajkumar Hirani",
      posterUrl: "https://picsum.photos/seed/3idiots/300/450",
      rating: 9.0,
      pages: 158,
      language: "Hindi",
      synopsis: "Three friends navigate engineering college and life.",
      tags: ["education", "friendship", "comedy", "inspiration"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Lagaan",
      genre: "Period/Drama",
      year: 2001,
      director: "Ashutosh Gowariker",
      posterUrl: "https://picsum.photos/seed/lagaan/300/450",
      rating: 8.9,
      pages: 201,
      language: "Hindi",
      synopsis: "Villagers challenge British colonizers to a cricket match.",
      tags: ["period", "cricket", "colonial", "patriotism"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    scripts: scripts.filter((s) =>
      query ? s.title.toLowerCase().includes(query.toLowerCase()) : true
    ),
    total: scripts.length,
    page: 1,
    pageSize: 10,
  };
}

async function mockUploadScript(
  file: File,
  metadata: { title: string; genre: string; year: number }
): Promise<Script> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    title: metadata.title,
    genre: metadata.genre,
    year: metadata.year,
    director: "Unknown",
    posterUrl: `https://picsum.photos/seed/${metadata.title}/300/450`,
    rating: 0,
    pages: 0,
    language: "Hindi",
    synopsis: "Uploaded script",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mockGenerateDialogue(params: {
  characters: string[];
  scene: string;
  mood: string;
}): DialogueLine[] {
  return [
    {
      character: params.characters[0] || "CHARACTER 1",
      text: "Yaar, kuch toh baat kar. Itni khamoshi kyun hai?",
      emotion: params.mood,
      direction: "(looking at the horizon)",
    },
    {
      character: params.characters[1] || "CHARACTER 2",
      text: "Baatein toh bahut hain... pata nahi kahan se shuru karun.",
      emotion: "reflective",
      direction: "(sighs deeply)",
    },
    {
      character: params.characters[0] || "CHARACTER 1",
      text: "Shuru karo apni dil ki baat se. Wahi sachchi hoti hai.",
      emotion: "warm",
    },
  ];
}

function mockAnalyseScript(scriptId: string): AnalysisResult {
  return {
    scriptId,
    sentimentScore: 0.72,
    themes: ["friendship", "redemption", "justice", "love"],
    characters: [
      { name: "Protagonist", lineCount: 234, screenTime: 85 },
      { name: "Antagonist", lineCount: 156, screenTime: 62 },
      { name: "Love Interest", lineCount: 98, screenTime: 45 },
    ],
    paceRating: 8.2,
    dialogueQuality: 8.8,
    structureScore: 7.9,
    suggestions: [
      "The second act could benefit from a stronger midpoint twist.",
      "Character motivation in Act 3 needs clearer development.",
      "The dialogue flows naturally, maintaining the emotional core.",
    ],
  };
}

function mockGetProjects(): Project[] {
  return [
    {
      id: "1",
      name: "Mumbai Monsoon",
      description: "A romantic drama set during Mumbai rains",
      type: "story",
      status: "in-progress",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      wordCount: 12400,
    },
    {
      id: "2",
      name: "Dialogue Analysis - Sholay",
      description: "Deep analysis of iconic Sholay dialogues",
      type: "analysis",
      status: "completed",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "3",
      name: "Villain Monologue Pack",
      description: "AI-generated villain dialogues for period drama",
      type: "dialogue",
      status: "draft",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      wordCount: 3200,
    },
  ];
}

function mockCreateStory(params: object): Project {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: (params as { title: string }).title,
    description: (params as { premise: string }).premise,
    type: "story",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wordCount: 0,
  };
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

// ── Financial Model API (placeholder — connect to backend later) ──────────────

import type { BudgetInputs, BreakdownConfig, RevenueConfig, NPVConfig } from "./financial-store";

export interface FinancialModelPayload {
  budget: BudgetInputs;
  breakdown: BreakdownConfig;
  revenue: RevenueConfig;
  npvConfig: NPVConfig;
  savedAt?: string;
}

/**
 * Persist a financial model to the backend.
 * Returns the saved model with a server-generated ID.
 */
export async function saveFinancialModel(
  _payload: FinancialModelPayload
): Promise<{ id: string; savedAt: string }> {
  // TODO: replace with real API call → POST /financial-models
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          id: `fm-${Date.now()}`,
          savedAt: new Date().toISOString(),
        }),
      600
    )
  );
}

/**
 * Retrieve a saved financial model by ID.
 */
export async function getFinancialModel(
  id: string
): Promise<FinancialModelPayload | null> {
  // TODO: replace with real API call → GET /financial-models/:id
  console.log("[api] getFinancialModel", id);
  return null;
}
