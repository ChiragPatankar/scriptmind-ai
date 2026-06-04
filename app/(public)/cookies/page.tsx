import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "ScriptMind AI Cookie Policy — how we use cookies and similar technologies on our platform.",
};

const sections = [
  {
    title: "1. What are cookies?",
    body: `Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you signed in, and understand how the service is used. We also use similar technologies such as local storage where needed for app functionality.`,
  },
  {
    title: "2. How we use cookies",
    body: `We use strictly necessary cookies and storage for authentication (for example, session tokens managed by Supabase), security, and core platform features. These are required for the site to work when you log in. We may use first-party analytics or performance data in aggregated form to improve reliability and user experience.`,
  },
  {
    title: "3. Third-party services",
    body: `Some features rely on third-party providers (such as authentication, hosting, or payment processing). Those providers may set their own cookies subject to their policies. We do not control third-party cookies beyond choosing reputable vendors.`,
  },
  {
    title: "4. Your choices",
    body: `You can control or delete cookies through your browser settings. Blocking strictly necessary cookies may prevent sign-in or other features from working correctly. For advertising cookies, if we introduce them in the future, we will update this policy and provide appropriate consent controls where required by law.`,
  },
  {
    title: "5. Updates",
    body: `We may update this Cookie Policy from time to time. Material changes will be reflected on this page with an updated revision date. Continued use of the Platform after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "6. Contact",
    body: `Questions about cookies or this policy? Contact us at support@scriptmind.ai.`,
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white mb-4">Cookie Policy</h1>
          <p className="text-text-muted text-sm">Last updated: May 2026</p>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <p className="text-text-secondary leading-relaxed mb-10">
          This policy explains how ScriptMind AI uses cookies and related technologies when you use
          our website and applications.
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
            Questions?{" "}
            <a href="mailto:support@scriptmind.ai" className="text-accent hover:underline">
              support@scriptmind.ai
            </a>
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
