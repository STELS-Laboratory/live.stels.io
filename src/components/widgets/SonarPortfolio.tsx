import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import Loader from "@/components/ui/loader.tsx";

function SonarPortfolio() {
	const session = useSessionStoreSync() as any;
	
	if (
		!session || !session["testnet.snapshot.sonar"] ||
		!session["testnet.runtime.sonar"]
	) {
		return <Loader>Scanning connection Testnet</Loader>;
	}
	
	const snapshot = session["testnet.snapshot.sonar"];
	console.log(snapshot);
	// {
	// 	"channel": "testnet.snapshot.sonar",
	// 	"module": "snapshot",
	// 	"widget": "widget.testnet.snapshot.sonar",
	// 	"raw": {
	// 	"accounts": [
	// 		"snapshot.balance.gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu.bybit.g-rns.1754182950589",
	// 		"snapshot.balance.gfmUbwVewst8tJi8nsNbXS662sqUYmG6j6.bybit.g-egor.1754182839513",
	// 		"snapshot.balance.ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv.bybit.g-vld.1754005140854",
	// 		"snapshot.balance.gnwx16wheMmeQrALvxmfwAiEiE82cqKavW.bybit.g-gnl.1754010377076"
	// 	],
	// 		"connectors": [],
	// 		"workers": {
	// 		"active": 0,
	// 			"stopped": 0,
	// 			"total": 0
	// 	},
	// 	"liquidity": 794840.1071516799,
	// 		"protection": 2299.72830056,
	// 		"available": 190070.39964545,
	// 		"margin": {
	// 		"balance": 190070.39964545,
	// 			"initial": 0,
	// 			"maintenance": 0
	// 	},
	// 	"rate": 0,
	// 		"exchanges": [
	// 		"bybit"
	// 	],
	// 		"uniqueExchange": 1,
	// 		"coins": {
	// 		"BTC": 0.00212835,
	// 			"ETH": 0.00001206,
	// 			"SOL": 0.00184265,
	// 			"ETHW": 2e-8,
	// 			"ETHF": 2e-8,
	// 			"USDT": 792044.9108656,
	// 			"BNB": 0.00000423,
	// 			"SQR": 0.9371156,
	// 			"TON": 0.0138415,
	// 			"SIS": 0.0021,
	// 			"IZI": 0.0069,
	// 			"BBL": 846.0585,
	// 			"CBX": 0.0068,
	// 			"APEX": 1351.5613,
	// 			"GENE": 0.0026,
	// 			"PLY": 0.0083,
	// 			"KASTA": 0.002,
	// 			"DLC": 902.3802,
	// 			"PTU": 0.0007,
	// 			"VELAR": 1568.0708,
	// 			"TAP": 0.0077
	// 	},
	// 	"timestamp": 1754010377076
	// }
	// }
	const runtime = session["testnet.runtime.sonar"];
	console.log(runtime);
	// {
	// 	"channel": "testnet.runtime.sonar",
	// 	"module": "sonar",
	// 	"widget": "widget.testnet.runtime.sonar",
	// 	"raw": {
	// 	"accounts": [
	// 		"account.balance.gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu.bybit.g-rns",
	// 		"account.balance.gfmUbwVewst8tJi8nsNbXS662sqUYmG6j6.bybit.g-egor",
	// 		"account.balance.ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv.bybit.g-bht",
	// 		"account.balance.ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv.bybit.g-bhts",
	// 		"account.balance.ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv.bybit.g-fullip",
	// 		"account.balance.ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv.bybit.g-vld",
	// 		"account.balance.gnwx16wheMmeQrALvxmfwAiEiE82cqKavW.bybit.g-gnl"
	// 	],
	// 		"connectors": [],
	// 		"workers": {
	// 		"active": 40,
	// 			"stopped": 0,
	// 			"total": 40
	// 	},
	// 	"liquidity": 2069877.32074595,
	// 		"protection": 0,
	// 		"available": 1189642.42132761,
	// 		"margin": {
	// 		"balance": 1193813.76098706,
	// 			"initial": 4171.33965945,
	// 			"maintenance": 1668.53586378
	// 	},
	// 	"rate": 0.0034,
	// 		"exchanges": [
	// 		"bybit"
	// 	],
	// 		"uniqueExchange": 1,
	// 		"coins": {
	// 		"BTC": 0.00214993,
	// 			"ETH": 317.65010628,
	// 			"SOL": 0.0022883499999999998,
	// 			"ETHW": 2e-8,
	// 			"ETHF": 2e-8,
	// 			"USDT": 768732.93190062,
	// 			"BNB": 0.00000423,
	// 			"SQR": 1.628303,
	// 			"TON": 0.0138415,
	// 			"GRT": 0.005,
	// 			"SIS": 0.0021,
	// 			"IZI": 0.0069,
	// 			"BBL": 846.0585,
	// 			"CBX": 0.0068,
	// 			"APEX": 1351.5613,
	// 			"GENE": 0.0026,
	// 			"PLY": 0.0083,
	// 			"KASTA": 0.002,
	// 			"DLC": 902.3802,
	// 			"PTU": 0.0007,
	// 			"VELAR": 1568.0708,
	// 			"TAP": 0.0077
	// 	},
	// 	"timestamp": 1755649869241
	// },
	// 	"timestamp": 1755649874694
	// }
	
	return <div>Sonar Portfolio</div>;
}

export default SonarPortfolio;
