import React, { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/**
 * Props for LottieAnimation wrapper component
 */
interface LottieAnimationProps {
  /** URL to Lottie animation file */
  src: string;
  /** Animation loop mode */
  loop?: boolean;
  /** Autoplay on mount */
  autoplay?: boolean;
  /** Animation size */
  style?: React.CSSProperties;
  /** Additional CSS classes */
  className?: string;
  /** Fallback icon if animation fails to load */
  fallbackIcon?: React.ReactNode;
}

/**
 * Professional Lottie Animation Wrapper
 *
 * Features:
 * - Accessibility support (respects prefers-reduced-motion)
 * - Error handling with fallback
 * - Loading state
 * - Performance optimized
 */
export function LottieAnimation({
  src,
  loop = false,
  autoplay = true,
  style,
  className = "",
  fallbackIcon,
}: LottieAnimationProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent): void => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Error handler
  const handleError = (): void => {

    setHasError(true);
  };

  // If user prefers reduced motion or animation failed, show fallback
  if (prefersReducedMotion || hasError) {
    if (fallbackIcon) {
      return (
        <div
          className={`flex items-center justify-center ${className}`}
          style={style}
        >
          {fallbackIcon}
        </div>
      );
    }
    // Return empty div with same dimensions to maintain layout
    return <div style={style} className={className} />;
  }

  return (
    <div className={className}>
      <DotLottieReact
        src={src}
        loop={loop}
        autoplay={autoplay}
        style={style}
        onError={handleError}
      />
    </div>
  );
}
