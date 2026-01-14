import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Power } from "lucide-react";
import { closeApp } from "@/lib/app_closer";

/**
 * Component that handles app closure - clears all data and attempts to close the app
 */
export default function AppCloser(): React.ReactElement {
	const [isClosing, setIsClosing] = useState(false);
	const [showDialog, setShowDialog] = useState(false);

	const handleCloseApp = async (): Promise<void> => {
		setIsClosing(true);

		try {
			// Use the global closeApp function
			await closeApp();
		} catch (error) {
			console.error("Error closing app:", error);
		} finally {
			// Note: This may not execute if window closes successfully
			setIsClosing(false);
		}
	};

	// Show confirmation dialog
	const handleShowDialog = (): void => {
		setShowDialog(true);
	};

	const handleCancel = (): void => {
		setShowDialog(false);
	};

	return (
		<>
			{/* Close App Button - can be placed anywhere in the UI */}
			<Button
				variant="ghost"
				size="sm"
				onClick={handleShowDialog}
				className="text-muted-foreground hover:text-destructive"
				disabled={isClosing}
			>
				<Power className="icon-sm" />
			</Button>

			{/* Confirmation Dialog */}
			<AnimatePresence>
				{showDialog && (
					<motion.div
						className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={handleCancel}
					>
						<motion.div
							className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold text-foreground">
									Close Application
								</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCancel}
									className="h-8 w-8 p-0"
								>
									<X className="icon-sm" />
								</Button>
							</div>

							<p className="text-muted-foreground mb-6">
								Are you sure you want to close the application? All data will be cleared.
							</p>

							<div className="flex gap-3 justify-end">
								<Button
									variant="outline"
									onClick={handleCancel}
									disabled={isClosing}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleCloseApp}
									disabled={isClosing}
									className="gap-2"
								>
									{isClosing ? (
										<>
											<div className="icon-sm border-2 border-current border-t-transparent rounded-full animate-spin" />
											Closing...
										</>
									) : (
										<>
											<Power className="icon-sm" />
											Close Application
										</>
									)}
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
