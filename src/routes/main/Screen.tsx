import type {ReactNode} from "react";

function Screen({children}: {children: ReactNode}) {
	return (
		<div
			className="flex p-4 gap-4 relative flex-1 flex-col overflow-y-auto">
			{children}
		</div>
	)
}

export default Screen