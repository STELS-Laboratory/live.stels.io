# Web 5 Standards 🌐

**Category:** Platform\
**Last Updated:** October 21, 2025\
**Version:** 0.12.8

---

## Introduction

**STELS Web OS** is built with **Web 5** principles at its core. This document
explains how STELS implements Web 5 standards and what that means for developers
building on the platform.

---

## What is Web 5?

**Web 5** is the next evolution of the web, combining the best aspects of Web 2
(usability) and Web 3 (decentralization) while solving their key limitations.

### The Evolution

```
Web 1.0 (1990-2004)
├─ Read-only
├─ Static pages
└─ No user interaction

Web 2.0 (2004-2020)
├─ Read-write
├─ User-generated content
├─ Centralized platforms
└─ Data owned by corporations

Web 3.0 (2020-2024)
├─ Read-write-own
├─ Blockchain-based
├─ Decentralized but complex
└─ Poor user experience

Web 5.0 (2024-Present) ← STELS is here
├─ Identity you control
├─ Data you own
├─ Applications that respect both
└─ Web 2 UX + Web 3 decentralization
```

### Web 5 Core Principles

1. **Decentralized Identifiers (DIDs)**: You control your identity
2. **Verifiable Credentials (VCs)**: Cryptographically provable claims
3. **Decentralized Web Nodes (DWNs)**: Your personal data store
4. **Self-Sovereign Identity**: No central authority can revoke your identity

---

## STELS Implementation of Web 5

### 1. Decentralized Identity (DID)

Every STELS user has a **cryptographic identity** that they fully control.

#### Gliesereum DID Method

STELS implements a custom DID method based on the Gliesereum blockchain:

```
did:gliesereum:G5X9Y2Z8A3B4C5D6E7F8G9H0I1J2K3L4M5N6
```

**Format**: `did:gliesereum:{address}`

Where `{address}` is a 34-character Gliesereum address.

#### DID Document

Each identity has an associated DID document:

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:gliesereum:G5X9Y2Z8A3B4C5D6E7F8G9H0I1J2K3L4M5N6",
  "verificationMethod": [
    {
      "id": "did:gliesereum:G5X9Y2Z8...#key-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:gliesereum:G5X9Y2Z8...",
      "publicKeyHex": "02abc123..."
    }
  ],
  "authentication": ["#key-1"],
  "created": "2025-01-15T12:00:00Z",
  "updated": "2025-01-15T12:00:00Z"
}
```

#### Key Properties

- **Cryptographic Basis**: secp256k1 elliptic curve (same as Bitcoin/Ethereum)
- **Self-Generated**: Users create their own keys locally
- **No Registration**: No central authority needed
- **Immutable**: Keys determine identity; changing keys = new identity
- **Recoverable**: Identity can be recovered from private key

#### Example: Creating a DID

```typescript
import { createWallet } from "@/lib/gliesereum";

// Generate new identity
const wallet = createWallet();

// DID is derived from address
const did = `did:gliesereum:${wallet.address}`;

console.log("Your DID:", did);
// Output: did:gliesereum:G5X9Y2Z8A3B4C5D6E7F8G9H0I1J2K3L4M5N6
```

---

### 2. Verifiable Credentials

Every operation in STELS creates **verifiable credentials** through
cryptographic signatures.

#### What are Verifiable Credentials?

VCs are cryptographically-signed digital credentials that prove:

- Who issued them
- Who they're issued to
- What they claim
- That they haven't been tampered with

#### Example: Exchange Account Credential

When you add an exchange account to STELS:

```typescript
{
  "@context": "https://www.w3.org/2018/credentials/v1",
  "type": ["VerifiableCredential", "ExchangeAccountCredential"],
  "issuer": "did:gliesereum:G5X9Y...",  // Your DID
  "issuanceDate": "2025-01-15T12:00:00Z",
  "credentialSubject": {
    "id": "did:gliesereum:G5X9Y...",
    "exchange": "binance",
    "accountId": "account-123",
    "status": "active",
    "apiKeyHash": "sha256(apiKey)"  // Not the actual key!
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "created": "2025-01-15T12:00:00Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:gliesereum:G5X9Y...#key-1",
    "signature": "0x..." // Your cryptographic signature
  }
}
```

#### Verification Process

Anyone can verify a credential:

1. Extract the proof signature
2. Get the issuer's public key from their DID document
3. Verify signature against credential data
4. Check issuance date and expiration (if any)

```typescript
import { verify } from "@/lib/gliesereum";

const isValid = verify(
  credentialData,
  credential.proof.signature,
  issuerPublicKey,
);
```

#### Benefits

- **No Central Authority**: No database to hack or authority to corrupt
- **Privacy-Preserving**: Share only what's needed
- **Cryptographically Secure**: Math guarantees integrity
- **Portable**: Take your credentials anywhere

---

### 3. Decentralized Web Nodes (DWN)

In STELS, **heterogens** act as Decentralized Web Nodes.

#### What is a DWN?

A DWN is:

- **Your personal data store**: You decide what's stored
- **Your execution environment**: Run your code
- **Replicated globally**: Redundancy and availability
- **Encrypted**: Only you can decrypt your data

#### DWN Architecture in STELS

```
┌─────────────────────────────────────────────────────┐
│                   Your Identity                     │
│              (DID + Private Key)                    │
└───────────────────┬─────────────────────────────────┘
                    │ Controls
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
   │  DWN 1  │ │  DWN 2  │ │  DWN 3  │
   │ (Tokyo) │ │(London) │ │  (NYC)  │
   └─────────┘ └─────────┘ └─────────┘
        │           │           │
        └───────────┼───────────┘
                    │ Synchronized
              ┌─────▼──────┐
              │ Your Data  │
              │ + Workers  │
              │ + Schemas  │
              └────────────┘
```

#### Data Storage

All your data is encrypted before storage:

```typescript
// Your data
const data = {
  schema: mySchema,
  private: true,
};

// Encrypt with your key
const encrypted = await encrypt(
  JSON.stringify(data),
  wallet.publicKey,
);

// Store on DWNs (heterogens)
await dwn.store(encrypted);

// Only you can decrypt
const decrypted = await decrypt(encrypted, wallet.privateKey);
```

#### Worker Execution

Workers run in your DWN context:

```typescript
export async function execute(context) {
  // context.dwn provides access to your DWN

  // Read your private data
  const data = await context.dwn.read("my-private-data");

  // Write new data
  await context.dwn.write("my-results", results);

  // Encrypted automatically
}
```

#### Benefits

- **Data Ownership**: You own your data, not the platform
- **Privacy**: End-to-end encryption
- **Portability**: Take your data anywhere
- **Availability**: Replicated across multiple nodes
- **Censorship Resistant**: No single entity controls your data

---

### 4. Self-Sovereign Identity

Your identity is **sovereign** - you have complete control.

#### Key Principles

1. **Self-Generation**: You create your identity (no registration)
2. **Self-Custody**: You hold your private keys
3. **Self-Assertion**: You make claims about yourself
4. **Permissionless**: No one can prevent you from creating identity
5. **Portable**: Use same identity across all services

#### Identity Lifecycle

```
┌──────────────┐
│  Create      │ ← Generate keys locally
│  Identity    │   (no server involved)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Use         │ ← Sign transactions, authenticate
│  Identity    │   (cryptographic proofs)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Recover     │ ← Import from private key
│  Identity    │   (same identity on any device)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Revoke      │ ← Stop using (optional)
│  Identity    │   (destroy private key)
└──────────────┘
```

#### Example: Identity Usage

```typescript
// Day 1: Create identity on laptop
const wallet1 = createWallet();
const did1 = `did:gliesereum:${wallet1.address}`;

// Day 2: Recover same identity on phone
const wallet2 = importWallet(wallet1.privateKey);
const did2 = `did:gliesereum:${wallet2.address}`;

// did1 === did2 (same identity!)
```

#### Recovery

Your identity is recoverable from:

- **Private key** (64 hex characters)
- **Mnemonic phrase** (12-24 words - future enhancement)
- **Hardware wallet** (future enhancement)

---

## Web 5 vs Previous Generations

### Comparison Table

| Feature              | Web 2                     | Web 3                | Web 5 (STELS)       |
| -------------------- | ------------------------- | -------------------- | ------------------- |
| **Identity**         | Username/Password         | Wallet address       | Cryptographic DID   |
| **Data Storage**     | Company servers           | Blockchain           | Personal DWNs       |
| **Data Ownership**   | Platform owns             | Blockchain stores    | User owns           |
| **Privacy**          | Poor (data mining)        | Public (transparent) | Private (encrypted) |
| **User Experience**  | Great                     | Poor                 | Great               |
| **Interoperability** | Siloed                    | Limited              | Universal           |
| **Cost**             | Free (you're the product) | High (gas fees)      | Low (efficient)     |
| **Recovery**         | Reset password            | Seed phrase          | Private key         |
| **Censorship**       | Easy                      | Difficult            | Impossible          |

### Key Improvements Over Web 3

1. **Better UX**: Web 2 simplicity with Web 3 decentralization
2. **Lower Costs**: No blockchain gas fees for every action
3. **Privacy**: Encrypted by default, not public by default
4. **Scalability**: Heterogeneous network handles millions of operations
5. **Interoperability**: Standard DIDs and VCs work everywhere

---

## Standards Compliance

STELS implements or is compatible with:

### W3C Standards

- **Decentralized Identifiers (DIDs) v1.0**: Core identity standard
- **Verifiable Credentials Data Model v1.1**: Credential format
- **DID Authentication**: Proof of identity ownership
- **Linked Data Proofs**: Cryptographic integrity

### Cryptographic Standards

- **secp256k1**: Elliptic curve (Bitcoin/Ethereum compatible)
- **ECDSA**: Digital signature algorithm
- **SHA-256**: Hashing algorithm
- **Base58**: Address encoding

### Protocol Standards

- **WebSocket**: Real-time bidirectional communication
- **HTTP/2**: Efficient API communication
- **JSON**: Standard data format
- **OpenAPI**: API documentation (future)

---

## Interoperability

STELS identities and credentials work with other Web 5 systems.

### DID Interoperability

```typescript
// STELS DID
const stelsDID = "did:gliesereum:G5X9Y...";

// Works with other DID systems
const etherDID = "did:ethr:0x1234...";
const ionDID = "did:ion:abc123...";

// All use same verification logic
async function verifySignature(did, data, signature) {
  const didDoc = await resolveDID(did);
  const publicKey = didDoc.verificationMethod[0].publicKeyHex;
  return verify(data, signature, publicKey);
}
```

### Verifiable Credential Exchange

```typescript
// Issue credential in STELS
const credential = issueVC(
  "did:gliesereum:issuer",
  "did:gliesereum:subject",
  { claim: "value" },
);

// Present to external verifier
const presentation = createVP(
  [credential],
  "did:gliesereum:subject",
);

// External service verifies
const isValid = await externalService.verify(presentation);
```

---

## Privacy & Security

### Privacy Features

1. **End-to-End Encryption**: Data encrypted before leaving your device
2. **Zero-Knowledge Proofs**: Prove claims without revealing data (future)
3. **Selective Disclosure**: Share only necessary information
4. **No Tracking**: No analytics, no cookies, no data mining
5. **Local-First**: Data processed locally when possible

### Security Measures

1. **Cryptographic Identity**: Math-based security, not passwords
2. **Multi-Signature**: Require multiple approvals for sensitive operations
3. **Time-Locked Transactions**: Transactions that execute at specific times
4. **Threshold Signatures**: M-of-N signature requirements
5. **Hardware Security**: Hardware wallet support (future)

### Best Practices

```typescript
// ✅ Good: Store encrypted private key
const encrypted = await encryptPrivateKey(
  wallet.privateKey,
  userPassword,
);
localStorage.setItem("encrypted_key", encrypted);

// ❌ Bad: Store plaintext private key
localStorage.setItem("private_key", wallet.privateKey); // DON'T DO THIS!

// ✅ Good: Verify before executing
if (verify(data, signature, publicKey)) {
  await execute(data);
}

// ❌ Bad: Trust without verification
await execute(data); // DON'T DO THIS!
```

---

## Future Enhancements

STELS is continuously evolving to support emerging Web 5 standards:

### Roadmap

#### Q2 2025

- [ ] Zero-Knowledge Proofs for privacy-preserving credentials
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] DID method extensions for additional verification methods

#### Q3 2025

- [ ] Verifiable Data Registry for public claims
- [ ] Credential revocation mechanism
- [ ] DID rotation without losing history

#### Q4 2025

- [ ] Cross-chain identity (Ethereum, Bitcoin, etc.)
- [ ] Decentralized reputation system
- [ ] Social recovery for lost keys

---

## For Developers

### Building Web 5 Compatible Apps

```typescript
// 1. Use DIDs for identity
const userDID = `did:gliesereum:${wallet.address}`;

// 2. Issue verifiable credentials
const credential = {
  "@context": "https://www.w3.org/2018/credentials/v1",
  type: ["VerifiableCredential", "MyAppCredential"],
  issuer: appDID,
  credentialSubject: {
    id: userDID,
    claim: "value",
  },
  proof: createProof(data, wallet.privateKey),
};

// 3. Store in user's DWN
await context.dwn.write("credential", credential);

// 4. Verify credentials
const isValid = verifyCredential(credential);

// 5. Respect user privacy
// Don't track, don't store PII, encrypt everything
```

### Testing Web 5 Features

```typescript
// Test DID resolution
const didDoc = await resolveDID("did:gliesereum:...");

// Test credential verification
const isValid = verifyCredential(credential);

// Test encryption
const encrypted = await encrypt(data, publicKey);
const decrypted = await decrypt(encrypted, privateKey);
```

---

## Resources

### Standards Documents

- **W3C DID Core**: https://www.w3.org/TR/did-core/
- **W3C Verifiable Credentials**: https://www.w3.org/TR/vc-data-model/
- **DIF DWN Spec**: https://identity.foundation/decentralized-web-node/spec/

### STELS-Specific

- **Gliesereum Blockchain**: https://gliesereum.com
- **DID Method Specification**: (coming soon)
- **API Documentation**: `API_REFERENCE.md`

### Learning Resources

- **Web 5 Introduction**: https://developer.tbd.website/docs/web5/
- **DID Primer**:
  https://github.com/WebOfTrustInfo/rwot7-toronto/blob/master/topics-and-advance-readings/did-primer.md
- **Verifiable Credentials Primer**:
  https://github.com/WebOfTrustInfo/rwot7-toronto/blob/master/topics-and-advance-readings/verifiable-credentials-primer.md

---

## Summary

STELS implements Web 5 through:

✅ **Decentralized Identity**: DIDs you control\
✅ **Verifiable Credentials**: Cryptographic proofs\
✅ **Decentralized Web Nodes**: Your data, your nodes\
✅ **Self-Sovereign Identity**: Complete control\
✅ **Privacy by Default**: Encrypted everything\
✅ **Interoperability**: Standard protocols

---

## Next Steps

**Explore more:**

→ **Reactive UI Engine**: `UI_ENGINE.md` - Build real-time interfaces with JSON\
→ **Developer Guide**: `DEVELOPER_GUIDE.md`\
→ **Protocol Editor**: `EDITOR_GUIDE.md`\
→ **Best Practices**: `BEST_PRACTICES.md`\
→ **API Reference**: `API_REFERENCE.md`

---

**Welcome to Web 5. Welcome to the future of identity and data ownership.** 🌐
