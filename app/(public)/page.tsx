import React from "react";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import WorkflowSection from "@/components/landing/WorkflowSection";
import FinancialSection from "@/components/landing/FinancialSection";
import TargetUsersSection from "@/components/landing/TargetUsersSection";
import PricingPreview from "@/components/landing/PricingPreview";
import TrustSection from "@/components/landing/TrustSection";
import CTASection from "@/components/landing/CTASection";
import { getTopBollywoodMovies, normaliseTMDBMovie } from "@/lib/tmdb";

export const metadata = {
  title: "ScriptMind AI — Build Your Movie. From Idea to Box Office.",
  description:
    "ScriptMind AI is your all-in-one filmmaking platform — write scripts, generate dialogues, plan budgets, predict earnings, and manage your entire film project in one place.",
};

// Revalidate every 24 hours so fresh poster data is picked up daily
export const revalidate = 86400;

export default async function LandingPage() {
  // Fetch Bollywood posters server-side for the cinematic hero background
  const rawMovies = await getTopBollywoodMovies(24);
  const movies    = rawMovies.map(normaliseTMDBMovie);

  return (
    <>
      <HeroSection movies={movies} />
      <FeatureCards />
      <WorkflowSection />
      <FinancialSection />
      <TargetUsersSection />
      <PricingPreview />
      <TrustSection />
      <CTASection />
    </>
  );
}
