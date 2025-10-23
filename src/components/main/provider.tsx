import { type ReactNode, useEffect } from "react";
import useWebSocketStore from "@/hooks/use_web_socket_store";
import { useAppStore, useAuthStore } from "@/stores";
import Loader from "@/components/ui/loader";

function SessionProvider(
	{ children }: { children: ReactNode },
) {
	const { connectNode, connection } = useWebSocketStore();
	const { online } = useAppStore();
	const { connectionSession, isConnected } = useAuthStore();

	useEffect(() => {
		// Only connect if user is authenticated and has a connection session
		if (isConnected && connectionSession) {
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
		}
	}, [connectNode, isConnected, connectionSession]);

	return connection || online
		? children
		: <Loader>Connecting to network...</Loader>;
}

export default SessionProvider;
