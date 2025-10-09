import type {ReactNode} from "react";

/**
 * Screen wrapper component for consistent page layout
 */
function Screen({children}: { children: ReactNode }): React.ReactElement {
	return (
		<>
			<div className="min-w-0">
				{children}
			</div>
		</>
	);
}

export default Screen;
