export type {
  ListAccountsOptions,
  SetAccountPayload,
} from "@/lib/api-types";
export type { StoredAccount } from "@/types/stores/types";

export const EXCHANGE_OPTIONS = [
  { value: "binance", label: "Binance" },
  { value: "binanceus", label: "Binance US" },
  { value: "binanceusdm", label: "Binance USD-M" },
  { value: "binancecoinm", label: "Binance COIN-M" },
  { value: "bybit", label: "Bybit" },
  { value: "okx", label: "OKX" },
  { value: "gate", label: "Gate" },
  { value: "gateio", label: "Gate.io" },
  { value: "kucoin", label: "KuCoin" },
  { value: "bitget", label: "Bitget" },
  { value: "huobi", label: "Huobi" },
  { value: "htx", label: "HTX" },
  { value: "mexc", label: "MEXC" },
  { value: "kraken", label: "Kraken" },
  { value: "coinbase", label: "Coinbase" },
  { value: "coinbasepro", label: "Coinbase Pro" },
] as const;

const EXCHANGE_TO_ICON: Record<string, string> = {
  binance: "BINANCE",
  binanceus: "BINANCE",
  binanceusdm: "BINANCE",
  binancecoinm: "BINANCE",
  bybit: "BYBIT",
  okx: "OKX",
  gate: "GATE",
  gateio: "GATE",
  kucoin: "KUCOIN",
  bitget: "BITGET",
  huobi: "HTX",
  htx: "HTX",
  mexc: "GATE",
  kraken: "KRAKEN",
  coinbase: "COINBASE",
  coinbasepro: "COINBASE",
};

export function getExchangeIconPath(exchange: string): string {
  const name = EXCHANGE_TO_ICON[exchange] ?? "GATE";
  return `/assets/icons/exchanges/${name}.png`;
}
