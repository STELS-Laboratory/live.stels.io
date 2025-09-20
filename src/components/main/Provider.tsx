import { type ReactNode, useEffect } from "react";
import useWebSocketStore from "@/hooks/useWebSocketStore.ts";
import { useAppStore } from "@/stores";
import Loader from "@/components/ui/loader";

function SessionProvider(
	{ children }: { children: ReactNode },
) {
	const { connectNode, connection } = useWebSocketStore();
	const { online } = useAppStore();

	useEffect(() => {
		const config = {
			raw: {
				info: {
					connector: {
						socket: "ws://10.0.0.238:8088",
						protocols: ["webfix"],
					},
					network: "testnet",
					title: "AI Trading Platform",
					pid: "sonar",
				},
			},
		};

		connectNode(config);
	}, [connectNode]);

	return connection || online ? children : <Loader>Init System....</Loader>;
}

export default SessionProvider;
