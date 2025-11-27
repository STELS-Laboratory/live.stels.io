/**
 * Signature Debugging Utility
 * Helps diagnose signature verification failures
 */

import { 
  deterministicStringify, 
  sign, 
  verify,
  getUncompressedPublicKey 
} from "@/lib/gliesereum";
import type { TokenGenesisCertificate } from "../types";

/**
 * Debug signature creation process
 */
export function debugSignature(
  certificate: TokenGenesisCertificate,
  privateKey: string
): {
  success: boolean;
  details: {
    step1_documentWithoutSignatures: string;
    step2_canonical: string;
    step3_domain: string;
    step4_message: string;
    step5_signature: string;
    step6_publicKey: string;
    step7_verification: boolean;
    differences?: string[];
  };
} {

  // Step 1: Remove signatures (recreate what was signed)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signatures, ...documentWithoutSignatures } = certificate;
  const docString = JSON.stringify(documentWithoutSignatures, null, 2);

  // Step 2: Canonical serialization

  const canonical = deterministicStringify(documentWithoutSignatures);

  // Step 3: Domain separator

  const domain = certificate.protocol.sign_domains.token;
  const domainStr = domain.join(":");

  // Step 4: Create message

  const message = `${domainStr}:${canonical}`;

  // Step 5: Sign

  const newSignature = sign(message, privateKey);

  // Step 6: Get public key

  const publicKey = getUncompressedPublicKey(privateKey);

  // Step 7: Verify

  const isValid = verify(message, certificate.signatures.signers[0].sig, publicKey);

  // Check for differences
  const differences: string[] = [];

  if (newSignature !== certificate.signatures.signers[0].sig) {
    differences.push("New signature differs from document signature");
  }

  if (publicKey !== certificate.token.issuer.public_key) {
    differences.push("Computed public key differs from issuer.public_key");
  }

  if (publicKey !== certificate.signatures.signers[0].kid) {
    differences.push("Computed public key differs from signers[0].kid");
  }

  if (!isValid) {
    differences.push("Signature verification failed");
  }

  if (differences.length === 0) {
    // No differences
  } else {
    // Differences found
  }

  return {
    success: differences.length === 0,
    details: {
      step1_documentWithoutSignatures: docString,
      step2_canonical: canonical,
      step3_domain: domainStr,
      step4_message: message,
      step5_signature: newSignature,
      step6_publicKey: publicKey,
      step7_verification: isValid,
      differences: differences.length > 0 ? differences : undefined,
    },
  };
}

/**
 * Compare two Genesis certificates to find differences
 */
export function compareGenesisCertificates(
  cert1: TokenGenesisCertificate,
  cert2: TokenGenesisCertificate
): {
  identical: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare canonical representations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signatures: sig1, ...doc1 } = cert1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signatures: sig2, ...doc2 } = cert2;

  const canonical1 = deterministicStringify(doc1);
  const canonical2 = deterministicStringify(doc2);

  if (canonical1 !== canonical2) {
    differences.push("Canonical representations differ");
    
    // Find first difference
    for (let i = 0; i < Math.min(canonical1.length, canonical2.length); i++) {
      if (canonical1[i] !== canonical2[i]) {
        const context = 50;
        const start = Math.max(0, i - context);
        const end = Math.min(canonical1.length, i + context);
        
        differences.push(`First difference at position ${i}:`);
        differences.push(`  Cert1: ...${canonical1.substring(start, end)}...`);
        differences.push(`  Cert2: ...${canonical2.substring(start, end)}...`);
        break;
      }
    }
  }

  if (cert1.signatures.signers[0].sig !== cert2.signatures.signers[0].sig) {
    differences.push("Signatures differ");
  }

  if (cert1.signatures.signers[0].kid !== cert2.signatures.signers[0].kid) {
    differences.push("Signer public keys (kid) differ");
  }

  return {
    identical: differences.length === 0,
    differences,
  };
}

/**
 * Recreate signature verification data for debugging
 */
export function recreateSignatureVerificationData(
  certificate: TokenGenesisCertificate
): {
  canonical: string;
  domain: string;
  message: string;
  publicKey: string;
  signature: string;
} {
  // Remove signatures
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signatures, ...documentWithoutSignatures } = certificate;

  // Canonical form
  const canonical = deterministicStringify(documentWithoutSignatures);

  // Domain
  const domain = certificate.protocol.sign_domains.token.join(":");

  // Message
  const message = `${domain}:${canonical}`;

  return {
    canonical,
    domain,
    message,
    publicKey: certificate.signatures.signers[0].kid,
    signature: certificate.signatures.signers[0].sig,
  };
}
