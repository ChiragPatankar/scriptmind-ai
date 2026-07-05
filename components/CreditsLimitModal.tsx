"use client";

import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/useCredits";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreditsLimitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { plan } = useCredits();
  const router = useRouter();

  useEffect(() => {
    function handleCreditsExhausted() {
      setIsOpen(true);
    }
    window.addEventListener("insufficient-credits", handleCreditsExhausted);
    return () => window.removeEventListener("insufficient-credits", handleCreditsExhausted);
  }, []);

  const handleUpgradeClick = () => {
    setIsOpen(false);
    router.push("/settings?tab=billing");
  };

  const getModalContent = () => {
    const activePlan = plan ?? "free";
    if (activePlan === "free") {
      return {
        title: "Trial Pack Exhausted",
        description: "You have used all the credits in your Trial Pack (₹49). Upgrade to Basic or Pro plan to get more credits and unlock Finance Studio and advanced AI analysis tools.",
        ctaLabel: "Upgrade Plan",
      };
    } else if (activePlan === "basic") {
      return {
        title: "Basic Credits Exhausted",
        description: "You have used all your monthly credits on the Basic plan. Upgrade to the Pro plan to get 700 credits per month and unlock full access to the Finance Studio.",
        ctaLabel: "Upgrade to Pro",
      };
    } else {
      return {
        title: "Credits Exhausted",
        description: "You have used all the credits in your current plan. Upgrade or manage your subscription to add more credits.",
        ctaLabel: "Manage Billing",
      };
    }
  };

  const content = getModalContent();

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalContent className="sm:max-w-md border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] bg-[#0B0B0F]">
        <ModalHeader className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <ModalTitle className="text-xl font-bold text-text-primary">
            {content.title}
          </ModalTitle>
          <ModalDescription className="text-sm text-text-muted mt-2 leading-relaxed">
            {content.description}
          </ModalDescription>
        </ModalHeader>
        <ModalBody className="text-center py-2">
          <p className="text-xs text-text-muted/60">
            Secure payments via Razorpay · Instantly activated
          </p>
        </ModalBody>
        <ModalFooter className="flex items-center justify-center gap-3 border-t-0 pb-6 pt-2">
          <Button variant="secondary" onClick={() => setIsOpen(false)} size="sm" className="px-4">
            Cancel
          </Button>
          <Button onClick={handleUpgradeClick} size="sm" className="px-5 bg-accent hover:bg-accent/80 text-white font-semibold">
            {content.ctaLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
