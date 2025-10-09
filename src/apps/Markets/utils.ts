/**
 * Utility functions for Markets component
 */

// Import currency icons
import BTCIcon from "@/assets/icons/coins/BTC.png";
import ETHIcon from "@/assets/icons/coins/ETH.png";
import SOLIcon from "@/assets/icons/coins/SOL.png";
import TRXIcon from "@/assets/icons/coins/TRX.png";
import XRPIcon from "@/assets/icons/coins/XRP.png";
import BNBIcon from "@/assets/icons/coins/BNB.png";
import SQRIcon from "@/assets/icons/coins/SQR.png";
import JASMYIcon from "@/assets/icons/coins/JASMY.png";

// Import exchange icons
import BinanceIcon from "@/assets/icons/exchanges/BINANCE.png";
import BybitIcon from "@/assets/icons/exchanges/BYBIT.png";
import OkxIcon from "@/assets/icons/exchanges/OKX.png";
import CoinbaseIcon from "@/assets/icons/exchanges/COINBASE.png";
import HtxIcon from "@/assets/icons/exchanges/HTX.png";
import KucoinIcon from "@/assets/icons/exchanges/KUCOIN.png";
import GateIcon from "@/assets/icons/exchanges/GATE.png";
import BitgetIcon from "@/assets/icons/exchanges/BITGET.png";
import UpbitIcon from "@/assets/icons/exchanges/UPBIT.png";
import BitstampIcon from "@/assets/icons/exchanges/BITSTAMP.png";

/**
 * Format price based on value and symbol
 */
export const formatPrice = (price: number, symbol: string): string => {
	if (symbol === "BTC" && price > 1000) {
		return `$${price.toLocaleString("en-US", {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		})}`;
	}
	if (price < 1) {
		return `$${price.toFixed(6)}`;
	}
	if (price < 100) {
		return `$${price.toFixed(4)}`;
	}
	return `$${price.toFixed(2)}`;
};

/**
 * Format volume with abbreviations
 */
export const formatVolume = (volume: number): string => {
	if (volume >= 1e9) {
		return `${(volume / 1e9).toFixed(2)}B`;
	}
	if (volume >= 1e6) {
		return `${(volume / 1e6).toFixed(2)}M`;
	}
	if (volume >= 1e3) {
		return `${(volume / 1e3).toFixed(2)}K`;
	}
	return volume.toFixed(2);
};

/**
 * Get exchange color gradient
 */
export const getExchangeColor = (_exchange: string): string => {
	return "from-amber-400 to-amber-600";
};

/**
 * Get exchange icon
 */
export const getExchangeIcon = (exchange: string): string | null => {
	const exchangeIconMap: Record<string, string> = {
		binance: BinanceIcon,
		bybit: BybitIcon,
		okx: OkxIcon,
		coinbase: CoinbaseIcon,
		htx: HtxIcon,
		kucoin: KucoinIcon,
		gate: GateIcon,
		bitget: BitgetIcon,
		upbit: UpbitIcon,
		bitstamp: BitstampIcon,
	};
	return exchangeIconMap[exchange] || null;
};

/**
 * Get currency icon
 */
export const getCurrencyIcon = (symbol: string): string | null => {
	const iconMap: Record<string, string> = {
		BTC: BTCIcon,
		ETH: ETHIcon,
		SOL: SOLIcon,
		TRX: TRXIcon,
		XRP: XRPIcon,
		BNB: BNBIcon,
		SQR: SQRIcon,
		JASMY: JASMYIcon,
	};
	return iconMap[symbol] || null;
};

