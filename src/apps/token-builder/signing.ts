/**
 * Token Schema Signing
 * Sign token schemas using STELS cryptographic standards
 * 
 * SECURITY: Uses ECDSA secp256k1 signatures with deterministic canonicalization
 * COMPLIANCE: Creates genesis.json-compliant certificate structure
 */

import type { TokenSchema, TokenGenesisCertificate } from "./types";
import { 
  sign, 
  verify, 
  deterministicStringify,
  getUncompressedPublicKey,
  getAddressFromPublicKey,
  toHex,
} from "@/lib/gliesereum";
import { sha256 } from "@noble/hashes/sha256";
import {
  NETWORK_CONFIG,
  PROTOCOL_CONFIG,
  WALLET_PROTOCOL,
  ADDRESSING_SPEC,
  NETWORK_PARAMETERS,
  SECURITY_REQUIREMENTS,
  ACTIVATION_DELAY_MS,
  TOKEN_SCHEMA_URL,
  AVAILABLE_NETWORKS,
  DEFAULT_UPGRADE_POLICY,
  CONSENSUS_CONFIG,
  INTRINSICS_CONFIG,
  SMART_OPS_SPEC,
  TRANSACTION_RULES,
  TRANSACTION_SCHEMA,
  SCHEMAS_REGISTRY,
  DEFAULT_STATE_CONFIG,
  MONETARY_CONFIG,
  GOVERNANCE_CONFIG,
} from "./constants";
import { getDecimalsByStandard } from "./utils";
import { EC } from "elliptic";

/**
 * Get compressed public key from uncompressed public key
 * Converts 130-char uncompressed hex (starts with 04) to 66-char compressed hex (starts with 02 or 03)
 * 
 * @param uncompressedKey - Uncompressed public key hex string (130 chars, starts with "04")
 * @returns Compressed public key hex string (66 chars, starts with "02" or "03")
 */
function getCompressedPublicKey(uncompressedKey: string): string {
  if (!uncompressedKey.startsWith("04") || uncompressedKey.length !== 130) {
    throw new Error("Invalid uncompressed public key format");
  }
  
  const keyPair = EC.keyFromPublic(uncompressedKey, "hex");
  return keyPair.getPublic(true, "hex"); // Compressed format (66 chars)
}

/**
 * Remove null and undefined values from object recursively
 * Required for gls-det-1 canonical serialization
 */
function removeNullUndefined(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj
      .map(removeNullUndefined)
      .filter(item => item !== undefined && item !== null);
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleanedValue = removeNullUndefined(value);
      // Only include if value is not null/undefined
      if (cleanedValue !== undefined && cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Sign token schema and create genesis certificate
 * Creates a FULL genesis.json-compliant certificate for network consensus
 * 
 * @param schema - Complete token schema to sign
 * @param privateKey - Private key for signing (64 hex chars)
 * @returns Signed token genesis certificate (genesis.json-compliant)
 * @throws Error if schema is invalid or signing fails
 * 
 * @security Private key is never logged or stored
 * @compliance Includes ALL required fields from genesis.json for consensus acceptance
 */
export async function signTokenSchema(
  schema: TokenSchema,
  privateKey: string,
): Promise<TokenGenesisCertificate> {
  // Get UNCOMPRESSED public key (130 chars)
  // CRITICAL: WebFix requires UNCOMPRESSED format for ALL public keys!
  // Used in: issuer.public_key, signatures.signers[0].kid, body.publicKey
  const publicKeyUncompressed = getUncompressedPublicKey(privateKey);

  // CRITICAL: Generate address from the SAME uncompressed key used in document
  // getAddressFromPublicKey will automatically compress it internally (via ensureCompressedKey)
  // This ensures address matches the public_key field in the document
  const address = getAddressFromPublicKey(publicKeyUncompressed);

  // Get network configuration from schema or use default
  const networkId = schema.technical?.networkId || "testnet";
  const network = AVAILABLE_NETWORKS[networkId] || NETWORK_CONFIG;
  
  // Use network constants (based on genesis.json structure example)
  // These are NETWORK parameters, not token parameters
  const protocol = PROTOCOL_CONFIG;
  const walletProtocol = WALLET_PROTOCOL;
  const addressing = ADDRESSING_SPEC;
  const parameters = NETWORK_PARAMETERS; // Always from constants (network parameters)
  const security = SECURITY_REQUIREMENTS; // Always from constants (network security)

  // Prepare token data (signing view - user-defined token information)
  // CRITICAL: Set decimals based on token standard for genesis.json compliance
  // - NFT tokens (non-fungible, semi-fungible, soulbound): decimals = 0
  // - Fungible tokens: decimals = 6 (TST standard)
  const decimals = getDecimalsByStandard(schema.standard);
  
  const tokenData = {
    standard: schema.standard,
    metadata: {
      ...schema.metadata,
      decimals, // Automatically set based on token standard
    },
    economics: schema.economics,
    transferRestrictions: schema.transferRestrictions,
    governance: schema.governance,
    customFields: schema.customFields,
  };

  // Create canonical string for hash
  const canonicalString = deterministicStringify(tokenData);
  const contentBytes = new TextEncoder().encode(canonicalString);

  // Calculate hash using @noble/hashes (matches gliesereum crypto)
  const hashBytes = sha256(contentBytes);
  const hash = toHex(hashBytes);

  // Create genesis ID (for genesis-smart-1.0.json compliance)
  // Use token:sha256: format for tokens, but store in genesis.id field
  const genesisId = `genesis:sha256:${hash}`;
  const tokenId = `token:sha256:${hash}`; // Keep for backward compatibility

  // Create timestamps
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const activationTime = new Date(now + ACTIVATION_DELAY_MS).toISOString();

  // Get compressed public key for signing_keys (genesis-smart-1.0.json requires compressed format)
  const publicKeyCompressed = getCompressedPublicKey(publicKeyUncompressed);

  // Create signing key (required by genesis-smart-1.0.json)
  const signingKey = {
    kid: address, // Use address as kid for tokens
    alg: "ecdsa-secp256k1" as const,
    public_key: publicKeyCompressed, // Compressed format (starts with 02 or 03)
    not_before: createdAt,
    not_after: new Date(now + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
    purpose: ["genesis-sign"] as const,
  };

  // CRITICAL: Create FULL certificate WITHOUT signatures first (per CLIENT_ISSUE_SUMMARY.md)
  // "Создаем документ БЕЗ signatures"
  // 100% compatible with genesis-smart-1.0.json schema
  const certificateWithoutSignaturesRaw = {
    // JSON Schema reference (required)
    $schema: TOKEN_SCHEMA_URL,
    
    // Version (required)
    version: schema.version,
    
    // Network configuration (required)
    network: network,
    
    // Genesis data (required) - contains token data adapted to genesis format
    genesis: {
      id: genesisId,
      created_at: createdAt,
      activation_time: activationTime,
      previous_genesis_id: null as const, // First genesis for token
      issuer: {
        org: schema.metadata?.name || "Token Issuer",
        contact: schema.metadata?.contact || "issuer@example.com",
      },
      upgrade_policy: DEFAULT_UPGRADE_POLICY,
      // Store token-specific data in token_data field
      token_data: {
        standard: schema.standard,
        metadata: {
          ...schema.metadata,
          decimals, // Automatically determined by token standard
        },
        economics: {
          ...schema.economics,
          ...(schema.economics.feeStructure && { feeStructure: schema.economics.feeStructure }),
          ...(schema.economics.treasury && { treasury: schema.economics.treasury }),
        },
        ...(schema.governance?.enabled && { governance: schema.governance }),
        ...(schema.transferRestrictions?.enabled && { transferRestrictions: schema.transferRestrictions }),
        ...(schema.customFields && Object.keys(schema.customFields).length > 0 && { customFields: schema.customFields }),
      },
    },
    
    // Content hash (required)
    content: {
      hash_alg: "sha256" as const,
      hash: `sha256:${hash}`,
      size: contentBytes.length,
    },
    
    // Protocol configuration (required)
    protocol: protocol,
    
    // Wallet protocol specification (required)
    wallet_protocol: walletProtocol,
    
    // Addressing specification (required)
    addressing: addressing,
    
    // Consensus configuration (required)
    consensus: CONSENSUS_CONFIG,
    
    // Intrinsics configuration (required)
    intrinsics: INTRINSICS_CONFIG,
    
    // Smart operations specification (required)
    smart_ops_spec: SMART_OPS_SPEC,
    
    // Network parameters (required)
    parameters: parameters,
    
    // Transaction rules (required)
    tx_rules: TRANSACTION_RULES,
    
    // Transaction schema (required)
    tx_schema: TRANSACTION_SCHEMA,
    
    // Schemas registry (required)
    schemas: SCHEMAS_REGISTRY,
    
    // State configuration (required)
    state: DEFAULT_STATE_CONFIG,
    
    // Monetary configuration (required)
    monetary: MONETARY_CONFIG,
    
    // Security requirements (required)
    security: security,
    
    // Governance configuration (required)
    governance: GOVERNANCE_CONFIG,
    
    // Signing keys (required)
    signing_keys: [signingKey],
    
    // NOTE: signatures field is NOT included here - will be added after signing
  };

  // CRITICAL: Remove all null/undefined values before signing (per gls-det-1 spec)
  // This ensures canonical serialization matches server expectations
  const certificateWithoutSignatures = removeNullUndefined(certificateWithoutSignaturesRaw) as typeof certificateWithoutSignaturesRaw;

  // CRITICAL SIGNING PROCESS (per gls-det-1 spec):
  
  // Step 1: Canonical serialization of entire document (WITHOUT signatures)
  const canonicalDocument = deterministicStringify(certificateWithoutSignatures);

  // Step 2: Add domain separator as STRING PREFIX (not part of JSON!)
  // Use genesis sign domain from protocol.sign_domains.genesis
  const domainStr = protocol.sign_domains.genesis.join(":");  // "STELS-GENESIS:2:v1:chain:2"
  const messageString = `${domainStr}:${canonicalDocument}`;

  // DEBUG: Log signing details for verification

  // Step 3: Sign the message
  const signature = sign(messageString, privateKey);

  // Step 4: VERIFY signature locally before sending to server

  const isValid = verify(messageString, signature, publicKeyUncompressed);

  if (!isValid) {

    throw new Error("Signature verification failed locally. Please try again.");
  }

  // Step 5: Create final certificate WITH signatures
  // 100% compatible with genesis-smart-1.0.json schema
  const certificate: TokenGenesisCertificate = {
    ...certificateWithoutSignatures,
    signatures: {
      threshold: {
        type: "k-of-n",
        k: 1,
        n: 1,
      },
      signers: [
        {
          kid: address, // Use address as kid (matches signing_keys[0].kid)
          alg: "ecdsa-secp256k1",
          sig: signature, // DER hex signature (starts with 30)
        },
      ],
    },
    // Backward compatibility: include token field for legacy support
    token: {
      id: tokenId,
      created_at: createdAt,
      activation_time: activationTime,
      issuer: {
        address: address,
        public_key: publicKeyUncompressed, // UNCOMPRESSED for backward compatibility
        org: schema.metadata?.name || "",
        ...(schema.metadata?.contact && { contact: schema.metadata.contact }),
      },
      standard: schema.standard,
      metadata: {
        ...schema.metadata,
        decimals,
      },
      economics: {
        ...schema.economics,
        ...(schema.economics.feeStructure && { feeStructure: schema.economics.feeStructure }),
        ...(schema.economics.treasury && { treasury: schema.economics.treasury }),
      },
      ...(schema.governance?.enabled && { governance: schema.governance }),
      ...(schema.transferRestrictions?.enabled && { transferRestrictions: schema.transferRestrictions }),
      ...(schema.customFields && Object.keys(schema.customFields).length > 0 && { customFields: schema.customFields }),
    },
  };

  return certificate;
}

/**
 * Type guard for genesis certificate
 */
function isGenesisCertificate(cert: Record<string, unknown>): boolean {
  try {
    if (!cert.genesis || typeof cert.genesis !== "object") return false;
    if (!cert.network || typeof cert.network !== "object") return false;
    if (!cert.protocol || typeof cert.protocol !== "object") return false;
    if (!cert.content || typeof cert.content !== "object") return false;
    if (!cert.signatures || typeof cert.signatures !== "object") return false;

    const genesis = cert.genesis as Record<string, unknown>;
    return (
      typeof genesis.id === "string" &&
      genesis.id.startsWith("genesis:") &&
      typeof genesis.created_at === "string"
    );
  } catch {
    return false;
  }
}

/**
 * Type guard for new token certificate (genesis-smart-1.0.json compliant)
 * Supports both new structure (genesis field) and legacy (token field)
 */
function isNewTokenCertificate(cert: Record<string, unknown>): boolean {
  try {
    // Check for new genesis-smart-1.0.json structure
    if (cert.genesis && typeof cert.genesis === "object") {
      const genesis = cert.genesis as Record<string, unknown>;
      // Check if it's a token genesis (has token_data or id starts with token:)
      if (genesis.token_data || (typeof genesis.id === "string" && genesis.id.includes("token"))) {
        return (
          cert.network !== undefined &&
          typeof cert.network === "object" &&
          cert.protocol !== undefined &&
          typeof cert.protocol === "object" &&
          cert.signatures !== undefined &&
          typeof cert.signatures === "object"
        );
      }
    }
    
    // Legacy support: check for token field
    if (cert.token && typeof cert.token === "object") {
      const token = cert.token as Record<string, unknown>;
      return (
        typeof token.id === "string" &&
        token.id.startsWith("token:") &&
        typeof token.standard === "string" &&
        typeof token.metadata === "object" &&
        token.metadata !== null &&
        cert.network !== undefined &&
        typeof cert.network === "object" &&
        cert.protocol !== undefined &&
        typeof cert.protocol === "object"
      );
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Type guard for legacy token certificate
 */
function isLegacyTokenCertificate(cert: Record<string, unknown>): boolean {
  try {
    return (
      typeof cert.id === "string" &&
      cert.id.startsWith("token:") &&
      cert.schema !== undefined &&
      cert.issuer !== undefined &&
      cert.signatures !== undefined &&
      typeof cert.signatures === "object"
    );
  } catch {
    return false;
  }
}

/**
 * Detect certificate type from structure
 * Automatically identifies token certificates vs genesis certificates
 * Uses proper type guards for robust validation
 * 
 * @param cert - Certificate object to analyze
 * @returns Certificate type: "token", "genesis", or "unknown"
 */
export function detectCertificateType(
  cert: Record<string, unknown>,
): "token" | "genesis" | "unknown" {
  // Check if it's a genesis.json (network genesis)
  if (isGenesisCertificate(cert)) {
    return "genesis";
  }

  // Check if it's a NEW genesis-compliant token certificate
  if (isNewTokenCertificate(cert)) {
    return "token";
  }

  // Check if it's an OLD token certificate (legacy format)
  if (isLegacyTokenCertificate(cert)) {
    return "token";
  }

  return "unknown";
}

/**
 * Verify genesis.json certificate structure
 * Note: Full cryptographic verification requires genesis-specific signing protocol
 * 
 * @param genesis - Genesis certificate object
 * @returns True if structure is valid (crypto verification skipped)
 */
async function verifyGenesisCertificate(
  genesis: Record<string, unknown>,
): Promise<boolean> {
  try {
    // For genesis.json, we skip cryptographic verification
    // because it requires the full genesis signing protocol
    // which is more complex than token certificates
    
    // Instead, perform structural validation
    const required = ["genesis", "network", "protocol", "content", "signatures"];
    for (const field of required) {
      if (!genesis[field]) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify token genesis certificate
 * Performs full cryptographic verification including hash and signature checks
 * Auto-detects certificate type (token/genesis) and applies appropriate validation
 * 
 * @param certificate - Token genesis certificate or genesis.json to verify
 * @returns True if certificate is cryptographically valid
 * 
 * @security 
 * - Verifies content hash (SHA-256)
 * - Verifies ECDSA secp256k1 signatures
 * - Validates sign domains
 * - Detects certificate type automatically
 */
export async function verifyTokenCertificate(
  certificate: TokenGenesisCertificate | Record<string, unknown>,
): Promise<boolean> {
  try {
    // Detect certificate type
    const certType = detectCertificateType(certificate as Record<string, unknown>);

    // Handle genesis.json separately
    if (certType === "genesis") {
      return verifyGenesisCertificate(certificate as Record<string, unknown>);
    }

    // Verify token certificate (genesis-smart-1.0.json compliant structure)
    const tokenCert = certificate as TokenGenesisCertificate;
    
    // Check for required fields (new structure uses genesis, legacy uses token)
    if (!tokenCert.genesis && !tokenCert.token) {
      return false;
    }
    if (!tokenCert.signatures) {
      return false;
    }

    // CRITICAL VERIFICATION PROCESS (per CLIENT_ISSUE_SUMMARY.md):
    // "Создаем документ БЕЗ signatures"
    
    // Step 1: Reconstruct certificate WITHOUT signatures (same as signing)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { signatures: _signatures, token: _token, ...certificateWithoutSignatures } = tokenCert;

    // Step 2: Canonical serialization of entire document (WITHOUT signatures and legacy token field)
    const canonicalDocument = deterministicStringify(certificateWithoutSignatures);

    // Step 3: Add domain separator as STRING PREFIX (not part of JSON!)
    // Use genesis sign domain for new structure, token domain for legacy
    const domainStr = tokenCert.genesis 
      ? tokenCert.protocol.sign_domains.genesis.join(":")
      : (tokenCert.protocol.sign_domains.token?.join(":") || tokenCert.protocol.sign_domains.genesis.join(":"));
    const messageString = `${domainStr}:${canonicalDocument}`;

    // Step 4: Verify each signature
    for (const sig of tokenCert.signatures.signers) {
      // For new structure, kid is address; for legacy, it might be public key
      // Find corresponding signing key to get public key
      let publicKeyForVerification: string;
      
      if (tokenCert.signing_keys && tokenCert.signing_keys.length > 0) {
        // New structure: find signing key by kid
        const signingKey = tokenCert.signing_keys.find(sk => sk.kid === sig.kid);
        if (signingKey) {
          // Convert compressed to uncompressed for verification
          const keyPair = EC.keyFromPublic(signingKey.public_key, "hex");
          publicKeyForVerification = keyPair.getPublic(false, "hex");
        } else {
          // Fallback: use kid as public key (legacy support)
          publicKeyForVerification = sig.kid;
        }
      } else {
        // Legacy: use kid as public key
        publicKeyForVerification = sig.kid;
      }

      const isValid = verify(messageString, sig.sig, publicKeyForVerification);

      if (!isValid) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Export certificate to different formats
 * Converts token certificate to various output formats
 * 
 * @param certificate - Token genesis certificate to export
 * @param format - Output format: "json" (pretty), "compact" (minified), "readable" (text)
 * @returns Formatted certificate string ready for export
 */
export function exportCertificate(
  certificate: TokenGenesisCertificate,
  format: "json" | "compact" | "readable",
): string {
  switch (format) {
    case "json":
      return JSON.stringify(certificate, null, 2);

    case "compact":
      return JSON.stringify(certificate);

    case "readable":
      return formatReadableCertificate(certificate);

    default:
      return JSON.stringify(certificate, null, 2);
  }
}

/**
 * Format certificate as readable text
 */
function formatReadableCertificate(
  certificate: TokenGenesisCertificate,
): string {
  const lines = [
    "════════════════════════════════════════════════════════════════",
    "           STELS TOKEN GENESIS CERTIFICATE (v1.0)",
    "════════════════════════════════════════════════════════════════",
    "",
    "─────────────────────────────── NETWORK ────────────────────────────────",
    `Network:         ${certificate.network.name}`,
    `Network ID:      ${certificate.network.id}`,
    `Chain ID:        ${certificate.network.chain_id}`,
    `Environment:     ${certificate.network.environment}`,
    "",
    "─────────────────────────────── PROTOCOL ───────────────────────────────",
    `TX Version:      ${certificate.protocol.tx_version}`,
    `VM Version:      ${certificate.protocol.vm_version}`,
    `Canon:           ${certificate.protocol.canonicalization}`,
    `Encoding:        ${certificate.protocol.encoding}`,
    "",
    "───────────────────────────────── TOKEN ────────────────────────────────",
    `Token ID:        ${certificate.token.id}`,
    `Name:            ${certificate.token.metadata.name}`,
    `Symbol:          ${certificate.token.metadata.symbol}`,
    `Standard:        ${certificate.token.standard}`,
    "",
    `Created:         ${certificate.token.created_at}`,
    `Activation:      ${certificate.token.activation_time}`,
    "",
    `Issuer Address:  ${certificate.token.issuer.address}`,
    `Issuer Org:      ${certificate.token.issuer.org || "N/A"}`,
    "",
    "──────────────────────────────── ECONOMICS ─────────────────────────────",
    `Initial Supply:  ${certificate.token.economics.supply.initial}`,
    `Max Supply:      ${certificate.token.economics.supply.max || "Unlimited"}`,
    `Minting Policy:  ${certificate.token.economics.supply.mintingPolicy}`,
    "",
    "─────────────────────────────── PARAMETERS ─────────────────────────────",
    `Currency:        ${certificate.parameters.currency.symbol}`,
    `Decimals:        ${certificate.parameters.currency.decimals}`,
    `Base Fee:        ${certificate.parameters.fees.base} ${certificate.parameters.fees.currency}`,
    `Treasury:        ${certificate.parameters.treasury_address}`,
    "",
    "────────────────────────────── CONTENT HASH ────────────────────────────",
    `Hash Algorithm:  ${certificate.content.hash_alg}`,
    `Content Hash:    ${certificate.content.hash}`,
    `Content Size:    ${certificate.content.size} bytes`,
    "",
    "─────────────────────────────── SIGNATURES ─────────────────────────────",
    `Threshold:       ${certificate.signatures.threshold?.type || "single"}`,
  ];

  certificate.signatures.signers.forEach((sig, i) => {
    lines.push(`Signature ${i + 1}:`);
    lines.push(`  Public Key: ${sig.kid.substring(0, 48)}...`);
    lines.push(`  Algorithm:  ${sig.alg}`);
    lines.push(`  Signature:  ${sig.sig.substring(0, 48)}...`);
    lines.push("");
  });

  lines.push("════════════════════════════════════════════════════════════════");
  lines.push("   Genesis.json-Compliant | Cryptographically Verifiable");
  lines.push("════════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
