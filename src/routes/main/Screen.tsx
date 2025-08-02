import type { ReactNode } from "react";

/**
 * Screen wrapper component for consistent page layout
 */
function Screen({ children }: { children: ReactNode }): React.ReactElement {
	return (
		<div className="flex p-4 gap-4 relative w-full h-full flex-col overflow-y-auto">
			{children}
		</div>
	);
}

export default Screen;
