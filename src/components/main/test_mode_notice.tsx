/**
 * Test Mode Notice
 * Displays an important notice about the project being in test mode
 * and token issuance policy on app startup
 */

import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

/**
 * Test Mode Notice Component
 * Shows an important notice before authentication
 */
export default function TestModeNotice(): React.ReactElement | null {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		// Check if notice has been shown in this session
		const sessionKey = "test-mode-notice-shown";
		
		try {
			const shown = sessionStorage.getItem(sessionKey);

			if (!shown) {
				// Show notice after a brief delay to ensure proper rendering
				const timer = setTimeout(() => {
					setIsOpen(true);
					// Mark as shown in session storage
					try {
						sessionStorage.setItem(sessionKey, "true");
					} catch (e) {
						console.warn("[TestModeNotice] Failed to save to sessionStorage:", e);
					}
				}, 800);

				return () => clearTimeout(timer);
			}
		} catch (error) {
			// If sessionStorage is not available, show notice anyway
			console.warn("[TestModeNotice] SessionStorage not available, showing notice:", error);
			const timer = setTimeout(() => {
				setIsOpen(true);
			}, 800);
			return () => clearTimeout(timer);
		}
	}, []);

	/**
	 * Handle dialog close
	 */
	const handleClose = (): void => {
		setIsOpen(false);
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-md" showCloseButton={false}>
						<DialogHeader>
							<div className="flex items-center gap-3 mb-2">
								<AlertTriangle className="w-5 h-5 text-amber-500" />
								<DialogTitle>Important Notice</DialogTitle>
							</div>
							<DialogDescription className="text-left space-y-3 pt-2">
								<div className="space-y-2">
									<p className="text-sm text-foreground">
										<strong>Project Ownership:</strong> This project is
										developed and owned by Gliesereum Ukraine, with rights to
										all assets and management by Gliese (United States of
										America).
									</p>

									<p className="text-sm text-foreground">
										<strong>Token Policy:</strong> The STELS team does not sell
										and has never sold any tokens.
									</p>

									<p className="text-sm text-foreground">
										<strong>Project Status:</strong> This project is currently
										running in test mode.
									</p>

									<p className="text-sm text-foreground">
										<strong>Mainnet Transition:</strong> The transition to
										mainnet will begin on November 27, 2025.
									</p>

									<p className="text-sm text-foreground">
										<strong>Token Issuance:</strong> Tokens are issued
										exclusively to developers for building applications within
										the network.
									</p>

									<div className="pt-2 mt-3 border-t border-border">
										<p className="text-sm text-foreground mb-2">
											<strong>Contact:</strong> For questions or support,
											please reach out to our team.
										</p>
										<a
											href="mailto:labs@stels.io"
											className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-600 transition-colors"
										>
											<Mail className="w-4 h-4" />
											labs@stels.io
										</a>
									</div>
								</div>
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								onClick={handleClose}
								className="w-full sm:w-auto"
								variant="default"
							>
								I Understand
							</Button>
						</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

