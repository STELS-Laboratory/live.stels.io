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
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * SVG icon components map
 */
const SVG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scanner: ({ className }) => (
    <svg
      viewBox="0 0 499 499"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M423.519 138.091C424.862 133.219 419.194 129.345 414.812 132.14L257.316 232.608C255.724 233.623 254.768 235.333 254.768 237.163V474.156C254.768 478.7 260.221 481.266 263.983 478.492L290.73 458.771C291.883 457.921 292.654 456.682 292.886 455.307L319.712 296.339C319.972 294.802 320.903 293.444 322.272 292.604L390.996 250.433C392.203 249.692 393.075 248.546 393.44 247.22L423.519 138.091ZM384.987 277.533C386.252 272.751 380.781 268.932 376.408 271.546L330.42 299.033C329.024 299.867 328.072 301.236 327.805 302.79L317.275 364.243C316.478 368.891 321.781 372.267 325.955 369.771L365.135 346.333C366.386 345.585 367.286 344.403 367.648 343.035L384.987 277.533ZM75.4812 138.091C74.1383 133.219 79.8064 129.345 84.1881 132.14L241.684 232.608C243.276 233.624 244.232 235.333 244.232 237.163V474.156C244.232 478.7 238.779 481.266 235.017 478.492L208.271 458.771C207.118 457.921 206.347 456.682 206.115 455.307L179.288 296.339C179.029 294.803 178.098 293.444 176.728 292.604L108.004 250.433C106.798 249.693 105.926 248.546 105.56 247.221L75.4812 138.091ZM114.013 277.533C112.747 272.751 118.219 268.932 122.592 271.546L168.58 299.033C169.975 299.867 170.928 301.236 171.195 302.79L181.726 364.243C182.522 368.891 177.22 372.267 173.046 369.771L133.866 346.333C132.615 345.585 131.715 344.403 131.352 343.035L114.013 277.533Z"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  ),
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
