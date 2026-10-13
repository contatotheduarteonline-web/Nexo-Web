import React from "react";
import { Globe } from "lucide-react";

interface PlanLogoProps {
  /** Resolved logo URL (custom image, plan image or edital image). */
  imageUrl?: string | null;
  isLoading?: boolean;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Small circular logo used by plan/edital selectors across the platform.
 * Renders the registered image when available, the globe icon otherwise.
 */
export const PlanLogo: React.FC<PlanLogoProps> = ({
  imageUrl,
  isLoading = false,
  alt = "Plano",
  className = "h-4 w-4",
  fallbackClassName = "text-[#527DFF]",
}) => {
  if (isLoading) {
    return <span className={`${className} shrink-0 animate-pulse rounded-full bg-[#263447]`} />;
  }
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return <Globe className={`${className} shrink-0 ${fallbackClassName}`} />;
};
