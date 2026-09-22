import React from "react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps = 12,
}) => {
  // Step 0 is the welcome screen (subtle starting indicator ~4%)
  const percentage = currentStep === 0 ? 4 : Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div
      id="onboarding-progress-bar-container"
      className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-zinc-800/50 backdrop-blur-xs pointer-events-none"
    >
      <div
        id="onboarding-progress-bar-fill"
        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FFA043] transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,107,0,0.5)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
