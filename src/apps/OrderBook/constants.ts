/**
 * Constants for OrderBook module
 */

// Import exchange and currency icons
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
import CryptocomIcon from "@/assets/icons/exchanges/CRYPTOCOM.png";
import BitfinexIcon from "@/assets/icons/exchanges/BITFINEX.png";
import KrakenIcon from "@/assets/icons/exchanges/KRAKEN.png";

import BTCIcon from "@/assets/icons/coins/BTC.png";
import ETHIcon from "@/assets/icons/coins/ETH.png";
import SOLIcon from "@/assets/icons/coins/SOL.png";
import TRXIcon from "@/assets/icons/coins/TRX.png";
import XRPIcon from "@/assets/icons/coins/XRP.png";
import BNBIcon from "@/assets/icons/coins/BNB.png";
import SQRIcon from "@/assets/icons/coins/SQR.png";
import JASMYIcon from "@/assets/icons/coins/JASMY.png";

/**
 * Exchange icon mapping
 */
export const EXCHANGE_ICONS: { [key: string]: string } = {
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
	cryptocom: CryptocomIcon,
	bitfinex: BitfinexIcon,
	kraken: KrakenIcon,
};

/**
 * Currency icon mapping
 */
export const CURRENCY_ICONS: { [key: string]: string } = {
	BTC: BTCIcon,
	ETH: ETHIcon,
	SOL: SOLIcon,
	TRX: TRXIcon,
	XRP: XRPIcon,
	BNB: BNBIcon,
	SQR: SQRIcon,
	JASMY: JASMYIcon,
};

