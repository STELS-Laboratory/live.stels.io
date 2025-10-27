/**
 * Token Builder Constants
 * Network configurations and defaults
 * Based on genesis.json structure example
 */

import type {
  NetworkConfig,
  ProtocolConfig,
  WalletProtocol,
  AddressingSpec,
  NetworkParameters,
  SecurityRequirements,
} from "./types";

/**
 * Available network configurations
 */
export const AVAILABLE_NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    id: "testnet",
    name: "STELS Test Network",
    environment: "runtime",
    chain_id: 2,
  },
  mainnet: {
    id: "mainnet",
    name: "STELS Main Network",
    environment: "production",
    chain_id: 1,
  },
  localnet: {
    id: "localnet",
    name: "STELS Local Network",
    environment: "development",
    chain_id: 3,
  },
};

/**
 * Default network (testnet)
 */
export const NETWORK_CONFIG: NetworkConfig = AVAILABLE_NETWORKS.testnet;

/**
 * Protocol configuration for STELS Test Network
 * Based on genesis.json example structure
 */
export const PROTOCOL_CONFIG: ProtocolConfig = {
  tx_version: "smart-1.0",
  vm_version: "intrinsics-1",
  canonicalization: "gls-det-1",
  encoding: "utf-8",
  sign_domains: {
    token: ["STELS-TOKEN-GENESIS", "2", "v1", "chain:2"],
  },
};

/**
 * Wallet protocol specification
 * Based on genesis.json example structure
 */
export const WALLET_PROTOCOL: WalletProtocol = {
  name: "gliesereum-core",
  version: "1.0",
  sign_alg: "ecdsa-secp256k1",
  hash_alg: "sha256",
  sig_encoding: "der-hex(lowS,canonical)",
  ecdsa_nonce: "rfc6979",
  message_canon: "gls-det-1",
  pubkey_format: "secp256k1-compressed-hex",
};

/**
 * Addressing specification
 * Based on genesis.json example structure
 */
export const ADDRESSING_SPEC: AddressingSpec = {
  version_byte: 98,
  pubkey_format: "secp256k1-compressed-hex",
  address_encoding: ["base58"],
  preferred_encoding: "base58",
  payload: "version_byte || RIPEMD160(SHA256(pubkey_compressed))",
  checksum: "SHA256(version_byte||h160)[0..4]",
};

/**
 * Network parameters (fees, currency, limits)
 * Based on genesis.json example structure
 */
export const NETWORK_PARAMETERS: NetworkParameters = {
  fees: {
    base: "0.00005",
    per_byte: "0.0000001",
    raw_per_byte: "0.0000003",
    currency: "TST",
  },
  currency: {
    symbol: "TST",
    decimals: 6,
    fee_unit: "10^-6 TST",
  },
  limits: {
    max_tx_size: 65536,
    max_signatures: 8,
  },
  treasury_address: "gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo",
};

/**
 * Security requirements
 * Based on genesis.json example structure
 */
export const SECURITY_REQUIREMENTS: SecurityRequirements = {
  der_requirements: {
    lowS: true,
    canonical_DER: true,
  },
};

/**
 * Token sign domain array
 * Based on genesis.json protocol.sign_domains.token
 */
export const TOKEN_SIGN_DOMAIN: string[] = [
  "STELS-TOKEN-GENESIS",
  "2",
  "v1",
  "chain:2",
];

/**
 * Activation delay in milliseconds (60 seconds)
 * Time between token creation and activation
 */
export const ACTIVATION_DELAY_MS = 60000;

/**
 * Default token version
 */
export const DEFAULT_TOKEN_VERSION = "1.0.0";

/**
 * Token schema URL
 */
export const TOKEN_SCHEMA_URL = "https://stels.io/schemas/token-genesis-1.0.json";

