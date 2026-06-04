import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "ScriptMind AI Refund Policy — eligibility, timelines, and how to request a refund for paid plans.",
};

const sections = [
  {
    title: "1. Overview",
    body: `Paid subscriptions and one-time purchases on ScriptMind AI are generally billed in advance. This Refund Policy explains when refunds may be available and how to request them. By purchasing a paid plan, you agree to this policy together with our Terms of Service.`,
  },
  {
    title: "2. Subscription refunds",
    body: `If you are unsatisfied with a paid subscription, you may request a refund within fourteen (14) days of your initial purchase or renewal, provided you have not materially abused the service (for example, excessive automated usage or terms violations). Refunds are issued to the original payment method where possible and may take several business days to appear.`,
  },
  {
    title: "3. Partial periods",
    body: `Unless required by law, we do not typically offer partial refunds for unused time within a billing period after the refund window has passed. You may cancel your subscription at any time; cancellation stops future renewals but does not automatically refund the current period unless our team approves an exception.`,
  },
  {
    title: "4. How to request a refund",
    body: `Email support@scriptmind.ai from the address associated with your account. Include your account email, approximate date of charge, and reason for the request. We will confirm eligibility and respond within a reasonable timeframe.`,
  },
  {
    title: "5. Chargebacks",
    body: `If you initiate a chargeback with your bank before contacting us, we may suspend your account pending resolution. We encourage you to reach out to support first so we can resolve billing issues quickly.`,
  },
  {
    title: "6. Changes",
    body: `We may update this Refund Policy from time to time. The "Last updated" date at the top of this page will change when we do. Material changes may also be communicated by email or an in-app notice.`,
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white mb-4">Refund Policy</h1>
          <p className="text-text-muted text-sm">Last updated: May 2026</p>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <p className="text-text-secondary leading-relaxed mb-10">
          We want billing to be fair and predictable. Read below for how refunds work for ScriptMind
          AI paid plans.
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
            Billing help:{" "}
            <a href="mailto:support@scriptmind.ai" className="text-accent hover:underline">
              support@scriptmind.ai
            </a>
          </span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
