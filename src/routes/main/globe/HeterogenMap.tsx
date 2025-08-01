import type React from "react"
import {useEffect, useState} from "react"
import Globe from "react-globe.gl"

import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import {filterSession} from "@/lib/utils.ts";
import Screen from "@/routes/main/Screen.tsx";
import Header from "@/components/main/Header.tsx";

interface LocationData {
	latitude: number
	longitude: number
	name: string
	ip: string
	network: string
	version: string
	city: string
	region: string | null
	region_code: string | null
	country: string
	country_name: string
	country_code: string
	country_code_iso3: string
	country_capital: string
	country_tld: string
	continent_code: string
	in_eu: boolean
	postal: string
	timezone: string
	utc_offset: string
	country_calling_code: string
	currency: string
	currency_name: string
	languages: string
	country_area: number
	country_population: number
	asn: string
	org: string
}

interface ConfigData {
	network: string
	title: string
	type: string
	brain: string
	tick: number
	limit: boolean
	connectors: string[]
	markets: string[]
	dns: {
		public: boolean
		hetNet: {
			socket: string
			protocol: string
		}
	}
}

interface NodeData {
	name: string
	location: LocationData
	config: ConfigData
}

const HeterogenComponent: React.FC = () => {
	const [nodes, setNodes] = useState<NodeData[]>([])
	
	const session: any = useSessionStoreSync();
	
	const netMap = filterSession(session, /\.heterogen\..*\.setting$/)
	
	useEffect(() => {
		const parsedNodes = parseNodeData(netMap)
		setNodes(parsedNodes)
	}, [])
	
	const parseNodeData = (data: any[]): NodeData[] => {
		const nodeMap: Record<string, Partial<NodeData>> = {}
		
		data.forEach((item) => {
			const nodeName = item.key
			
			if (!nodeMap[nodeName]) {
				nodeMap[nodeName] = {name: nodeName}
			}
			
			const node = nodeMap[nodeName]
			
			node.location = item.value.raw.location as LocationData
			node.config = item.value.raw as ConfigData
		})
		
		return Object.values(nodeMap).filter((node) => node.location && node.config) as NodeData[]
	}
	
	return (
		<Screen>
			<Header title={"Network"} description={"Heterogeneus decentralization AI network"} />
			<div className="w-[100%] h-[100%] overflow-hidden relative">
				<Globe
					globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
					pointsData={nodes}
					pointLat={(d) => (d as NodeData).location.latitude}
					pointLng={(d) => (d as NodeData).location.longitude}
					pointColor={() => "orange"}
					pointAltitude={0.02}
					pointRadius={0.8}
					// @ts-ignore
					pointLabel={(d: NodeData) => (
						<div className="p-4 border">
							<h3 className="text-sm font-bold">{d.name}</h3>
							<p className="text-xs">Network: {d.config.network}</p>
							<p className="text-xs">Location: {d.location.city}, {d.location.country_name}</p>
							<p className="text-xs">IP: {d.location.ip}</p>
							<p className="text-xs">ASN: {d.location.asn} - {d.location.org}</p>
						</div>
					) as any}
					atmosphereColor="gray"
					backgroundColor="black"
				/>
			</div>
		</Screen>
	)
}

export default HeterogenComponent
