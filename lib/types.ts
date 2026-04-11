export interface Script {
  id: string;
  title: string;
  genre: string;
  year: number;
  director: string;
  posterUrl: string;
  rating: number;
  pages: number;
  language: string;
  synopsis: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: "story" | "dialogue" | "analysis" | "screenplay";
  status: "draft" | "in-progress" | "completed" | "archived";
  genre?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  wordCount?: number;
  targetWordCount?: number;
  scriptId?: string;
  budget?: number;
  notes?: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  emotion?: string;
  direction?: string;
}

export interface AnalysisResult {
  scriptId: string;
  sentimentScore: number;
  themes: string[];
  characters: { name: string; lineCount: number; screenTime: number }[];
  paceRating: number;
  dialogueQuality: number;
  structureScore: number;
  suggestions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
}

export interface SearchResult {
  scripts: Script[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  highlighted: boolean;
  cta: string;
}
