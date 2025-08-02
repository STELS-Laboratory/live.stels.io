import type { ReactNode } from "react";

/**
 * Screen wrapper component for consistent page layout
 */
function Screen({ children }: { children: ReactNode }): React.ReactElement {
	return (
		<div className="flex relative flex-col overflow-y-auto">
			{children}
		</div>
	);
}

export default Screen;
