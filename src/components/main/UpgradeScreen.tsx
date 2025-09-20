import {motion} from "framer-motion";
import {useEffect, useState} from "react";
import Graphite from "@/components/ui/vectors/logos/Graphite";
import {useAppStore} from "@/stores";

interface UpgradeScreenProps {
	onComplete?: () => void;
	endDate?: Date;
}

/**
 * Beautiful upgrade screen component with animated progress and status updates
 */
const UpgradeScreen = ({onComplete, endDate}: UpgradeScreenProps) => {
	const {version} = useAppStore();
	const [isVisible, setIsVisible] = useState(true);
	
	const upgradeSteps = [
		"Initializing upgrade process...",
		"Downloading latest version...",
		"Verifying integrity...",
		"Installing updates...",
		"Configuring new features...",
		"Optimizing performance...",
		"Finalizing installation...",
		"Upgrade complete!",
	];
	
	useEffect(() => {
		if (!endDate) return;
		
		const targetTime = endDate.getTime();
		let stepIndex = 0;
		
		const interval = setInterval(() => {
			const now = Date.now();
			const remaining = targetTime - now;
			
			// Calculate progress based on time remaining (simulate upgrade progress)
			// Assume upgrade started 2 hours ago for realistic progress simulation
			const upgradeStartTime = targetTime - (2 * 60 * 60 * 1000); // 2 hours before end time
			const totalDuration = 2 * 60 * 60 * 1000; // 2 hours total
			const elapsed = now - upgradeStartTime;
			
			const progressPercentage = Math.min(
				100,
				Math.max(0, (elapsed / totalDuration) * 100),
			);
			
			// Update step based on progress
			const newStepIndex = Math.floor(
				(progressPercentage / 100) * upgradeSteps.length,
			);
			if (newStepIndex !== stepIndex && newStepIndex < upgradeSteps.length) {
				stepIndex = newStepIndex;
			}
			
			// Check if upgrade is complete
			if (remaining <= 0) {
				clearInterval(interval);
				setTimeout(() => {
					setIsVisible(false);
					onComplete?.();
				}, 1000);
			}
		}, 1000);
		
		return () => clearInterval(interval);
	}, [endDate, onComplete, upgradeSteps.length]);
	
	if (!isVisible) return null;
	
	return (
		<motion.div
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}
			className="flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-950"
		>
			<div className="flex flex-col items-center space-y-8 max-w-md w-full mt-60">
				{/* Logo with Upgrade Animation */}
				<motion.div
					initial={{scale: 0.5, rotate: 0}}
					animate={{scale: 1, rotate: 0}}
					transition={{
						type: "spring",
						stiffness: 150,
						damping: 15,
						duration: 2,
					}}
					className="relative"
				>
					<Graphite primary="#3367d9" size={10}/>
					
					{/* Animated Glow Effect */}
					<motion.div
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.2, 0.8, 0.2],
							rotate: [0, 180, 360],
						}}
						transition={{
							duration: 3,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 blur-2xl"
					/>
					
					{/* Upgrade Badge */}
					<motion.div
						initial={{scale: 0, opacity: 0}}
						animate={{scale: 1, opacity: 1}}
						transition={{delay: 1, duration: 0.5}}
						className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full"
					>
						TESTNET
					</motion.div>
				</motion.div>
				
				{/* Title and Version */}
				<motion.div
					initial={{y: 20, opacity: 0}}
					animate={{y: 0, opacity: 1}}
					transition={{delay: 0.5, duration: 0.8}}
					className="text-center space-y-3"
				>
					<h1
						className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
						UPGRADE
					</h1>
					<motion.div
						initial={{opacity: 0, scale: 0.9}}
						animate={{opacity: 1, scale: 1}}
						transition={{delay: 1, duration: 0.6}}
						className="space-y-1"
					>
						<p className="text-lg text-zinc-300 font-medium">
							STELS Network
						</p>
						<p className="text-sm text-amber-400 font-mono">
							Version {version}
						</p>
					</motion.div>
				</motion.div>
				
				{/* Loading Animation */}
				<motion.div
					initial={{opacity: 0}}
					animate={{opacity: 1}}
					transition={{delay: 2}}
					className="flex space-x-3"
				>
					{[0, 1, 2, 3].map((i) => (
						<motion.div
							key={i}
							animate={{
								scale: [1, 1.4, 1],
								opacity: [0.4, 1, 0.4],
							}}
							transition={{
								duration: 1.2,
								repeat: Infinity,
								delay: i * 0.15,
								ease: "easeInOut",
							}}
							className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
						/>
					))}
				</motion.div>
				
				{/* Status Message */}
				<motion.div
					initial={{y: 10, opacity: 0}}
					animate={{y: 0, opacity: 1}}
					transition={{delay: 2.5, duration: 0.6}}
					className="text-center text-xs text-zinc-600 space-y-2 max-w-sm"
				>
					<p>Please wait while we upgrade!</p>
				</motion.div>
			</div>
			
			{/* Background Effects */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{/* Animated Background Orbs */}
				<motion.div
					animate={{
						x: [0, 100, 0],
						y: [0, -50, 0],
					}}
					transition={{
						duration: 8,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"
				/>
				<motion.div
					animate={{
						x: [0, -80, 0],
						y: [0, 60, 0],
					}}
					transition={{
						duration: 10,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 2,
					}}
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl"
				/>
				
				{/* Grid Pattern */}
				<div
					className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-20"/>
			</div>
		</motion.div>
	);
};

export default UpgradeScreen;
