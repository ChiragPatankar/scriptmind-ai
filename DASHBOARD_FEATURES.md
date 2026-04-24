# ScriptMind AI — Dashboard Features & Implementation

A complete reference for every page in the `(dashboard)` route group, covering features, data sources, and implementation patterns.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Dashboard Shell](#2-dashboard-shell)
3. [My Projects — `/projects`](#3-my-projects--projects)
4. [Project Detail — `/projects/[id]`](#4-project-detail--projectsid)
5. [Analyse Script — `/analyse`](#5-analyse-script--analyse)
6. [Finance Studio — `/financial`](#6-finance-studio--financial)
7. [Create Story — `/create-story`](#7-create-story--create-story)
8. [AI Dialogue — `/dialogue`](#8-ai-dialogue--dialogue)
9. [Download Scripts — `/download-scripts`](#9-download-scripts--download-scripts)
10. [Settings — `/settings`](#10-settings--settings)
11. [Tutorial & Help — `/tutorial`](#11-tutorial--help--tutorial)
12. [Shared Utilities & State](#12-shared-utilities--state)
13. [Implementation Status Overview](#13-implementation-status-overview)

---

## 1. Tech Stack

| Layer | Library / Tool | Notes |
|---|---|---|
| Framework | **Next.js 14.2** (App Router) | React 18, TypeScript |
| Styling | **Tailwind CSS** + `tailwindcss-animate` | CSS custom properties for theming |
| UI Primitives | **Radix UI** | Dialog, Dropdown, Tabs, Tooltip, Progress |
| Animation | **Framer Motion** | Layout animations, page transitions |
| Charts | **Recharts** | Used in Finance Studio |
| State Management | **Zustand** + `persist` | `localStorage` for auth & projects |
| Forms | **react-hook-form** + **zod** | Validation on forms |
| Server State | **@tanstack/react-query** | Provider installed; not yet used in pages |
| Theming | **next-themes** | Light / dark mode |
| Icons | **lucide-react** | |
| PDF Export | **jspdf** + **html2canvas** | Analyse report export |
| Deployment | **@opennextjs/cloudflare** + **wrangler** | Cloudflare Workers target |

---

## 2. Dashboard Shell

**Layout file:** `app/(dashboard)/layout.tsx`

All dashboard routes share a common shell composed of:

- **`Sidebar`** (`components/layout/Sidebar.tsx`) — collapsible sidebar with Framer Motion animations, mobile drawer support. Navigation items:
  - My Projects `/projects`
  - Analyse Script `/analyse`
  - AI Dialogue `/dialogue`
  - Create Story `/create-story`
  - Finance Studio `/financial`
  - Download Scripts `/download-scripts`
  - Tutorial `/tutorial`
  - Settings `/settings`
- **`DashboardNavbar`** (`components/layout/DashboardNavbar.tsx`) — dynamic route title, theme toggle, notifications stub, Radix user-menu dropdown.
- **`loading.tsx`** — full-width pulse skeleton shown during segment navigations.
- **`financial/loading.tsx`** — finance-specific loading skeleton.

**Global providers** (applied at root `app/layout.tsx`):
- `ThemeProvider` (next-themes)
- `MotionProvider` (Framer Motion reduced-motion handling)
- `QueryProvider` (TanStack Query client)

---

## 3. My Projects — `/projects`

**File:** `app/(dashboard)/projects/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Stat cards | Total projects, In Progress, Completed, Total word count |
| Project list | Grid or List layout toggle |
| Filtering | Tabs by project type (Film, Series, Short Film, Documentary, Web Series) |
| Search | Real-time text search across project titles |
| Sorting | By Last Updated, Date Created, Name (A–Z), Word Count |
| Create project | Modal form — title, type, description, genre, language, target words |
| Edit project | Same modal pre-filled with existing values |
| Duplicate project | Creates a copy with "Copy of …" prefix |
| Delete project | Confirmation modal before deletion |
| Per-card context menu | Open, Edit, Duplicate, Change Status, Delete |
| Status management | Todo → In Progress → Completed (inline update) |
| Toasts | Inline feedback for all CRUD actions |
| Animations | Framer Motion `AnimatePresence` + layout animations on the card grid |
| Empty state | Illustrated prompt with "Create First Project" CTA |
| Demo seeding | `initializeDefaults()` seeds sample projects on first empty load |

### Data & State

- **Store:** `useProjectStore` from `lib/store.ts` (Zustand + `localStorage` persistence).
- **Types:** `Project` from `lib/types.ts`.
- No API calls; all data is client-side.

---

## 4. Project Detail — `/projects/[id]`

**File:** `app/(dashboard)/projects/[id]/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Breadcrumb | My Projects → Project Name |
| Project header | Title, type badge, status badge, progress bar |
| Quick Actions grid | Links to Analyse, Dialogue, Create Story, Download Scripts |
| Project Notes | Editable textarea with explicit "Save Notes" action |
| Sidebar stats | Type, Status, Word count vs target, Progress % |
| Project Info card | Created / Updated dates, Genre, Tags, Budget (₹) |
| Change Status | One-click buttons: Todo / In Progress / Completed |
| Duplicate project | Creates copy, navigates to its detail page |
| Delete project | Confirmation modal, navigates to `/projects` on confirm |

### Data & State

- **Store:** `useProjectStore` — reads/writes same Zustand store.
- Navigation with `useParams` / `useRouter` (Next.js App Router).
- Redirects to `/projects` with toast if project ID is not found.

---

## 5. Analyse Script — `/analyse`

**File:** `app/(dashboard)/analyse/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Upload flow | PDF, DOCX, or TXT file upload via drag-or-click zone |
| Paste flow | Text paste (≥ 100 characters required) |
| Loading state | `AnalyseDashboardSkeleton` component during API call |
| Full analysis report | Rendered by `AnalyseScriptDashboard` (`components/analyse/`) |
| Report sections | Overall score, Character analysis, Dialogue quality, Emotion distribution, Scene timeline, Similar stories, AI insights |
| PDF export | `lib/exportAnalysePDF.ts` using jsPDF + html2canvas |
| Error handling | User-facing error message with retry option |

### Analysis Report Components (`components/analyse/`)

| Component | Purpose |
|---|---|
| `AnalyseScriptDashboard` | Main container, section orchestration |
| Metrics section | Score cards for overall, dialogue, structure |
| Character analysis | Per-character stats, arc, screen time |
| Emotion distribution | Emotion breakdown |
| Scene timeline | Visual timeline of scenes |
| Dialogue card | Sample dialogue quality |
| Insights panel | AI-generated recommendations |
| Similar stories | Comparable titles |

### API Integration

- **File:** `lib/analyse-api.ts`
- **Endpoint:** `POST {NEXT_PUBLIC_ANALYSE_API_URL}/api/v1/scripts/analyse`
  - Default base URL: `http://127.0.0.1:8000` (local FastAPI server)
- **File upload:** `FormData` multipart request.
- **Text paste:** JSON body with script text.
- Response is mapped from snake_case API fields into the `AnalyseScriptReport` TypeScript type.

---

## 6. Finance Studio — `/financial`

**File:** `app/(dashboard)/financial/page.tsx`

The most feature-rich page in the dashboard — a full film P&L, break-even, NPV/IRR, and territory revenue modelling tool.

### Input Panel Features

| Feature | Detail |
|---|---|
| Budget matrix | Expense categories × production phases (Pre / Production / Post / Marketing); budget vs actual columns |
| Period type | Weekly / Monthly / Quarterly / Yearly projection periods |
| Period count | Configurable number of periods |
| Revenue fields | Total revenue, opening weekend, OTT deal value |
| Discount rate | For NPV calculation |
| NPV cash flows | Per-period cash flow entries, auto-converted to annual rate |
| Revenue split | Configure % or ₹ per territory/channel |
| Collapsible sections | Each input category collapses independently |
| Validation | Required-field gate before report generation |
| Save / Load model | `saveFinancialData` / `getFinancialData` (stub; no backend) |
| Reset | Clears all inputs back to defaults |

### Report Features

| Section | Detail |
|---|---|
| KPI chips | Total budget, Total revenue, Net profit, ROI %, Break-even point |
| Projection panel | `ProjectionPanel` component with period-by-period chart |
| Break-even analysis | Break-even revenue, units, timeline |
| Territory table | Revenue by territory; CSV import; template download; auto-balance toggle; Recharts pie + bar |
| Investment verdict | `computeDecision` — rule-based Go / Hold / Pass recommendation |
| P&L bar chart | Budget vs actual per phase |
| P&L timeline | Cumulative P&L over projection periods |
| Composition pies | Budget allocation by category |
| Marketing efficiency | Marketing spend vs revenue efficiency metric |
| NPV & IRR | Calculated NPV and Internal Rate of Return |
| ROI gauge | `ROIGauge` component — visual dial |
| Insights | Rule-based text insights from `lib/financial/insights.ts` |
| Investor report | `InvestorReport` component for a formatted summary |

### Data & State

- **Store:** `useFinancialStore` (`lib/financial-store.ts`) — Zustand.
- **Calculations:** `lib/financial/projection.ts`, `lib/financial/insights.ts`, `lib/financial/film-dataset.ts`.
- **Save/Load:** `lib/financial/api.ts` — currently no-op stubs.
- **Report generation:** Client-side only; short fake "generating" delay for UX feedback.

---

## 7. Create Story — `/create-story`

**File:** `app/(dashboard)/create-story/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Title input | Script/story title |
| Premise input | Story premise text area |
| Genre chips | Multi-select genre tags (Bollywood-focused) |
| Tone selector | One of 7 tones (Intense, Dark, Inspiring, etc.) |
| Setting selector | One of 7 Indian/international settings |
| Story outline output | AI-generated title, logline, 3-act structure, key characters with arcs |
| Error state | Friendly error card with Try Again button |
| Regenerate button | Re-calls the API with the same inputs |
| Expand to Full Script button | Stub — not yet wired |

### API Integration

- **Route:** `POST /api/story` (`app/api/story/route.ts`)
- **Backend:** `lib/gemini-api.ts` → Gemini `gemini-2.0-flash` model
- **Prompt:** Instructs Gemini to act as a Bollywood screenwriter and return structured JSON with `title`, `logline`, `acts[]`, and `characters[]`
- **Response type:** `StoryOutline` from `lib/gemini-api.ts`
- **Error handling:** API errors surface as an inline error card with a retry action

### Environment

- Requires `GEMINI_API_KEY` in `.env.local` (server-side only, not exposed to the client)

---

## 8. AI Dialogue — `/dialogue`

**File:** `app/(dashboard)/dialogue/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Character builder | Add / remove characters dynamically |
| Scene description | Context textarea for the scene |
| Mood selector | 8 mood options (Intense, Romantic, Comedic, etc.) |
| Language | Hindi / English / Hinglish (language-specific prompt instructions) |
| Writing Style | 5 styles (Classical, Modern, Street Slang, Poetic, Action-Packed) |
| Dialogue output | Formatted lines with character avatar, emotion tag, stage direction, and spoken text |
| Regenerate button | Re-calls the API with the same inputs |
| Copy button | Copies full formatted dialogue to clipboard; shows tick confirmation |
| Export button | Downloads dialogue as a `.txt` file with scene header |
| Error state | Friendly error card with Try Again button |

### API Integration

- **Route:** `POST /api/dialogue` (`app/api/dialogue/route.ts`)
- **Backend:** `lib/gemini-api.ts` → Gemini `gemini-2.0-flash` model
- **Prompt:** Instructs Gemini to write cinematic dialogue with character-specific language guidance and return a JSON array of `{ character, text, emotion, direction }` objects
- **Response type:** `GeneratedDialogueLine[]` from `lib/gemini-api.ts`
- **Error handling:** API errors surface as an inline error card with a retry action

### Environment

- Requires `GEMINI_API_KEY` in `.env.local` (server-side only, not exposed to the client)

---

## 9. Download Scripts — `/download-scripts`

**File:** `app/(dashboard)/download-scripts/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Script catalog | Static list of Bollywood script entries with poster images |
| Poster images | Loaded via `next/image` from `picsum.photos` |
| Search | Real-time filter across script titles |
| Genre filters | Tag-based genre filter chips |
| Hover download button | Appears on card hover; shows a loading spinner on click |

### Implementation Status

> **No real downloads.** The download button shows a simulated loading state but does not fetch or serve any files.

---

## 10. Settings — `/settings`

**File:** `app/(dashboard)/settings/page.tsx`

### Tabs

| Tab | Feature |
|---|---|
| **Profile** | Editable name and email; read-only fields (role, joined date); avatar placeholder |
| **Billing** | Plan comparison cards (Free, Pro, Enterprise); current plan highlight |
| **API Keys** | Mock API key display with copy/reveal toggle; "Generate New Key" stub |
| **Notifications** | "Coming Soon" placeholder |
| **Security** | "Coming Soon" placeholder |
| **Appearance** | "Coming Soon" placeholder |

### Implementation Status

- Profile changes are managed with local React state — no persistence or API.
- Billing and API Keys are UI-only with no backend integration.

---

## 11. Tutorial & Help — `/tutorial`

**File:** `app/(dashboard)/tutorial/page.tsx`

### Features

| Feature | Detail |
|---|---|
| Getting Started checklist | List of onboarding steps with progress bar; completion flags are hardcoded |
| FAQ accordion | Expandable Q&A items |
| Contact cards | Email, Chat, Docs links; buttons are not wired to actions |
| Video tutorials section | Placeholder grid (no real video embeds) |

### Implementation Status

> Fully static marketing/onboarding content. No dynamic data.

---

## 12. Shared Utilities & State

### Stores (`lib/store.ts`)

| Store | Purpose | Persistence |
|---|---|---|
| `useUIStore` | Sidebar open/closed, theme, modal state, notifications | No |
| `useAuthStore` | Current user object, auth token | `localStorage` |
| `useProjectStore` | Projects list, active project | `localStorage` |
| `useScriptStore` | Script objects (partially used) | No |

### Key Utility Files

| File | Purpose |
|---|---|
| `lib/utils.ts` | `cn()` (class merge), `formatDate()`, misc helpers |
| `lib/types.ts` | Shared TypeScript types: `Project`, `User`, `Script`, `AnalyseScriptReport` |
| `lib/api.ts` | `ApiClient` class; most methods are mocked (generateDialogue, searchScripts, etc.) |
| `lib/analyse-api.ts` | Real HTTP client for the script analysis backend |
| `lib/gemini-api.ts` | Server-side Gemini client; `generateStoryOutline` and `generateDialogue` with typed responses and validation |
| `lib/financial-store.ts` | Zustand store for all financial model state |
| `lib/financial/projection.ts` | Revenue and cost projection calculations |
| `lib/financial/insights.ts` | Rule-based financial insight generation |
| `lib/financial/film-dataset.ts` | Reference dataset for film financial benchmarks |
| `lib/exportAnalysePDF.ts` | jsPDF + html2canvas PDF export for analysis report |

### UI Components (`components/ui/`)

`button`, `input`, `card`, `badge`, `modal`, `skeleton`, `progress`, `tooltip`, `ThemeToggle`, and more — all built on Radix UI primitives with Tailwind styling.

---

## 13. Implementation Status Overview

| Page | Route | Backend Integration | Status |
|---|---|---|---|
| My Projects | `/projects` | None (Zustand/localStorage) | ✅ Functional |
| Project Detail | `/projects/[id]` | None (Zustand/localStorage) | ✅ Functional |
| Analyse Script | `/analyse` | Real API (`/api/v1/scripts/analyse`) | ✅ Functional (requires local backend) |
| Finance Studio | `/financial` | Stub save/load only | ✅ UI Functional (no persistence) |
| Create Story | `/create-story` | Gemini API (`/api/story`) | ✅ Functional |
| AI Dialogue | `/dialogue` | Gemini API (`/api/dialogue`) | ✅ Functional |
| Download Scripts | `/download-scripts` | None (static data) | 🚧 Mock / Placeholder |
| Settings | `/settings` | None (local state) | 🚧 Partial (UI only) |
| Tutorial & Help | `/tutorial` | None (static) | 🚧 Static Content |

> **Legend:** ✅ Functional &nbsp;|&nbsp; 🚧 Mock or Incomplete
