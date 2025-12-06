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
  ConsensusConfig,
  IntrinsicsConfig,
  SmartOpsSpec,
  TransactionRules,
  TransactionSchema,
  SchemasRegistry,
  StateConfig,
  MonetaryConfig,
  GovernanceConfig,
  UpgradePolicy,
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
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const PROTOCOL_CONFIG: ProtocolConfig = {
  tx_version: "smart-1.0",
  vm_version: "intrinsics-1",
  canonicalization: "gls-det-1",
  encoding: "utf-8",
  canon_specs: {},
  sign_domains: {
    tx: ["STELS-TX", "2", "v1", "chain:2"],
    cosign: ["STELS-COSIGN", "2", "v1", "chain:2"],
    notary: ["STELS-NOTARY", "2", "v1", "chain:2"],
    genesis: ["STELS-GENESIS", "2", "v1", "chain:2"],
    crl: ["STELS-CRL", "2", "v1", "chain:2"],
    token: ["STELS-TOKEN-GENESIS", "2", "v1", "chain:2"], // Backward compatibility
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
 * 
 * ⚠️ IMPORTANT: These are NETWORK fees, NOT token fees!
 * - Network fees are paid in TST (system currency)
 * - Network fees go to system treasury (gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo)
 * - These fees apply to ALL transactions in the network
 * 
 * Token-specific fees are defined in token.economics.feeStructure:
 * - Token fees are paid in the token itself
 * - Token fees go to token's treasury (token.economics.treasury)
 * - These fees apply only to this specific token's operations
 */
export const NETWORK_PARAMETERS: NetworkParameters = {
  fees: {
    base: "0.00005",           // Base network fee in TST
    per_byte: "0.0000001",     // Per-byte network fee in TST
    raw_per_byte: "0.0000003", // Raw data per-byte fee in TST
    currency: "TST",           // System currency (not user token!)
  },
  currency: {
    symbol: "TST",             // System currency symbol
    decimals: 6,
    fee_unit: "10^-6 TST",
    name: "STELS Test Token",
  },
  limits: {
    max_tx_size: 65536,        // Maximum transaction size in bytes
    max_signatures: 8,         // Maximum number of signatures per transaction
  },
  treasury_address: "gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo", // System treasury (receives network fees)
  kv_limits: {
    value_max_bytes: 1024 * 1024, // 1MB
    raw_soft_cap_bytes: 512 * 1024, // 512KB
    tx_raw_ttl_ms: 3600000, // 1 hour
  },
  mempool: {
    max_pending_per_address: 100,
    max_pending_bytes_per_address: 1024 * 1024, // 1MB
    reject_siblings_on_prev_hash: true,
    reject_duplicate_prev_hash: true,
    priority: "fee",
    ttl_ms: 3600000, // 1 hour
  },
  gate: {
    ttl_ms: 300000, // 5 minutes
    max_per_address: 10,
    max_total: 1000,
    eviction: "lru",
    on_expire: "reject",
  },
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
 * Updated to use genesis-smart-1.0.json for 100% compatibility
 */
export const TOKEN_SCHEMA_URL = "https://stels.io/schemas/genesis-smart-1.0.json";

/**
 * Default upgrade policy for tokens
 * Tokens use single-signer upgrade policy by default
 */
export const DEFAULT_UPGRADE_POLICY: UpgradePolicy = {
  allowed: false, // Tokens cannot be upgraded
  requires_threshold: {
    type: "k-of-n",
    k: 1,
    n: 1,
  },
  envelope_domain: ["STELS-TOKEN-UPGRADE", "2", "v1", "chain:2"],
};

/**
 * Consensus configuration (default for testnet)
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const CONSENSUS_CONFIG: ConsensusConfig = {
  type: "blockless-quorum",
  description: "STELS Test Network Consensus",
  window_ms: 5000,
  max_skew_ms: 1000,
  time_source: {
    mode: "notary-median",
    fallback: "system-ntp",
    skew_enforcement_ms: 2000,
  },
  committee: {
    mode: "dynamic-stake-weighted",
    epoch_ms: 86400000, // 24 hours
    committee_size: 5,
    quorum_rule: {
      type: "fraction",
      num: 2,
      den: 3,
      round_up: true,
    },
    selection: {
      rng: "vrf",
      vrf_alg: "ed25519-vrf",
      seed_source: "prev_epoch_beacon",
      weight: "stake",
    },
    activation_delay_epochs: 1,
    churn_limit: {
      enter_frac: 0.1,
      exit_frac: 0.1,
    },
  },
  notary_registry: {
    min_stake: "1000000",
    bonding_ms: 86400000, // 24 hours
    unbonding_ms: 172800000, // 48 hours
    slash: {
      double_sign: "0.1",
      surround_vote: "0.05",
    },
    key_rotation: {
      min_interval_ms: 86400000, // 24 hours
    },
  },
  finality_certificate: {
    hash_alg: "sha256",
    alg: ["ecdsa-secp256k1-multi"],
    encoding: {},
  },
  notary_envelope: {
    schema_ref: "https://stels.io/schemas/notary-certificate-v2.json",
    sign_domain: ["STELS-NOTARY-ENVELOPE", "2", "v1", "chain:2"],
    equivocation_policy: {
      action: "ban",
      ban_ms: 86400000, // 24 hours
    },
  },
};

/**
 * Intrinsics configuration
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const INTRINSICS_CONFIG: IntrinsicsConfig = {
  determinism: {
    profile: "pure-deterministic",
    io: {
      network: "denied",
      filesystem: "denied",
      clock: "logical-only",
    },
    state_access: ["accounts", "aliases", "registries"],
  },
  registry: [
    {
      name: "intrinsics",
      version: "1.0",
    },
  ],
  dispatch: {
    resolver: "max-satisfying",
    policy: "prefer_latest_minor",
    semver: {
      allow: ["^1.0.0"],
      deny: [],
    },
    unknown_method: "reject",
  },
};

/**
 * Smart operations specification
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const SMART_OPS_SPEC: SmartOpsSpec = {
  types: [
    {
      op: "assert.time",
      schema: {},
      semantics: "Assert current time is within specified range",
    },
    {
      op: "assert.balance",
      schema: {},
      semantics: "Assert account balance meets condition",
    },
    {
      op: "assert.compare",
      schema: {},
      semantics: "Assert comparison between values",
    },
    {
      op: "transfer",
      schema: {},
      semantics: "Transfer tokens between accounts",
    },
    {
      op: "emit.event",
      schema: {},
      semantics: "Emit event for external systems",
    },
  ],
  limits: {
    max_ops: 100,
    max_ops_bytes: 65536,
    max_event_data_bytes: 4096,
  },
};

/**
 * Transaction rules
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const TRANSACTION_RULES: TransactionRules = {
  tx_hash: "sha256",
  signing_view_exclude: ["signatures"],
  time_window_ms: 300000, // 5 minutes
  timestamp_rule: "notary-median",
  max_tx_size: 65536,
  min_fee: "0.00005",
  fees_currency: "TST",
  require_prev_hash: true,
  fee_policy_composition: "sum",
  fee_calculation: {
    base: "parameters.fees.base",
    per_byte: "parameters.fees.per_byte",
  },
  mempool_priority: {
    fee: "desc",
    timestamp: "asc",
  },
  raw_policy: {
    allowed: true,
    encoding: ["utf-8", "base64"],
    max_raw_bytes: "min(parameters.kv_limits.raw_soft_cap_bytes, tx_free_space)",
    require_hash: true,
    bind_in_signature: true,
    mime_allowed: ["application/json", "text/plain"],
    pii_allowed: false,
    encryption: [],
    tx_raw_ttl_ms: 3600000,
  },
  methods_policy: {
    max_methods: 10,
    max_methods_bytes: 32768,
    types: ["intrinsics", "smart"],
    cosign: {
      sig_encoding: "der-hex(lowS,canonical)",
      kid_format: "secp256k1-compressed-hex",
      deadline_required: true,
      require_approver_address_match: true,
      rate_limit: {
        per_approver_per_minute: 10,
      },
      action_fee: {
        enabled: false,
        amount: "0.00001",
        currency: "TST",
      },
      sign_domain: ["STELS-COSIGN", "2", "v1", "chain:2"],
    },
    binding: "signature",
  },
  signature_binding: "strict",
};

/**
 * Transaction schema
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const TRANSACTION_SCHEMA: TransactionSchema = {
  smart: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://stels.io/schemas/tx-smart-1.0.json",
    title: "STELS Smart Transaction v1.0",
    type: "object",
    required: ["version", "timestamp", "methods", "fee"],
    additionalProperties: false,
  },
};

/**
 * Schemas registry
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const SCHEMAS_REGISTRY: SchemasRegistry = {
  notary_certificate_v2: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://stels.io/schemas/notary-certificate-v2.json",
    type: "object",
    required: ["id", "notary", "timestamp", "signatures"],
    additionalProperties: false,
  },
};

/**
 * Default state configuration
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const DEFAULT_STATE_CONFIG: StateConfig = {
  accounts: [],
  aliases: {},
  registries: {
    intrinsics: ["intrinsics@1.0"],
    genesis: "genesis:sha256:0000000000000000000000000000000000000000000000000000000000000000",
    notary: {
      registry_root: "0000000000000000000000000000000000000000000000000000000000000000",
      total_stake: "0",
      epoch: 0,
      committee_root: "0000000000000000000000000000000000000000000000000000000000000000",
    },
  },
};

/**
 * Monetary configuration
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const MONETARY_CONFIG: MonetaryConfig = {
  supply_cap: "testnet-unbounded",
  minting: "enabled",
  faucet: {
    rate_per_request: "1000000",
    cooldown_ms: 3600000, // 1 hour
  },
};

/**
 * Governance configuration
 * 100% compatible with genesis-smart-1.0.json schema
 */
export const GOVERNANCE_CONFIG: GovernanceConfig = {
  upgrade_envelope: {
    schema: {
      fields: ["version", "network", "protocol"],
    },
    sign_domain: ["STELS-UPGRADE", "2", "v1", "chain:2"],
    threshold: {
      type: "k-of-n",
      k: 3,
      n: 5,
    },
  },
  revocation: {
    crl: {
      seq: 0,
      revoked: [],
    },
    sign_domain: ["STELS-CRL", "2", "v1", "chain:2"],
  },
  emergency_pause: {
    allowed: true,
    trigger_threshold: {
      k: 3,
      n: 5,
    },
    max_duration_ms: 86400000, // 24 hours
  },
};
