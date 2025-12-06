/**
 * Certificate Helpers
 * Utility functions for working with token certificates
 * Supports both new genesis-smart-1.0.json structure and legacy token structure
 */

import type { TokenGenesisCertificate, TokenData } from "../types";

/**
 * Get token data from certificate
 * Supports both new structure (genesis.token_data) and legacy (token)
 * 
 * @param certificate - Token genesis certificate
 * @returns Token data or null if not found
 */
export function getTokenData(
  certificate: TokenGenesisCertificate,
): TokenData | null {
  // Legacy support: check token field first
  if (certificate.token) {
    return certificate.token;
  }

  // New structure: extract from genesis.token_data
  if (certificate.genesis?.token_data) {
    const tokenData = certificate.genesis.token_data;
    const genesisId = certificate.genesis.id;
    
    // Convert genesis ID to token ID format for backward compatibility
    const tokenId = genesisId.replace("genesis:", "token:");
    
    return {
      id: tokenId,
      created_at: certificate.genesis.created_at,
      activation_time: certificate.genesis.activation_time,
      issuer: {
        address: "", // Will be extracted from signing_keys if needed
        public_key: "", // Will be extracted from signing_keys if needed
        org: certificate.genesis.issuer.org,
        contact: certificate.genesis.issuer.contact,
      },
      standard: tokenData.standard,
      metadata: tokenData.metadata,
      economics: tokenData.economics,
      ...(tokenData.governance && { governance: tokenData.governance }),
      ...(tokenData.transferRestrictions && { transferRestrictions: tokenData.transferRestrictions }),
      ...(tokenData.customFields && { customFields: tokenData.customFields }),
    };
  }

  return null;
}

/**
 * Check if certificate uses new genesis-smart-1.0.json structure
 * 
 * @param certificate - Token genesis certificate
 * @returns True if uses new structure (has genesis field)
 */
export function isNewStructure(
  certificate: TokenGenesisCertificate,
): boolean {
  return !!certificate.genesis && !certificate.token;
}

/**
 * Get issuer address from certificate
 * Extracts from signing_keys or token.issuer.address
 * 
 * @param certificate - Token genesis certificate
 * @returns Issuer address or empty string
 */
export function getIssuerAddress(
  certificate: TokenGenesisCertificate,
): string {
  // Legacy: from token.issuer.address
  if (certificate.token?.issuer?.address) {
    return certificate.token.issuer.address;
  }

  // New structure: from signing_keys[0].kid (if it's an address)
  if (certificate.signing_keys && certificate.signing_keys.length > 0) {
    const firstKey = certificate.signing_keys[0];
    // Check if kid is an address (base58, starts with 'g' for STELS)
    if (firstKey.kid && /^[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(firstKey.kid)) {
      return firstKey.kid;
    }
  }

  return "";
}

