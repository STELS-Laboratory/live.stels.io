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
 * Protocol configuration (from genesis-smart-1.0.json)
 * 100% compatible with genesis-smart-1.0.json schema
 */
export interface ProtocolConfig {
  tx_version: string; // e.g., "smart-1.0"
  vm_version: string; // e.g., "intrinsics-1"
  canonicalization: "gls-det-1";
  encoding: "utf-8";
  canon_specs?: Record<string, Record<string, string | number | boolean | null>>;
  sign_domains: {
    tx: Array<string | number>; // Signing domain for transactions
    cosign: Array<string | number>; // Signing domain for cosignatures
    notary: Array<string | number>; // Signing domain for notary certificates
    genesis: Array<string | number>; // Signing domain for genesis documents
    crl: Array<string | number>; // Signing domain for certificate revocation lists
    token?: Array<string | number>; // Signing domain for tokens (backward compatibility)
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
 * Currency specification (from genesis-smart-1.0.json)
 */
export interface CurrencySpec {
  symbol: string; // Currency symbol
  decimals: number; // Decimal places (0-18)
  fee_unit: string; // Fee unit description
  name: string; // Currency name
}

/**
 * Network parameters (from genesis-smart-1.0.json)
 * 100% compatible with genesis-smart-1.0.json schema
 */
export interface NetworkParameters {
  fees: FeeConfig;
  currency: CurrencySpec;
  limits: {
    max_tx_size: number;
    max_signatures: number;
  };
  treasury_address: string;
  kv_limits: {
    value_max_bytes: number;
    raw_soft_cap_bytes: number;
    tx_raw_ttl_ms: number;
  };
  mempool: {
    max_pending_per_address: number;
    max_pending_bytes_per_address: number;
    reject_siblings_on_prev_hash: boolean;
    reject_duplicate_prev_hash: boolean;
    priority: string;
    ttl_ms: number;
  };
  gate: {
    ttl_ms: number;
    max_per_address: number;
    max_total: number;
    eviction: "lru";
    on_expire: "reject";
  };
}

/**
 * Security requirements (from genesis-smart-1.0.json)
 */
export interface SecurityRequirements {
  der_requirements: {
    lowS: boolean;
    canonical_DER: boolean;
  };
}

/**
 * Consensus configuration (from genesis-smart-1.0.json)
 */
export interface ConsensusConfig {
  type: "blockless-quorum";
  description: string;
  window_ms: number;
  max_skew_ms: number;
  time_source: {
    mode: "notary-median";
    fallback: "system-ntp";
    skew_enforcement_ms: number;
  };
  committee: {
    mode: "dynamic-stake-weighted";
    epoch_ms: number;
    committee_size: number;
    quorum_rule: {
      type: "fraction";
      num: number;
      den: number;
      round_up: boolean;
    };
    selection: {
      rng: "vrf";
      vrf_alg: "ed25519-vrf";
      seed_source: "prev_epoch_beacon";
      weight: "stake";
    };
    activation_delay_epochs: number;
    churn_limit: {
      enter_frac: number;
      exit_frac: number;
    };
  };
  notary_registry: {
    min_stake: string;
    bonding_ms: number;
    unbonding_ms: number;
    slash: {
      double_sign: string;
      surround_vote: string;
    };
    key_rotation: {
      min_interval_ms: number;
    };
  };
  finality_certificate: {
    hash_alg: "sha256";
    alg: Array<"bls12-381-agg" | "ecdsa-secp256k1-multi">;
    encoding: Record<string, Record<string, unknown>>;
  };
  notary_envelope: {
    schema_ref: string;
    sign_domain: Array<string | number>;
    equivocation_policy: {
      action: "ban";
      ban_ms: number;
    };
  };
}

/**
 * Intrinsics configuration (from genesis-smart-1.0.json)
 */
export interface IntrinsicsConfig {
  determinism: {
    profile: "pure-deterministic";
    io: {
      network: "denied";
      filesystem: "denied";
      clock: "logical-only";
    };
    state_access: string[];
  };
  registry: Array<{
    name: string;
    version: string;
    [key: string]: unknown;
  }>;
  dispatch: {
    resolver: "max-satisfying";
    policy: "prefer_latest_minor";
    semver: {
      allow: string[];
      deny: string[];
    };
    unknown_method: "reject";
  };
}

/**
 * Smart operations specification (from genesis-smart-1.0.json)
 */
export interface SmartOpsSpec {
  types: Array<{
    op: "assert.time" | "assert.balance" | "assert.compare" | "transfer" | "emit.event";
    schema: Record<string, unknown>;
    semantics: string;
  }>;
  limits: {
    max_ops: number;
    max_ops_bytes: number;
    max_event_data_bytes: number;
  };
}

/**
 * Transaction rules (from genesis-smart-1.0.json)
 */
export interface TransactionRules {
  tx_hash: string;
  signing_view_exclude: string[];
  time_window_ms: number;
  timestamp_rule: string;
  max_tx_size: number;
  min_fee: string;
  fees_currency: string;
  require_prev_hash: boolean;
  fee_policy_composition: string;
  fee_calculation: Record<string, unknown>;
  mempool_priority: Record<string, unknown>;
  raw_policy: {
    allowed: boolean;
    encoding: string[];
    max_raw_bytes: string;
    require_hash: boolean;
    bind_in_signature: boolean;
    mime_allowed: string[];
    pii_allowed: boolean;
    encryption: string[];
    tx_raw_ttl_ms: number;
  };
  methods_policy: {
    max_methods: number;
    max_methods_bytes: number;
    types: string[];
    cosign: {
      sig_encoding: string;
      kid_format: string;
      deadline_required: boolean;
      require_approver_address_match: boolean;
      rate_limit: {
        per_approver_per_minute: number;
      };
      action_fee: {
        enabled: boolean;
        amount: string;
        currency: string;
      };
      sign_domain: Array<string | number>;
    };
    binding: string;
  };
  signature_binding: string;
}

/**
 * Transaction schema (from genesis-smart-1.0.json)
 */
export interface TransactionSchema {
  smart: {
    $schema: string;
    $id: string;
    title: string;
    type: "object";
    required: string[];
    additionalProperties: boolean;
  };
}

/**
 * Schemas registry (from genesis-smart-1.0.json)
 */
export interface SchemasRegistry {
  notary_certificate_v2: {
    $schema: string;
    $id: string;
    type: "object";
    required: string[];
    additionalProperties: boolean;
  };
}

/**
 * State configuration (from genesis-smart-1.0.json)
 */
export interface StateConfig {
  accounts: Array<{
    address: string;
    balance: string;
    last_tx_hash?: string | null;
  }>;
  aliases: Record<string, string>;
  registries: {
    intrinsics: string[];
    genesis: string;
    notary: {
      registry_root: string;
      total_stake: string;
      epoch: number;
      committee_root: string;
    };
  };
}

/**
 * Monetary configuration (from genesis-smart-1.0.json)
 */
export interface MonetaryConfig {
  supply_cap: string | "testnet-unbounded" | "unbounded" | "unlimited";
  minting: "disabled" | "enabled";
  faucet: {
    rate_per_request: string;
    cooldown_ms: number;
  };
}

/**
 * Governance configuration (from genesis-smart-1.0.json)
 */
export interface GovernanceConfig {
  upgrade_envelope: {
    schema: {
      fields: string[];
    };
    sign_domain: Array<string | number>;
    threshold: {
      type: "k-of-n";
      k: number;
      n: number;
    };
  };
  revocation: {
    crl: {
      seq: number;
      revoked: string[];
    };
    sign_domain: Array<string | number>;
  };
  emergency_pause: {
    allowed: boolean;
    trigger_threshold: {
      k: number;
      n: number;
    };
    max_duration_ms: number;
  };
}

/**
 * Signing key (from genesis-smart-1.0.json)
 */
export interface SigningKey {
  kid: string;
  alg: "ecdsa-secp256k1";
  public_key: string; // Compressed secp256k1 (starts with 02 or 03)
  not_before: string; // ISO 8601
  not_after: string; // ISO 8601
  purpose: Array<"genesis-sign" | "upgrade-sign">;
}

/**
 * Signatures (from genesis-smart-1.0.json)
 */
export interface Signatures {
  threshold: {
    type: "k-of-n";
    k: number;
    n: number;
  };
  signers: Array<{
    kid: string;
    sig: string; // DER hex signature (starts with 30)
    alg: "ecdsa-secp256k1";
  }>;
}

/**
 * Genesis issuer (from genesis-smart-1.0.json)
 * Used in genesis.issuer field
 */
export interface GenesisIssuer {
  org: string; // Organization name
  contact: string; // Contact email (required)
}

/**
 * Upgrade policy (from genesis-smart-1.0.json)
 */
export interface UpgradePolicy {
  allowed: boolean;
  requires_threshold: {
    type: "k-of-n";
    k: number;
    n: number;
  };
  envelope_domain: Array<string | number>;
}

/**
 * Genesis data (from genesis-smart-1.0.json)
 * For tokens, this contains token-specific data adapted to genesis format
 */
export interface GenesisData {
  id: string; // genesis:sha256:<hash> or token:sha256:<hash>
  created_at: string; // ISO 8601 timestamp
  activation_time: string; // ISO 8601 timestamp
  previous_genesis_id: string | null | "genesis"; // null or "genesis" for first genesis
  issuer: GenesisIssuer;
  upgrade_policy: UpgradePolicy;
  // Token-specific fields (stored as custom data)
  token_data?: {
    standard: TokenStandard;
    metadata: TokenMetadata;
    economics: TokenEconomics;
    governance?: GovernanceSettings;
    transferRestrictions?: TransferRestrictions;
    customFields?: Record<string, unknown>;
  };
}

/**
 * Token data (user-defined token information)
 * Legacy interface for backward compatibility
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
 * Token genesis certificate (100% genesis-smart-1.0.json compliant)
 * This structure fully matches genesis-smart-1.0.json schema requirements
 * All required fields from the schema are included
 */
export interface TokenGenesisCertificate {
  // JSON Schema reference (required)
  $schema: "https://stels.io/schemas/genesis-smart-1.0.json";
  
  // Version (semantic versioning, required)
  version: string; // Pattern: ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$
  
  // Network configuration (required)
  network: NetworkConfig;
  
  // Genesis data (required) - contains token data adapted to genesis format
  genesis: GenesisData;
  
  // Content hash (required)
  content: {
    hash_alg: "sha256";
    hash: string; // sha256:<hash>
    size: number;
  };
  
  // Protocol configuration (required)
  protocol: ProtocolConfig;
  
  // Wallet protocol specification (required)
  wallet_protocol: WalletProtocol;
  
  // Addressing specification (required)
  addressing: AddressingSpec;
  
  // Consensus configuration (required)
  consensus: ConsensusConfig;
  
  // Intrinsics configuration (required)
  intrinsics: IntrinsicsConfig;
  
  // Smart operations specification (required)
  smart_ops_spec: SmartOpsSpec;
  
  // Network parameters (required)
  parameters: NetworkParameters;
  
  // Transaction rules (required)
  tx_rules: TransactionRules;
  
  // Transaction schema (required)
  tx_schema: TransactionSchema;
  
  // Schemas registry (required)
  schemas: SchemasRegistry;
  
  // State configuration (required)
  state: StateConfig;
  
  // Monetary configuration (required)
  monetary: MonetaryConfig;
  
  // Security requirements (required)
  security: SecurityRequirements;
  
  // Governance configuration (required)
  governance: GovernanceConfig;
  
  // Signing keys (required)
  signing_keys: SigningKey[];
  
  // Cryptographic signatures (required)
  signatures: Signatures;
  
  // Backward compatibility: token field (optional, for legacy support)
  token?: TokenData;
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
