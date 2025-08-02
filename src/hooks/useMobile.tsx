import { useEffect, useState } from "react";

export function useMobile(breakpoint = 768): boolean {
	const [isMobile, setIsMobile] = useState<boolean>(false);

	useEffect(() => {
		/**
		 * Checks if the current device is mobile based on user agent
		 */
		function checkMobile(): boolean {
			setIsMobile(window.innerWidth < breakpoint);
		}

		checkMobile();

		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, [breakpoint]);

	return isMobile;
}

export function useScreenWidth(): number {
	const [width, setWidth] = useState<number>(
		typeof window !== "undefined" ? window.innerWidth : 0,
	);

	useEffect(() => {
		/**
		 * Updates the window width state
		 */
		function updateWidth(): void {
			setWidth(window.innerWidth);
		}

		updateWidth();

		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, []);

	return width;
}

export function useOrientation(): "portrait" | "landscape" {
	const [orientation, setOrientation] = useState<"portrait" | "landscape">(
		typeof window !== "undefined"
			? (window.innerHeight > window.innerWidth ? "portrait" : "landscape")
			: "portrait",
	);

	useEffect(() => {
		/**
		 * Updates the device orientation state
		 */
		function updateOrientation(): void {
			setOrientation(
				window.innerHeight > window.innerWidth ? "portrait" : "landscape",
			);
		}

		updateOrientation();

		window.addEventListener("resize", updateOrientation);

		return () => window.removeEventListener("resize", updateOrientation);
	}, []);

	return orientation;
}

/**
 * Hook for detecting device type and orientation
 */
export function useDeviceType(): {
	isMobile: boolean;
	width: number;
	orientation: "portrait" | "landscape";
} {
	const width = useScreenWidth();

	return {
		isMobile: width < 768,
		isTablet: width >= 768 && width < 1024,
		isDesktop: width >= 1024,
		isLargeDesktop: width >= 1440,
	};
}
