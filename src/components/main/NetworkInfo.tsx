import {useEffect} from "react";
import {useAppStore} from "@/stores";

/**
 * NetworkInfo component displaying connection status and network information
 */
export default function NetworkInfo(): React.ReactElement {
	const {
		online,
		effectiveType,
		downlink,
		rtt,
		type,
		saveData,
		updateStatus,
	} = useAppStore();
	
	useEffect(() => {
		updateStatus();
	}, [updateStatus]);
	
	return (
		<div>
			<h2>Network: {online ? "🟢" : "🔴"}</h2>
			<ul>
				<li>Type (connection): {type || "unknown"}</li>
				<li>Type: {effectiveType || "n/a"}</li>
				<li>Speed (downlink): {downlink ? `${downlink} mb/s` : "n/a"}</li>
				<li>RTT: {rtt ? `${rtt} ms` : "n/a"}</li>
				<li>Traffic economy: {saveData ? "Yes" : "No"}</li>
			</ul>
		</div>
	);
}
