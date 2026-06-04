import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DMCA Policy",
  description:
    "ScriptMind AI DMCA and copyright policy — how to report infringement and how we respond.",
};

const sections = [
  {
    title: "1. Respect for intellectual property",
    body: `ScriptMind AI respects the intellectual property rights of others and expects users of the Platform to do the same. We respond to notices of alleged copyright infringement that comply with applicable law, including the U.S. Digital Millennium Copyright Act (DMCA) where it applies.`,
  },
  {
    title: "2. User content",
    body: `You are responsible for ensuring you have the rights to any scripts, text, images, or other materials you upload or process through the Platform. Our AI features generate outputs based on your inputs; you must not use the service to reproduce or distribute copyrighted works without permission.`,
  },
  {
    title: "3. Filing a DMCA notice",
    body: `If you believe content on or accessible through ScriptMind AI infringes your copyright, please send a written notice to our designated agent with: (a) identification of the copyrighted work; (b) identification of the allegedly infringing material and its location; (c) your contact information; (d) a statement of good faith belief that use is not authorized; (e) a statement under penalty of perjury that your notice is accurate and you are authorized to act; and (f) your physical or electronic signature.`,
  },
  {
    title: "4. Counter-notification",
    body: `If your content was removed or disabled and you believe it was a mistake or misidentification, you may submit a counter-notification as permitted by law. We may restore content in appropriate circumstances.`,
  },
  {
    title: "5. Repeat infringers",
    body: `We may terminate or suspend accounts of users who are repeat infringers of copyright or other intellectual property rights, in our reasonable discretion.`,
  },
  {
    title: "6. Designated agent contact",
    body: `Copyright-related notices for ScriptMind AI may be sent to: support@scriptmind.ai with the subject line "DMCA Notice". We will endeavour to respond promptly in line with applicable law.`,
  },
];

export default function DMCAPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white mb-4">DMCA Policy</h1>
          <p className="text-text-muted text-sm">Last updated: May 2026</p>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <p className="text-text-secondary leading-relaxed mb-10">
          This policy describes how we handle copyright complaints and related matters for ScriptMind
          AI.
        </p>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-white mb-2">{s.title}</h2>
              <p className="text-text-secondary leading-relaxed text-sm">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>
            Notices:{" "}
            <a href="mailto:support@scriptmind.ai" className="text-accent hover:underline">
              support@scriptmind.ai
            </a>
          </span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
