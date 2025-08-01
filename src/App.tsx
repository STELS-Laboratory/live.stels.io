import {useAppStore} from '@/stores';
import {ReactFlowProvider} from "reactflow";
import SessionProvider from '@/components/main/Provider';
import Welcome from "@/routes/main/Welcome.tsx";
import MarketDataViewer from "@/routes/main/Markets.tsx";
import Flow from "@/routes/main/canvas/Flow.tsx";
import HeterogenComponent from "@/routes/main/globe/HeterogenMap.tsx";
import Scanner from "@/routes/main/Scanner.tsx";
import GliesereumWallet from "@/routes/wallet/Wallet.tsx";

export default function Dashboard() {
	const {currentRoute, setRoute, allowedRoutes} = useAppStore()
	
	return (
		<SessionProvider>
			<div className="flex absolute w-[100%] h-[100%]">
				<nav className="w-[100px] h-[100%] border-r bg-zinc-900 border-b flex flex-col gap-4 uppercase">
					<div className="flex text-zinc-700 w-full h-[78px] border-b p-4 justify-center items-center bg-zinc-950">
						STELS
					</div>
					{allowedRoutes.map((route) => (
						<div className={currentRoute === route ? 'text-amber-600 cursor-no-drop' : 'text-zinc-500 cursor-pointer'} key={route} onClick={() => setRoute(route)}>
							{route}
						</div>
					))}
				</nav>
				
				<div className="flex justify-center flex-1 overflow-hidden relative">
					{currentRoute === 'welcome' && <Welcome/>}
					{currentRoute === 'scanner' && <Scanner/>}
					{currentRoute === 'markets' && <MarketDataViewer/>}
					{currentRoute === 'network' && <HeterogenComponent/>}
					{currentRoute === 'wallet' && <GliesereumWallet/>}
					<ReactFlowProvider>
						{currentRoute === 'canvas' && <Flow/>}
					</ReactFlowProvider>
				</div>
			</div>
		</SessionProvider>
	)
}
