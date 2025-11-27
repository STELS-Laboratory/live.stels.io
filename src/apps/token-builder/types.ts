/**
 * Token Builder Types
 * Type definitions for Web Token creation in STELS network
 */

/**
 * Token standard types supported by STELS network
 */
export type TokenStandard =
  | "fungible" // Standard fungible token (like ERC-20)
  | "non-fungible" // Non-fungible token (like ERC-721)
  | "semi-fungible" // Semi-fungible token (like ERC-1155)
  | "soulbound" // Non-transferable token
  | "wrapped" // Wrapped asset token
  | "governance" // Governance token with voting rights
  | "utility" // Utility token for services
  | "security" // Security token (regulated)
  | "custom"; // Custom token with arbitrary schema

/**
 * Token metadata standard
 */
export type MetadataStandard = "json" | "ipfs" | "arweave" | "custom";

/**
 * Token minting policy
 */
export type MintingPolicy =
  | "fixed" // Fixed supply, no minting after genesis
  | "mintable" // Can mint new tokens
  | "burnable" // Can burn tokens
  | "mintable-burnable"; // Both minting and burning allowed

/**
 * Token transfer restrictions
 */
export interface TransferRestrictions {
  enabled: boolean;
  whitelist?: string[]; // Addresses allowed to transfer
  blacklist?: string[]; // Addresses restricted from transfers
  timelock?: number; // Timelock in milliseconds
  maxAmount?: string; // Max amount per transfer
}

/**
 * Token governance settings
 */
export interface GovernanceSettings {
  enabled: boolean;
  votingPower?: "balance" | "staked" | "quadratic" | "custom";
  proposalThreshold?: string; // Min tokens to create proposal
  quorumThreshold?: string; // Min votes for valid proposal
  votingPeriod?: number; // Voting period in milliseconds
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  decimals?: number;
  icon?: string; // Data URL (base64), URL, or IPFS hash - max 128KB
  contact?: string; // Contact email for token issuer (optional, included in genesis certificate)
  website?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  tags?: string[];
}

/**
 * Token supply configuration
 */
export interface SupplyConfig {
  initial: string; // Initial supply
  max?: string; // Maximum supply (if capped)
  mintingPolicy: MintingPolicy;
  burnRate?: string; // Burn rate percentage (if applicable)
}

/**
 * Token economics
 */
export interface TokenEconomics {
  supply: SupplyConfig;
  distribution?: Array<{
    address: string;
    amount: string;
    vesting?: {
      cliff: number; // Cliff period in ms
      duration: number; // Total vesting duration in ms
      release: "linear" | "step"; // Release schedule
    };
  }>;
  treasury?: string; // Treasury address
  feeStructure?: {
    transfer?: string; // Transfer fee percentage
    mint?: string; // Minting fee
    burn?: string; // Burning fee
  };
}

/**
 * Token schema (JSON Schema compatible)
 */
export interface TokenSchema {
  $schema?: string;
  version: string;
  standard: TokenStandard;
  metadata: TokenMetadata;
  economics: TokenEconomics;
  transferRestrictions?: TransferRestrictions;
  governance?: GovernanceSettings;
  customFields?: Record<string, unknown>;
  technical?: {
    networkId?: string; // Network ID (testnet, mainnet, localnet)
    network: string;
    chainId: number;
    protocol: string;
    encoding?: string;
    hashAlgorithm?: string;
  };
}

/**
 * Network configuration (from genesis.json)
 */
export interface NetworkConfig {
  id: string; // "testnet" | "mainnet" | "localnet"
  name: string; // Network name
  environment: "runtime" | "production" | "development" | "test";
  chain_id: number; // 1 for mainnet, 2 for testnet, 3 for localnet
}

/**
 * Protocol configuration (from genesis.json)
 */
export interface ProtocolConfig {
  tx_version: string; // e.g., "smart-1.0"
  vm_version: string; // e.g., "intrinsics-1"
  canonicalization: "gls-det-1";
  encoding: "utf-8";
  sign_domains: {
    token: string[]; // Sign domain for tokens
  };
}

/**
 * Wallet protocol specification (from genesis.json)
 */
export interface WalletProtocol {
  name: "gliesereum-core";
  version: "1.0";
  sign_alg: "ecdsa-secp256k1";
  hash_alg: "sha256";
  sig_encoding: "der-hex(lowS,canonical)";
  ecdsa_nonce: "rfc6979";
  message_canon: "gls-det-1";
  pubkey_format: "secp256k1-compressed-hex";
}

/**
 * Addressing specification (from genesis.json)
 */
export interface AddressingSpec {
  version_byte: 98;
  pubkey_format: "secp256k1-compressed-hex";
  address_encoding: ["base58"];
  preferred_encoding: "base58";
  payload: string; // Algorithm description
  checksum: string; // Checksum algorithm
}

/**
 * Fee configuration (from genesis.json parameters)
 */
export interface FeeConfig {
  base: string; // Base fee
  per_byte: string; // Per-byte fee
  raw_per_byte: string; // Raw data per-byte fee
  currency: string; // Fee currency (e.g., "TST")
}

/**
 * Currency specification (from genesis.json parameters)
 */
export interface CurrencySpec {
  symbol: string; // Currency symbol
  decimals: number; // Decimal places
  fee_unit: string; // Fee unit description
}

/**
 * Network parameters (from genesis.json)
 */
export interface NetworkParameters {
  fees: FeeConfig;
  currency: CurrencySpec;
  limits: {
    max_tx_size: number;
    max_signatures: number;
  };
  treasury_address: string;
}

/**
 * Security requirements (from genesis.json)
 */
export interface SecurityRequirements {
  der_requirements: {
    lowS: boolean;
    canonical_DER: boolean;
  };
}

/**
 * Token data (user-defined token information)
 */
export interface TokenData {
  id: string; // token:sha256:<hash>
  created_at: string; // ISO 8601 timestamp
  activation_time: string; // ISO 8601 timestamp
  issuer: {
    address: string; // Base58 address
    public_key: string; // UNCOMPRESSED hex public key (130 chars, starts with "04")
    org?: string; // Organization name
    contact?: string; // Contact email
  };
  standard: TokenStandard;
  metadata: TokenMetadata;
  economics: TokenEconomics;
  governance?: GovernanceSettings;
  transferRestrictions?: TransferRestrictions;
  customFields?: Record<string, unknown>;
}

/**
 * Token genesis certificate (FULL genesis.json-compliant structure)
 * This structure matches network consensus requirements
 */
export interface TokenGenesisCertificate {
  // JSON Schema reference
  $schema: string;
  
  // Version (semantic versioning)
  version: string;
  
  // Network configuration (from genesis.json)
  network: NetworkConfig;
  
  // Protocol configuration (from genesis.json)
  protocol: ProtocolConfig;
  
  // Wallet protocol specification (from genesis.json)
  wallet_protocol: WalletProtocol;
  
  // Addressing specification (from genesis.json)
  addressing: AddressingSpec;
  
  // Token-specific data
  token: TokenData;
  
  // Content hash (for integrity verification)
  content: {
    hash_alg: "sha256";
    hash: string; // sha256:<hash>
    size: number; // Content size in bytes
  };
  
  // Network parameters (from genesis.json)
  parameters: NetworkParameters;
  
  // Security requirements (from genesis.json)
  security: SecurityRequirements;
  
  // Cryptographic signatures
  signatures: {
    threshold?: {
      type: "single" | "k-of-n";
      k?: number;
      n?: number;
    };
    signers: Array<{
      kid: string; // UNCOMPRESSED hex public key (130 chars, starts with "04")
      alg: "ecdsa-secp256k1";
      sig: string; // DER hex signature
    }>;
  };
}

/**
 * Wizard step state
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  valid: boolean;
}

/**
 * Token builder state
 */
export interface TokenBuilderState {
  currentStep: number;
  steps: WizardStep[];
  schema: Partial<TokenSchema>;
  certificate?: TokenGenesisCertificate;
  certificateHistory: TokenGenesisCertificate[]; // History of created certificates
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Token template
 */
export interface TokenTemplate {
  id: string;
  name: string;
  description: string;
  standard: TokenStandard;
  icon?: string;
  schema: Partial<TokenSchema>;
  popular?: boolean;
}

/**
 * Export formats
 */
export type ExportFormat = "json" | "yaml" | "toml" | "typescript";

/**
 * Token builder actions
 */
export interface TokenBuilderActions {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateSchema: (schema: Partial<TokenSchema>) => void;
  updateMetadata: (metadata: Partial<TokenMetadata>) => void;
  updateEconomics: (economics: Partial<TokenEconomics>) => void;
  updateGovernance: (governance: Partial<GovernanceSettings>) => void;
  validateSchema: () => ValidationError[];
  signSchema: (privateKey: string) => Promise<TokenGenesisCertificate>;
  resetBuilder: () => void;
  loadTemplate: (template: TokenTemplate) => void;
  exportSchema: (format: ExportFormat) => string;
}

/**
 * Combined store type
 */
export type TokenBuilderStore = TokenBuilderState & TokenBuilderActions;
