import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Graphite from "@/components/ui/vectors/logos/graphite";

interface SplashScreenProps {
	onComplete?: () => void;
	duration?: number;
	updateApp?: boolean;
}

const SplashScreen = (
	{ updateApp, onComplete, duration = 1200 }: SplashScreenProps,
) => {
	const [progress, setProgress] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					setTimeout(() => {
						setIsVisible(false);
						onComplete?.();
					}, 150);
					return 100;
				}
				return prev + 3;
			});
		}, duration / 40);

		return () => clearInterval(interval);
	}, [duration, onComplete]);

	if (!isVisible) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-background"
		>
			<div className="flex flex-col items-center space-y-8">
				{/* Logo Animation */}
				<motion.div
					initial={{ scale: 0.5, rotate: 0 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{
						type: "spring",
						stiffness: 260,
						damping: 18,
						duration: 0.6,
					}}
					className="relative"
				>
					<Graphite primary="#f59e0b" size={8} />

					{/* Glow effect */}
					<motion.div
						animate={{
							scale: [1, 1.1, 1],
							opacity: [0.3, 0.6, 0.3],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl"
					/>
				</motion.div>

				{/* Title */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.4 }}
					className="text-center space-y-2"
				>
					<h1 className="text-4xl font-bold text-foreground tracking-wide">
						STELS
					</h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3, duration: 0.3 }}
						className="text-lg text-muted-foreground font-medium"
					>
						Verifying session...
					</motion.p>
				</motion.div>

				{/* Progress Bar */}
				<motion.div
					initial={{ width: 0, opacity: 0 }}
					animate={{ width: "100%", opacity: 1 }}
					transition={{ delay: 0.4, duration: 0.3 }}
					className="w-80 space-y-3"
				>
					<div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
						<motion.div
							className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
							style={{ width: `${progress}%` }}
							transition={{ duration: 0.1 }}
						/>
					</div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="text-center text-sm text-muted-foreground"
					>
						{progress < 100 ? `${progress}%` : "Ready!"}
					</motion.div>
				</motion.div>

				{/* Loading Dots */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6 }}
					className="flex space-x-2"
				>
					{[0, 1, 2].map((i) => (
						<motion.div
							key={i}
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.5, 1, 0.5],
							}}
							transition={{
								duration: 0.8,
								repeat: Infinity,
								delay: i * 0.1,
								ease: "easeInOut",
							}}
							className="w-2 h-2 bg-amber-500 rounded-full"
						/>
					))}
				</motion.div>

				{/* Network Status */}
				<motion.div
					initial={{ y: 10, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.7, duration: 0.3 }}
					className="text-center text-xs text-muted-foreground space-y-1"
				>
					<p>{updateApp ? "Updating network..." : "Initializing node..."}</p>
				</motion.div>
			</div>

			{/* Background Pattern */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
			</div>
		</motion.div>
	);
};

export default SplashScreen;
