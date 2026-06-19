# ScriptMind AI — Dashboard Features & Implementation

A complete reference for every page in the `(dashboard)` route group, covering features, data sources, and implementation patterns.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Dashboard Shell](#2-dashboard-shell)
3. [My Projects — `/projects`](#3-my-projects--projects)
4. [Project Detail — `/projects/[id]`](#4-project-detail--projectsid)
5. [Analyse Script — `/analyse`](#5-analyse-script--analyse) — [Quick](#5a-quick-script-analysis) · [Scene-by-Scene](#5b-scene-by-scene-analysis)
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
| Charts | **Recharts** | Finance Studio, Analyse (Quick + Scene-by-Scene) |
| Credits / billing | **Supabase** + Razorpay | Server-side deduction via `lib/credits/` |
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
  - Visualize Scene `/visualize`
  - Poster Generator `/poster`
  - Finance Studio `/financial`
  - Usage Dashboard `/download-scripts`
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

The analyse page offers **two independent modes**. They supplement each other but run separate pipelines, cost separate credits, and produce separate reports.

| Mode | Credits | Plan gate | Output |
|---|---|---|---|
| **Quick** | 3 | Active subscription | Holistic script report (single Gemini call, ~15k char truncate) |
| **Scene-by-Scene** | 15 | Basic / Pro (+ monthly quota) | Per-scene table, emotional curve, rewrite notes (async job) |

### Shared upload UX

| Feature | Detail |
|---|---|
| Mode selector | Toggle **Quick** vs **Scene-by-Scene** before upload |
| Upload flow | PDF, DOCX, or TXT via drag-or-click zone |
| Paste flow | Text paste (≥ 100 characters); Scene mode wraps paste as a `.txt` file |
| Draft persistence | `useFeatureDraft("analyse")` — saves input mode, pasted text, title, and last Quick or Scene report to `localStorage` (no re-run on refresh) |
| Credit badge | Shows 3 or 15 credits depending on selected mode |
| Error handling | User-facing error message; failed Scene jobs auto-refund the 15 credits |

---

### 5a. Quick Script Analysis

| Feature | Detail |
|---|---|
| Loading state | `AnalyseDashboardSkeleton` during synchronous API call |
| Full report | `AnalyseScriptDashboard` (`components/analyse/`) |
| Report sections | Overall metrics, 27-emotion timeline & distribution, character analysis, dialogue card, scene timeline, similar stories, AI insights |
| PDF export | `lib/exportAnalysePDF.ts` / `lib/pdf/downloadReport.ts` (Quick); `lib/exportSceneAnalysePDF.ts` (Scene-by-Scene) |

#### Quick report components (`components/analyse/`)

| Component | Purpose |
|---|---|
| `AnalyseScriptDashboard` | Main container, section orchestration |
| `MetricCardsSection` | Originality, hook, engagement, emotional depth |
| `EmotionalTimelineSection` | Multi-emotion intensity over scenes (labeled emotions, e.g. joy, tension) |
| `EmotionDistributionSection` | 27-emotion spectrum breakdown |
| `CharacterAnalysisSection` | Per-character stats, arcs, screen time |
| `DialogueAnalysisCard` | Dialogue quality summary |
| `InsightsSection` | AI recommendations |
| `SimilarStories` | Comparable titles |
| `AnalyseUtilities` | Export / utility actions |

#### Quick API integration

| Layer | Detail |
|---|---|
| Client | `lib/analyse-api.ts` → `POST /api/analyse` |
| Next.js route | `app/api/analyse/route.ts` — `withCredits("script_analysis")` |
| Backend | `POST {NEXT_PUBLIC_ANALYSE_API_URL}/api/v1/scripts/analyse` (Hugging Face FastAPI) |
| Backend service | `backend/services/gemini_service.py` — one holistic JSON response |
| Daily limit | 10 Quick analyses per user per day (`lib/credits/rateLimits.ts`) |

---

### 5b. Scene-by-Scene Analysis

Async pipeline for long scripts: parse every scene, batch for Gemini (≤ 20 batches), aggregate into a scene report. User stays on the page and polls job progress.

| Feature | Detail |
|---|---|
| Loading UX | Progress bar + phase message (`parsing` → `batching` → `analyzing` → `aggregating`) |
| Report UI | `SceneBySceneDashboard` (`components/analyse/SceneBySceneSection.tsx`) |
| Strongest / weakest | Top/bottom 5 scenes by **composite score** |
| Emotional curve | Line chart: scene number vs **emotion intensity** (0–10), not labeled emotion types |
| Scene table | Per scene: pages, dialogue %, emotion, pacing, conflict, dialogue quality, expandable details |
| Scene details | Two-column expand: rewrite suggestions + **per-scene 27-emotion spectrum** bar chart (`emotion_spectrum`) |
| Emotion spectrum | AI ranks the 8 strongest emotions present in each scene (0–100%); shared 27-emotion palette in `lib/emotions.ts` |
| PDF export | **Download PDF** button → `lib/exportSceneAnalysePDF.ts` (text report: scores, top emotions, suggestions) |
| Credit refund | Failed scene jobs auto-refund 15 credits exactly once (`lib/credits/refundSceneJob.ts`, migration `010`) |
| Merged scenes | Scripts with > 20 logical batches merge adjacent low-impact scenes (never sampled/skipped) |

#### Scene score columns (0–10, AI-generated per scene)

| Column | Meaning |
|---|---|
| **Emotion** | Overall emotional impact / intensity of the scene (not a specific feeling label) |
| **Pacing** | Rhythm and flow — rushed vs draggy vs well-timed |
| **Conflict** | Tension, stakes, opposition in the scene |
| **Dialogue** | Quality of written dialogue (voice, subtext, clarity) — not the same as **Dialogue %** |
| **Dialogue %** | Local metric: share of scene text that is spoken lines |
| **Composite** | Weighted blend: 30% emotion + 25% pacing + 25% conflict + 20% dialogue |

**Pacing consistency** (header stat) measures how even pacing scores are across the whole script (high = steady rhythm).

#### Scene API integration

| Step | Detail |
|---|---|
| 1. Create job | `lib/scene-analyse-api.ts` → `POST /api/analyse/scenes/jobs` (multipart file) |
| 2. Credit gate | `withSceneAnalysis` — subscription, monthly quota, daily limit, deduct 15 credits |
| 3. DB row | Supabase `analysis_jobs` (migration `009_scene_analysis_jobs.sql`) via admin client |
| 4. Trigger worker | Next.js forwards file + `job_id` to HF with `X-Job-Secret` header |
| 5. Poll | `GET /api/analyse/scenes/jobs/[id]` every ~2.5s (RLS: owner read only); refunds credits if `status === failed` |
| 6. Worker | `POST /api/v1/scripts/analyse/scenes/process` → background `run_scene_analysis_job` |
| 7. Result | Worker writes `result` JSONB on job row; UI renders when `status === completed` |

#### Backend modules (HF Space `scriptmind-backend`)

| Module | Role |
|---|---|
| `scene_parser_service.py` | Split on INT./EXT./etc. scene headings |
| `scene_metrics_service.py` | Local stats: length, dialogue %, merge score, location |
| `scene_batch_service.py` | Greedy batches ≤ 8.5k chars; merge to ≤ 20 batches |
| `scene_gemini_service.py` | Per-batch compact JSON scores + rewrite suggestions + per-scene `emotion_spectrum` |
| `scene_aggregate_service.py` | Build final report, curve, strongest/weakest; sanitize 27-emotion spectrum |
| `scene_job_service.py` | Job orchestration + Supabase progress updates |
| `job_store.py` | Supabase REST updates via service role |

#### Scene limits & quotas

| Limit | Value |
|---|---|
| Credits per run | 15 |
| Free plan | 0 scene analyses / month (blocked) |
| Basic plan | 5 / month (UTC, completed jobs only) |
| Pro plan | 25 / month |
| Enterprise | Unlimited (`null` in `sceneMonthlyLimits.ts`) |
| Daily rate limit | 3 scene jobs / day |

Config: `lib/credits/sceneMonthlyLimits.ts`, `checkSceneMonthlyQuota.ts`, `withSceneAnalysis.ts`.

#### Environment (Scene-by-Scene)

| Variable | Where | Purpose |
|---|---|---|
| `SCENE_JOB_PROCESS_SECRET` | Cloudflare Worker + HF Space | Authenticates worker trigger |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloudflare + HF Space | Job insert (API) / progress updates (worker) |
| `NEXT_PUBLIC_ANALYSE_API_URL` | Cloudflare | HF Space base URL |
| `GEMINI_API_KEY` | HF Space | Batch Gemini calls |

---

### Known gaps (Analyse)

- Quick and Scene reports are separate phases — no combined “Overview + Scenes” tab yet.
- No “resume polling” if user closes tab mid-job (job may still complete in DB); refund still fires on the next poll/visit.
- Scene emotional curve (header chart) is intensity only; the labeled 27-emotion breakdown is now per-scene (expand a row) and script-wide (Quick).

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
| `lib/analyse-api.ts` | Quick analyse client → `POST /api/analyse` |
| `lib/scene-analyse-api.ts` | Scene job create + poll helpers |
| `lib/mock/scene-analyse.ts` | `SceneAnalysisReport`, `SceneRow`, job types |
| `lib/credits/costs.ts` | Server credit costs (Quick 3, Scene 15) |
| `lib/credits/withCredits.ts` | Credit gate wrapper for Quick analyse |
| `lib/credits/withSceneAnalysis.ts` | Credit + monthly quota gate for Scene jobs |
| `lib/credits/sceneMonthlyLimits.ts` | Plan monthly caps for scene analysis |
| `lib/credits/checkSceneMonthlyQuota.ts` | Count completed jobs in UTC month |
| `lib/draft/useFeatureDraft.ts` | Device-only draft save (used on `/analyse`) |
| `lib/gemini-api.ts` | Server-side Gemini client; story & dialogue |
| `lib/financial-store.ts` | Zustand store for all financial model state |
| `lib/financial/projection.ts` | Revenue and cost projection calculations |
| `lib/financial/insights.ts` | Rule-based financial insight generation |
| `lib/financial/film-dataset.ts` | Reference dataset for film financial benchmarks |
| `lib/exportAnalysePDF.ts` | jsPDF + html2canvas PDF export (Quick report) |
| `lib/exportSceneAnalysePDF.ts` | jsPDF text PDF export (Scene-by-Scene report) |
| `lib/emotions.ts` | Shared 27-emotion palette (labels + colors) for distribution & per-scene charts |
| `lib/credits/refundSceneJob.ts` | Idempotent 15-credit refund for failed scene jobs |
| `supabase/migrations/009_scene_analysis_jobs.sql` | `analysis_jobs` table + RLS for Scene-by-Scene |
| `supabase/migrations/010_analysis_jobs_refund.sql` | Adds `refunded` flag for one-time scene-job refunds |

### UI Components (`components/ui/`)

`button`, `input`, `card`, `badge`, `modal`, `skeleton`, `progress`, `tooltip`, `ThemeToggle`, and more — all built on Radix UI primitives with Tailwind styling.

---

## 13. Implementation Status Overview

| Page | Route | Backend Integration | Status |
|---|---|---|---|
| My Projects | `/projects` | None (Zustand/localStorage) | ✅ Functional |
| Project Detail | `/projects/[id]` | None (Zustand/localStorage) | ✅ Functional |
| Analyse — Quick | `/analyse` | Next `/api/analyse` → HF `/api/v1/scripts/analyse` · 3 credits | ✅ Production (HF Space) |
| Analyse — Scene-by-Scene | `/analyse` | Next job API → Supabase `analysis_jobs` → HF worker · 15 credits · per-scene 27-emotion spectrum · PDF · auto-refund on failure | ✅ Production (requires migrations 009 + 010 + HF secrets) |
| Finance Studio | `/financial` | Stub save/load only | ✅ UI Functional (no persistence) |
| Create Story | `/create-story` | Gemini API (`/api/story`) | ✅ Functional |
| AI Dialogue | `/dialogue` | Gemini API (`/api/dialogue`) | ✅ Functional |
| Visualize Scene | `/visualize` | HF Stable Diffusion (`/api/visualize`) | ✅ Functional |
| Poster Generator | `/poster` | Gemini + Supabase storage (`/api/poster/*`) | ✅ Functional |
| Usage Dashboard | `/download-scripts` | None (static data) | 🚧 Mock / Placeholder |
| Settings | `/settings` | None (local state) | 🚧 Partial (UI only) |
| Tutorial & Help | `/tutorial` | None (static) | 🚧 Static Content |

> **Legend:** ✅ Functional &nbsp;|&nbsp; 🚧 Mock or Incomplete
