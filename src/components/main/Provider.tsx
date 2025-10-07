import { type ReactNode, useEffect } from "react";
import useWebSocketStore from "@/hooks/useWebSocketStore";
import { useAppStore, useAuthStore } from "@/stores";
import Loader from "@/components/ui/loader";

function SessionProvider(
	{ children }: { children: ReactNode },
) {
	const { connectNode, connection } = useWebSocketStore();
	const { online } = useAppStore();
	const { connectionSession, isConnected } = useAuthStore();

	useEffect(() => {
		console.log("[Provider] WebSocket connection effect triggered:", {
			isConnected,
			hasConnectionSession: !!connectionSession,
			socket: connectionSession?.socket,
			network: connectionSession?.network,
		});

		// Only connect if user is authenticated and has a connection session
		if (isConnected && connectionSession && connectionSession.socket) {
			console.log("[Provider] Initiating WebSocket connection...");

			const config = {
				raw: {
					info: {
						connector: {
							socket: connectionSession.socket,
							protocols: ["webfix"],
						},
						network: connectionSession.network,
						title: connectionSession.title,
						pid: "sonar",
					},
				},
			};

			connectNode(config);
		} else {
			console.log("[Provider] WebSocket connection skipped:", {
				reason: !isConnected
					? "not connected"
					: !connectionSession
					? "no session"
					: !connectionSession.socket
					? "no socket URL"
					: "unknown",
			});
		}
	}, [connectNode, isConnected, connectionSession]);

	return connection || online
		? children
		: <Loader>Connecting to network...</Loader>;
}

export default SessionProvider;
