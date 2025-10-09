/**
 * App Icon Component
 * Displays SVG icon if available, otherwise shows first letter
 */

import React from "react";
import { cn } from "@/lib/utils.ts";

interface AppIconProps {
  appId: string;
  appName: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

/**
 * SVG icon components map
 */
const SVG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wallet: ({ className }) => (
    <svg
      viewBox="0 0 499 499"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M498.712 9.86756C500.635 2.89029 492.518 -2.65764 486.243 1.34523L260.693 145.225C258.414 146.68 257.045 149.127 257.045 151.749V491.145C257.045 497.653 264.853 501.328 270.241 497.355L308.545 469.113C310.196 467.895 311.3 466.121 311.632 464.152L350.051 236.495C350.422 234.294 351.755 232.348 353.717 231.145L452.137 170.752C453.864 169.692 455.113 168.05 455.636 166.152L498.712 9.86756ZM443.53 209.562C445.343 202.714 437.507 197.245 431.245 200.988L365.386 240.352C363.387 241.547 362.022 243.507 361.641 245.733L346.56 333.74C345.42 340.396 353.013 345.232 358.991 341.656L415.101 308.09C416.892 307.019 418.181 305.327 418.7 303.368L443.53 209.562ZM0.287704 9.86793C-1.63542 2.89066 6.48186 -2.65728 12.7569 1.34559L238.307 145.226C240.586 146.68 241.956 149.128 241.956 151.749V491.145C241.956 497.653 234.147 501.328 228.759 497.355L190.456 469.113C188.805 467.895 187.701 466.121 187.368 464.152L148.949 236.495C148.578 234.294 147.245 232.349 145.284 231.145L46.8634 170.752C45.1359 169.692 43.887 168.051 43.3637 166.152L0.287704 9.86793ZM55.4695 209.562C53.6567 202.714 61.4922 197.245 67.7545 200.988L133.614 240.352C135.613 241.547 136.977 243.507 137.359 245.733L152.44 333.739C153.581 340.396 145.987 345.231 140.01 341.656L83.9002 308.09C82.109 307.019 80.8195 305.327 80.3008 303.368L55.4695 209.562Z"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  ),
};

/**
 * Get size classes for icon
 */
function getSizeClasses(size: AppIconProps["size"]): string {
  const sizes = {
    sm: "w-4 h-4 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-8 h-8 text-base",
    xl: "w-12 h-12 text-2xl",
    "2xl": "w-16 h-16 text-4xl",
    "3xl": "w-20 h-20 text-5xl",
  };
  return sizes[size || "lg"];
}

/**
 * App Icon Component
 */
export function AppIcon({
  appId,
  appName,
  className,
  size = "lg",
}: AppIconProps): React.ReactElement {
  const SVGIcon = SVG_ICONS[appId.toLowerCase()];
  const sizeClasses = getSizeClasses(size);

  // If SVG icon exists, use it
  if (SVGIcon) {
    return <SVGIcon className={cn(sizeClasses, className)} />;
  }

  // Otherwise, show first letter
  const firstLetter = appName.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center font-black tracking-tight",
        sizeClasses,
        className,
      )}
    >
      {firstLetter}
    </div>
  );
}
