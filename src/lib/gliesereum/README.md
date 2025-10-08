# Gliesereum Blockchain Library

## ⚠️ CRITICAL WARNING

**DO NOT MODIFY CRYPTOGRAPHIC FUNCTIONS WITHOUT SERVER COORDINATION**

This library implements client-side cryptography that must **exactly match** the
server-side implementation at `https://jsr.io/@stels/gliesereum`.

### Protected Functions

The following functions are **CRITICAL** and must not be changed:

1. **`sign()`** - Signature format must be DER hex
2. **`verify()`** - Must match server verification
3. **`deterministicStringify()`** - Must produce identical JSON to server
4. **`createSignedTransaction()`** - Hash calculation must match server
5. **`validateTransaction()`** - Throws on hash mismatch (server behavior)
6. **`createHash()`** - SHA256 + RIPEMD160 chain
7. **`getAddress()`** - Base58 encoding with VERSION_BYTE = 98

### Testing Requirements

Before modifying ANY cryptographic function:

1. ✅ Test against live server (`https://live.stels.dev`)
2. ✅ Verify transactions are accepted
3. ✅ Check signature compatibility
4. ✅ Validate address generation
5. ✅ Test with multiple wallets

### What Can Be Changed

✅ **Safe to modify**:

- File organization (already modularized)
- Documentation and comments
- Non-cryptographic utilities
- Type definitions (as long as structure matches)
- Import/export statements

❌ **DO NOT modify**:

- Signature generation format
- Hash calculation algorithms
- Address encoding logic
- Transaction validation logic
- Any cryptographic primitives

### Module Structure

```
gliesereum/
├── types.ts          # Type definitions ✅ Safe
├── crypto.ts         # ⚠️ CRITICAL - Core crypto
├── wallet.ts         # ⚠️ CRITICAL - Address generation
├── validation.ts     # ✅ Mostly safe - validation rules
└── index.ts         # ⚠️ CRITICAL - Transaction creation
```

### Dependencies

- `elliptic` - secp256k1 curve operations
- `bs58` - Base58 encoding for addresses
- `@noble/hashes` - SHA256, RIPEMD160, HMAC

### Constants

```typescript
VERSION_BYTE = 98; // Gliesereum address version (character 'g')
CHECKSUM_SIZE = 4; // Address checksum length
```

### Recent Issues Fixed

- **2025-10-08**: Fixed signature format during refactoring
  - Issue: Changed from DER to compact format
  - Impact: Server rejected all transactions
  - Fix: Restored original DER format
  - Lesson: Never modify crypto without server coordination

---

## 🔒 Security Notes

1. **Private keys** are never logged or transmitted
2. **Signatures** use canonical format (lowS)
3. **Addresses** use base58 with checksum validation
4. **Hashes** are deterministic and reproducible

---

## 📝 Changelog

- **2025-10-08**: Modularized into separate files
  - Maintained 100% compatibility with server
  - No changes to cryptographic logic
  - Added safety warnings and documentation

---

**Last Updated**: October 8, 2025\
**Server Version**: 1.12.1\
**Compatibility**: ✅ VERIFIED
