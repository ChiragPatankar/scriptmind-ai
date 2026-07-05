# ScriptMind AI — Enterprise Screenplay Intelligence & Production Packaging SaaS

ScriptMind AI is an advanced, enterprise-grade software-as-a-service (SaaS) platform built for screenwriters, independent producers, and creative studio executives. The platform blends artificial intelligence with institutional financial models to analyze screenplays, generate key packaging art, and forecast theatrical distribution ROI.

---

## 💎 Product Architecture & Key Modules

ScriptMind AI operates as a unified web-native workspace split into five core business modules:

### 1. Creative Companion Studio
*   **Tone-Gated Expansion Engine**: Allows writers to select a target tone (e.g., Suspenseful, Comedic, Melodramatic) and dynamically generate or extend narrative beats.
*   **Multi-Mood Dialogue Generator**: Automatically shapes script dialogues based on selected moods (e.g., Sarcastic, Intense, Warm) to optimize character voice.
*   **Styling Prompts Manager**: Standardizes scene headers, action descriptions, and transitions to industry-standard screenplay formatting.

### 2. Screenplay Intelligence & Analytics
*   **Scene-by-Scene Breakdown**: Instantly indexes scenes, identifying active locations, characters present, subtext, and pacing.
*   **Emotional Distribution Analysis**: Visualizes emotional arcs and character dynamics across scenes using interactive graphs.
*   **Originality Audit & Enhancement**: Scans text for narrative clichés and AI-like patterns, providing automated structural suggestions to improve storytelling style.

### 3. AI Poster Packaging Studio
*   **Key Art Generation**: Uses advanced generative models to turn script synopses or theme prompts into premium-quality vertical movie posters.
*   **Visual Art Variations**: Instantly regenerates layout designs and color schemes to align with target theatrical genre aesthetics.

### 4. Finance Studio Projections
*   **Projection Engine**: Calculates complex theatrical profit-and-loss margins based on seating, pricing, and theater locations.
*   **Theatrical Split Analytics**: Evaluates exhibitor shares, distributor fees, and prints & advertising (P&A) costs.
*   **Multi-Tier Investor ROI Model**: Analyzes recoupment schedules, Net Present Value (NPV), and Internal Rate of Return (IRR) across different budgets.

### 5. Multi-Tenant Isolated Infrastructure
*   **User-wise Storage Vaults**: Dynamically namespaces state persistence (`scriptmind-projects:${userId}`) and replicates project metadata directly to an isolated database schema, preventing cross-tenant leakage.
*   **Resource Rate Limits**: Enforces hard usage boundaries based on subscription tiers:
    *   *Trial Pack*: 3 Projects maximum, basic feature access.
    *   *Basic*: 10 Projects maximum, standard analytics quota.
    *   *Pro*: 30 Projects maximum, full access to Finance Studio models.
*   **Secure Payment Integration**: Direct Razorpay integration with HMAC-SHA256 signature verification server-side, securing tier upgrades and credit transactions.

---

## ⚡ Infrastructure & Technology Stack

ScriptMind AI is engineered for global scale, high security, and sub-100ms response times:

*   **Front-End Engine**: **Next.js 14** (App Router architecture) for server-side pre-rendering and component optimization.
*   **Styling & Motion**: Custom **Tailwind CSS** system combined with **Framer Motion** for premium animations, hover micro-effects, and visual cues.
*   **Database & RLS**: **Supabase PostgreSQL** utilizing Row Level Security (RLS) to enforce data privacy, backed by triggers that automatically update schema timestamps.
*   **State Management**: **Zustand** store with custom middleware to sync in-memory local state reactively with cloud databases on session changes.
*   **Serverless Deployment**: Bundled via **OpenNext** and deployed directly to **Cloudflare Workers / Pages** to run server-side logic at the edge.
*   **Payment Gateway**: Pure HTTP-based Razorpay integration optimized for Cloudflare's serverless V8 isolate constraints (no Node.js internals required).
