import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Hook to detect if device is mobile (used by shadcn sidebar)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * Alias for useIsMobile - maintains backward compatibility
 */
export function useMobile(): boolean {
  return useIsMobile();
}

/**
 * Device type detection
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>("desktop");

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType("mobile");
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
}

/**
 * Screen width hook
 */
export function useScreenWidth(): number {
  const [width, setWidth] = React.useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

/**
 * Orientation detection
 */
export type Orientation = "portrait" | "landscape";

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = React.useState<Orientation>(
    typeof window !== "undefined" && window.innerHeight > window.innerWidth
      ? "portrait"
      : "landscape"
  );

  React.useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return orientation;
}
