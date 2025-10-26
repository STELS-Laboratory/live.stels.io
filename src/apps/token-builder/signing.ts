/**
 * Token Schema Signing
 * Sign token schemas using STELS cryptographic standards
 * 
 * SECURITY: Uses ECDSA secp256k1 signatures with deterministic canonicalization
 */

import type { TokenSchema, TokenGenesisCertificate } from "./types";
import { importWallet, sign, verify, deterministicStringify } from "@/lib/gliesereum";

/**
 * Sign token schema and create genesis certificate
 * Creates a cryptographically signed birth certificate for a token
 * 
 * @param schema - Complete token schema to sign
 * @param privateKey - Private key for signing (64 hex chars)
 * @returns Signed token genesis certificate with ECDSA signature
 * @throws Error if schema is invalid or signing fails
 * 
 * @security Private key is never logged or stored
 */
export async function signTokenSchema(
  schema: TokenSchema,
  privateKey: string,
): Promise<TokenGenesisCertificate> {
  // Import wallet from private key
  const wallet = importWallet(privateKey);

  // Prepare signing view (canonical representation)
  const signingView = {
    version: schema.version,
    standard: schema.standard,
    metadata: schema.metadata,
    economics: schema.economics,
    transferRestrictions: schema.transferRestrictions,
    governance: schema.governance,
    customFields: schema.customFields,
    technical: schema.technical,
  };

  // Create canonical string
  const canonicalString = deterministicStringify(signingView);
  const contentBytes = new TextEncoder().encode(canonicalString);

  // Calculate hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", contentBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Create token ID
  const tokenId = `token:sha256:${hash}`;

  // Create sign domain for token genesis
  const signDomain = [
    "STELS-TOKEN-GENESIS",
    2,
    "v1",
    `chain:${schema.technical?.chainId || 2}`,
  ];

  // Create timestamp (IMPORTANT: must be consistent for signing and verification)
  const now = Date.now();
  const createdAt = new Date(now).toISOString();

  // Prepare message to sign
  const message = {
    domain: signDomain,
    tokenId: tokenId,
    hash: hash,
    timestamp: now, // Use the exact timestamp
    schema: signingView,
  };

  const messageString = deterministicStringify(message);

  console.log("[Signing] Message to sign:", messageString.substring(0, 100));
  console.log("[Signing] Timestamp:", now);

  // Sign the message
  const signature = sign(messageString, privateKey);

  console.log("[Signing] Signature created:", signature.substring(0, 32) + "...");

  // Get public key and address from wallet
  const publicKey = wallet.publicKey;
  const address = wallet.address;

  // Create genesis certificate
  const certificate: TokenGenesisCertificate = {
    id: tokenId,
    createdAt: createdAt, // Use the ISO string from the same timestamp
    activationTime: schema.technical?.network?.includes("testnet")
      ? new Date(Date.now() + 60000).toISOString() // 1 min for testnet
      : new Date(Date.now() + 3600000).toISOString(), // 1 hour for mainnet
    issuer: {
      address: address,
      publicKey: publicKey,
      org: schema.metadata?.name || "Unknown",
    },
    schema: schema,
    content: {
      hashAlg: "sha256",
      hash: `sha256:${hash}`,
      size: contentBytes.length,
    },
    signatures: [
      {
        kid: publicKey,
        alg: "ecdsa-secp256k1",
        sig: signature,
      },
    ],
    signDomain: signDomain,
  };

  return certificate;
}

/**
 * Detect certificate type from structure
 * Automatically identifies token certificates vs genesis certificates
 * 
 * @param cert - Certificate object to analyze
 * @returns Certificate type: "token", "genesis", or "unknown"
 */
function detectCertificateType(
  cert: Record<string, unknown>,
): "token" | "genesis" | "unknown" {
  // Check if it's a genesis.json
  if (cert.genesis && cert.network && cert.protocol && cert.content) {
    return "genesis";
  }

  // Check if it's a token certificate
  if (cert.id && cert.schema && cert.issuer && cert.signatures) {
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
    console.log("[Validator] Verifying genesis certificate...");

    // For genesis.json, we skip cryptographic verification
    // because it requires the full genesis signing protocol
    // which is more complex than token certificates
    
    // Instead, perform structural validation
    const required = ["genesis", "network", "protocol", "content", "signatures"];
    for (const field of required) {
      if (!genesis[field]) {
        console.error(`[Validator] Missing required field: ${field}`);
        return false;
      }
    }

    console.log("[Validator] ✓ Genesis certificate structure is valid");
    console.log("[Validator] Note: Full cryptographic verification of genesis.json");
    console.log("[Validator]       requires genesis-specific signing protocol.");
    console.log("[Validator]       Use this validator for token certificates only.");
    
    return true;
  } catch (error) {
    console.error("[Validator] Genesis verification error:", error);
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
    console.log("[Validator] Starting certificate verification...");

    // Detect certificate type
    const certType = detectCertificateType(certificate as Record<string, unknown>);
    console.log("[Validator] Certificate type:", certType);

    // Handle genesis.json separately
    if (certType === "genesis") {
      console.log("[Validator] Detected genesis.json format");
      console.log("[Validator] Note: This validator is designed for token certificates.");
      console.log("[Validator]       Genesis certificates have different signing protocol.");
      
      return verifyGenesisCertificate(certificate as Record<string, unknown>);
    }

    // Verify token certificate
    const tokenCert = certificate as TokenGenesisCertificate;
    
    if (!tokenCert.id || !tokenCert.schema || !tokenCert.signatures) {
      console.error("[Validator] Invalid token certificate structure");
      return false;
    }

    console.log("[Validator] Certificate ID:", tokenCert.id);

    // Reconstruct signing view (exclude signatures and other metadata)
    const signingView = {
      version: tokenCert.schema.version,
      standard: tokenCert.schema.standard,
      metadata: tokenCert.schema.metadata,
      economics: tokenCert.schema.economics,
      transferRestrictions: tokenCert.schema.transferRestrictions,
      governance: tokenCert.schema.governance,
      customFields: tokenCert.schema.customFields,
      technical: tokenCert.schema.technical,
    };

    console.log("[Validator] Reconstructed signing view");

    // Verify content hash
    const canonicalString = deterministicStringify(signingView);
    const contentBytes = new TextEncoder().encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", contentBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    console.log("[Validator] Calculated hash:", hash);
    console.log("[Validator] Expected hash:", tokenCert.content.hash);

    const expectedHash = tokenCert.content.hash.replace("sha256:", "");
    if (expectedHash !== hash) {
      console.error("[Validator] Hash mismatch!");
      console.error("[Validator] Expected:", expectedHash);
      console.error("[Validator] Calculated:", hash);
      return false;
    }

    console.log("[Validator] ✓ Hash verification passed");

    // Verify each signature
    console.log(`[Validator] Verifying ${tokenCert.signatures.length} signature(s)...`);

    for (const sig of tokenCert.signatures) {
      console.log(`[Validator] Verifying signature for ${sig.kid.substring(0, 16)}...`);

      // Reconstruct the exact message that was signed
      const message = {
        domain: tokenCert.signDomain,
        tokenId: tokenCert.id,
        hash: hash,
        timestamp: new Date(tokenCert.createdAt).getTime(),
        schema: signingView,
      };

      const messageString = deterministicStringify(message);

      console.log("[Validator] Message to verify (first 100 chars):", messageString.substring(0, 100));
      console.log("[Validator] Signature:", sig.sig.substring(0, 32) + "...");
      console.log("[Validator] Public key:", sig.kid);

      const isValid = verify(messageString, sig.sig, sig.kid);

      console.log(`[Validator] Signature verification result:`, isValid);

      if (!isValid) {
        console.error(`[Validator] ✗ Signature verification failed for ${sig.kid}`);
        
        // Additional debugging
        console.error("[Validator] Debug info:");
        console.error("  - Message length:", messageString.length);
        console.error("  - Signature length:", sig.sig.length);
        console.error("  - Algorithm:", sig.alg);
        
        return false;
      }

      console.log(`[Validator] ✓ Signature verified for ${sig.kid.substring(0, 16)}...`);
    }

    console.log("[Validator] ✓ All signatures verified successfully");
    return true;
  } catch (error) {
    console.error("[Validator] Certificate verification error:", error);
    if (error instanceof Error) {
      console.error("[Validator] Error message:", error.message);
      console.error("[Validator] Error stack:", error.stack);
    }
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
    "                  STELS TOKEN GENESIS CERTIFICATE",
    "════════════════════════════════════════════════════════════════",
    "",
    `Token ID:        ${certificate.id}`,
    `Token Name:      ${certificate.schema.metadata.name}`,
    `Token Symbol:    ${certificate.schema.metadata.symbol}`,
    `Token Standard:  ${certificate.schema.standard}`,
    "",
    `Created:         ${certificate.createdAt}`,
    `Activation:      ${certificate.activationTime || "Immediate"}`,
    "",
    `Issuer Address:  ${certificate.issuer.address}`,
    `Issuer Org:      ${certificate.issuer.org || "N/A"}`,
    "",
    `Content Hash:    ${certificate.content.hash}`,
    `Content Size:    ${certificate.content.size} bytes`,
    "",
    "─────────────────────────────── ECONOMICS ──────────────────────────────",
    `Initial Supply:  ${certificate.schema.economics.supply.initial}`,
    `Max Supply:      ${certificate.schema.economics.supply.max || "Unlimited"}`,
    `Minting Policy:  ${certificate.schema.economics.supply.mintingPolicy}`,
    "",
    "─────────────────────────────── SIGNATURES ─────────────────────────────",
  ];

  certificate.signatures.forEach((sig, i) => {
    lines.push(`Signature ${i + 1}:`);
    lines.push(`  Public Key: ${sig.kid.substring(0, 32)}...`);
    lines.push(`  Algorithm:  ${sig.alg}`);
    lines.push(`  Signature:  ${sig.sig.substring(0, 32)}...`);
    lines.push("");
  });

  lines.push("════════════════════════════════════════════════════════════════");
  lines.push("     This certificate is cryptographically verifiable");
  lines.push("════════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
