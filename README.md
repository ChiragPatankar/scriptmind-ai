# ScriptMind AI 🎬🤖

ScriptMind AI is a state-of-the-art AI-powered scriptwriting companion, screenplay analysis suite, and financial projections platform for filmmakers and production houses.

## 🚀 Key Features

- **Script Analysis & Originality Intelligence**: Scene-by-scene breakdown, emotional distribution graphs, and originality checks powered by Google Gemini.
- **Finance Studio Projections**: Interactive calculators for P&L, exhibitor/distributor shares, investor ROI models, and automated NPV/IRR report generator.
- **Story & Dialogue Helpers**: Tone-gated script expansor, dialogue generators, and customized styling prompts.
- **AI Poster Studio**: Automated movie poster generator and regeneration pipeline.
- **Isolated Projects System**: Dynamic Supabase-backed user project management and sync.
- **Razorpay Payment Gateway**: Seamless onboarding flow with active plan validation (Trial Pack, Basic, Pro).

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), Tailwind CSS, Framer Motion, Recharts, Zustand.
- **Serverless / Hosting**: Cloudflare Pages / Workers via OpenNext.
- **Database & Authentication**: Supabase (PostgreSQL, RLS Policies, Database Triggers).
- **Payment Gateway**: Razorpay (PASE directly integrated via fetch, Cloudflare-compatible).

---

## 💻 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ChiragPatankar/scriptmind-ai.git
cd scriptmind-ai
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OMDB_API_KEY=your-omdb-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### 3. Setup Database Schema
Execute the SQL files inside `supabase/migrations/` in order on your **Supabase Dashboard → SQL Editor**. 

*(Make sure to run `011_projects_schema.sql` to enable the user-wise isolated project database synchronization).*

### 4. Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📦 Cloudflare Deployment

Build and deploy to Cloudflare Pages using:
```bash
npm run deploy
```
*(Ensure you map your environment variables under the `[vars]` block in `wrangler.toml` for production runtime accessibility).*
