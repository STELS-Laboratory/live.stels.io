import {useEffect, useState} from "react"

export function useMobile(breakpoint = 768): boolean {
	const [isMobile, setIsMobile] = useState<boolean>(false)
	
	useEffect(() => {
		function checkMobile() {
			setIsMobile(window.innerWidth < breakpoint)
		}
		
		checkMobile()
		
		window.addEventListener("resize", checkMobile)
		
		return () => window.removeEventListener("resize", checkMobile)
	}, [breakpoint])
	
	return isMobile
}

export function useScreenWidth(): number {
	const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0)
	
	useEffect(() => {
		function updateWidth() {
			setWidth(window.innerWidth)
		}
		
		updateWidth()
		
		window.addEventListener("resize", updateWidth)
		return () => window.removeEventListener("resize", updateWidth)
	}, [])
	
	return width
}

export function useOrientation(): "portrait" | "landscape" {
	const [orientation, setOrientation] = useState<"portrait" | "landscape">(
		typeof window !== "undefined" ? (window.innerHeight > window.innerWidth ? "portrait" : "landscape") : "portrait",
	)
	
	useEffect(() => {
		function updateOrientation() {
			setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape")
		}
		
		updateOrientation()
		
		window.addEventListener("resize", updateOrientation)
		
		return () => window.removeEventListener("resize", updateOrientation)
	}, [])
	
	return orientation
}

export function useDeviceType() {
	const width = useScreenWidth()
	
	return {
		isMobile: width < 768,
		isTablet: width >= 768 && width < 1024,
		isDesktop: width >= 1024,
		isLargeDesktop: width >= 1440,
	}
}
