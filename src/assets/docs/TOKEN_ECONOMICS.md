# Token Economics & Fee Structure

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Token Developers, Economists

---

## Understanding Fees in STELS

STELS has a **dual fee system** that separates network costs from token
operations. Understanding this distinction is critical when creating tokens.

---

## Two Types of Fees

### 1. **Network Fees** (System Level)

**Paid in:** TST (STELS system currency)\
**Goes to:** System treasury (`gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo`)\
**Applies to:** ALL transactions in the network

**Purpose:** Pay for network resources and heterogen operation.

**Defined in Genesis:** `parameters.fees`

```json
{
  "parameters": {
    "fees": {
      "base": "0.00005", // Base transaction fee (TST)
      "per_byte": "0.0000001", // Per-byte data fee (TST)
      "raw_per_byte": "0.0000003", // Raw data per-byte (TST)
      "currency": "TST" // System currency
    },
    "currency": {
      "symbol": "TST",
      "decimals": 6,
      "fee_unit": "10^-6 TST"
    },
    "treasury_address": "gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo"
  }
}
```

**Example:**

```
User sends BTC token to another user:
- Transaction size: 256 bytes
- Base fee: 0.00005 TST
- Per-byte fee: 0.0000001 TST × 256 = 0.0000256 TST
- Total NETWORK fee: 0.0000756 TST (paid from user's TST balance)
```

### 2. **Token Fees** (Token Level)

**Paid in:** The token itself (e.g., BTC, ETH, custom token)\
**Goes to:** Token treasury (defined by token creator)\
**Applies to:** Only this specific token's operations

**Purpose:** Token economics, governance, sustainability.

**Defined in Genesis:** `token.economics.feeStructure`

```json
{
  "token": {
    "economics": {
      "feeStructure": {
        "transfer": "0.001", // 0.1% fee (in the token)
        "mint": "0.001", // 0.1% fee for minting
        "burn": "0.001" // 0.1% fee for burning
      },
      "treasury": "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv"
    }
  }
}
```

**Example:**

```
User sends 100 BTC tokens:
- Transfer amount: 100 BTC
- Token fee: 100 × 0.001 = 0.1 BTC
- Recipient receives: 99.9 BTC
- Token treasury receives: 0.1 BTC
- PLUS: Network fee in TST (see above)
```

---

## Complete Transaction Cost

When a user performs a token operation, they pay **BOTH** fees:

### Example: Transfer 100 BTC Tokens

**Network Fee (in TST):**

```
Base: 0.00005 TST
Data: 256 bytes × 0.0000001 TST/byte = 0.0000256 TST
Total network fee: ~0.00008 TST
Goes to: System treasury
```

**Token Fee (in BTC token):**

```
Amount: 100 BTC
Fee rate: 0.001 (0.1%)
Token fee: 0.1 BTC
Goes to: Token treasury (defined by token creator)
```

**Total cost to sender:**

```
TST balance: -0.00008 TST (network fee)
BTC balance: -100.1 BTC (transfer + token fee)
```

**Received by recipient:**

```
BTC balance: +99.9 BTC (transfer - token fee)
```

**Received by treasuries:**

```
System treasury: +0.00008 TST
Token treasury: +0.1 BTC
```

---

## Why Two Fee Systems?

### Network Fees (TST)

**Purpose:**

- Pay heterogen operators for compute/storage
- Prevent spam (cost to use network)
- Sustain network infrastructure
- Fair resource allocation

**Characteristics:**

- Same for all tokens
- Predictable and stable
- Based on resource usage (bytes)
- Goes to system (not token creator)

### Token Fees

**Purpose:**

- Token sustainability (buy-backs, development)
- Governance treasury
- Reward mechanisms
- Token economics design

**Characteristics:**

- Set by token creator
- Different for each token
- Based on token amount (percentage)
- Goes to token treasury (controlled by creator)

---

## Fee Configuration in Genesis

### Network Parameters (Fixed)

**Location:** `parameters` section (top level)

```json
{
  "parameters": {
    "fees": {
      "base": "0.00005",
      "per_byte": "0.0000001",
      "raw_per_byte": "0.0000003",
      "currency": "TST" // ← System currency
    },
    "treasury_address": "gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo"
  }
}
```

**These are CONSTANTS** - same for all tokens on the network.

### Token Economics (Custom)

**Location:** `token.economics` section

```json
{
  "token": {
    "economics": {
      "supply": {
        "initial": "1000000",
        "mintingPolicy": "fixed",
        "max": "1000000"
      },
      "feeStructure": {
        "transfer": "0.001", // 0.1% transfer fee
        "mint": "0.001", // 0.1% minting fee
        "burn": "0.001" // 0.1% burning fee
      },
      "treasury": "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv",
      "distribution": [
        {
          "address": "gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu",
          "amount": "18.56"
        }
      ]
    }
  }
}
```

**These are CUSTOMIZABLE** - defined by you when creating the token.

---

## Fee Calculation Examples

### Example 1: NFT Transfer (No Token Fee)

```json
{
  "token": {
    "standard": "non-fungible",
    "economics": {
      "feeStructure": {
        "transfer": "0", // No token fee for NFT
        "mint": "0",
        "burn": "0"
      }
    }
  }
}
```

**Cost:**

- Network fee: ~0.00008 TST (only network cost)
- Token fee: 0 (NFT creator chose no fee)
- **Total: 0.00008 TST**

### Example 2: Stablecoin with Fee

```json
{
  "token": {
    "standard": "fungible",
    "metadata": {
      "symbol": "USDT",
      "decimals": 6
    },
    "economics": {
      "feeStructure": {
        "transfer": "0.002", // 0.2% fee
        "mint": "0",
        "burn": "0"
      },
      "treasury": "gStablecoinTreasury..."
    }
  }
}
```

**Transfer 1000 USDT:**

- Network fee: ~0.00008 TST
- Token fee: 1000 × 0.002 = 2 USDT
- **Total: 0.00008 TST + 2 USDT**
- **Recipient gets: 998 USDT**
- **Treasury gets: 2 USDT**

### Example 3: Governance Token

```json
{
  "token": {
    "standard": "fungible",
    "metadata": {
      "symbol": "GOV"
    },
    "economics": {
      "feeStructure": {
        "transfer": "0.005", // 0.5% fee (higher for governance)
        "mint": "0.01", // 1% minting fee
        "burn": "0" // No burn fee (encourage burning)
      },
      "treasury": "gGovernanceTreasury..."
    }
  }
}
```

**Mint 100 GOV:**

- Network fee: ~0.00008 TST
- Minting fee: 100 × 0.01 = 1 GOV
- **Total: 0.00008 TST + 1 GOV**
- **User receives: 99 GOV**
- **Treasury receives: 1 GOV**

---

## Fee Best Practices

### For Network Fees

You **cannot** change network fees—they are set at network level.

**User considerations:**

- Ensure users have TST balance for network fees
- Inform users about network costs upfront
- Batch operations to minimize per-transaction fees

### For Token Fees

You **can** customize token fees for your use case:

**No fees (0%):**

```json
{
  "feeStructure": {
    "transfer": "0",
    "mint": "0",
    "burn": "0"
  }
}
```

**Use for:**

- NFTs
- Community tokens
- Loyalty programs
- Simple transfers

**Low fees (0.1% - 1%):**

```json
{
  "feeStructure": {
    "transfer": "0.001", // 0.1%
    "mint": "0.005", // 0.5%
    "burn": "0"
  }
}
```

**Use for:**

- Stablecoins
- Utility tokens
- Payment tokens

**Higher fees (1% - 5%):**

```json
{
  "feeStructure": {
    "transfer": "0.01", // 1%
    "mint": "0.02", // 2%
    "burn": "0.005" // 0.5%
  }
}
```

**Use for:**

- Governance tokens
- Deflationary tokens
- Tokens with active treasury management

---

## Treasury Management

### System Treasury

**Address:** `gohgoWbJK7dMf5MUKKtthRJdCAMmoVqDMo`

- Receives ALL network fees (in TST)
- Controlled by network governance
- Used for network operations
- You cannot access this

### Token Treasury

**Address:** Your choice (set in `token.economics.treasury`)

- Receives YOUR token's fees
- Controlled by YOU (or governance contract)
- Used for token sustainability
- You define how it's used

**Example treasury addresses:**

```json
{
  "economics": {
    "treasury": "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv" // Your address
  }
}
```

**Common patterns:**

**1. Creator controlled:**

```json
"treasury": "gYourPersonalAddress..."
```

**2. Multi-sig:**

```json
"treasury": "gMultiSigContractAddress..."
```

**3. Burn address:**

```json
"treasury": "g000000000000000000000000000000"
```

**4. Smart contract:**

```json
"treasury": "gGovernanceContractAddress..."
```

---

## Economics Configuration

### Supply Configuration

```json
{
  "supply": {
    "initial": "1000000", // Initial supply
    "mintingPolicy": "fixed", // or "mintable" or "capped"
    "max": "1000000" // Max supply (for fixed/capped)
  }
}
```

**Minting policies:**

- **fixed**: No more tokens can be created (supply = initial)
- **mintable**: New tokens can be minted (infinite supply)
- **capped**: Tokens can be minted up to max (limited supply)

### Distribution

```json
{
  "distribution": [
    {
      "address": "gFounderAddress...",
      "amount": "100000"
    },
    {
      "address": "gTeamAddress...",
      "amount": "50000"
    }
  ]
}
```

**Rules:**

- Total distribution ≤ initial supply
- Each address can appear once
- Amounts must match token decimals
- Distribution happens at token activation

---

## Calculating Fees Programmatically

### In AMI Workers

```javascript
// Get network fee parameters
const params = await Stels.net.get(["network", "parameters"]);
const baseFee = parseFloat(params.value.raw.fees.base);
const perByteFee = parseFloat(params.value.raw.fees.per_byte);

// Calculate network fee for transaction
const txSize = 256; // bytes
const networkFee = baseFee + (perByteFee * txSize);

console.log(`Network fee: ${networkFee} TST`);

// Get token fee structure
const token = await Stels.net.get(["tokens", "BTC"]);
const transferFeeRate = parseFloat(
  token.value.raw.economics.feeStructure.transfer,
);

// Calculate token fee
const amount = 100; // BTC
const tokenFee = amount * transferFeeRate;
const recipientReceives = amount - tokenFee;

console.log(`Token fee: ${tokenFee} BTC`);
console.log(`Recipient receives: ${recipientReceives} BTC`);

// Total cost to sender
console.log(`Total cost: ${networkFee} TST + ${amount + tokenFee} BTC`);
```

### In UI Schemas

Display total cost to users:

```json
{
  "component": "div",
  "props": {
    "className": "p-4 bg-card rounded border"
  },
  "children": [
    {
      "component": "text",
      "data": "Transfer Cost",
      "props": {
        "className": "text-sm text-muted-foreground mb-2"
      }
    },
    {
      "component": "div",
      "props": {
        "className": "space-y-1"
      },
      "children": [
        {
          "component": "text",
          "data": "Network Fee: 0.00008 TST",
          "props": {
            "className": "text-xs"
          }
        },
        {
          "component": "text",
          "data": "Token Fee: 0.1 BTC (0.1%)",
          "props": {
            "className": "text-xs"
          }
        },
        {
          "component": "text",
          "data": "Recipient Gets: 99.9 BTC",
          "props": {
            "className": "text-sm font-bold text-green-500"
          }
        }
      ]
    }
  ]
}
```

---

## Fee Design Strategies

### Strategy 1: Zero Fees (Community Token)

**Use case:** Maximize adoption, community focus

```json
{
  "economics": {
    "feeStructure": {
      "transfer": "0",
      "mint": "0",
      "burn": "0"
    },
    "treasury": "g000000000000000000000000000000" // Burn address
  }
}
```

**Pros:**

- ✅ User-friendly (only network fees)
- ✅ Fast adoption
- ✅ Simple economics

**Cons:**

- ❌ No revenue for sustainability
- ❌ No deflationary pressure

### Strategy 2: Deflationary (Burn Fees)

**Use case:** Create scarcity, increase value over time

```json
{
  "economics": {
    "feeStructure": {
      "transfer": "0.001", // 0.1% burned on transfer
      "mint": "0.01", // 1% burned on mint
      "burn": "0" // Free burning
    },
    "treasury": "g000000000000000000000000000000" // Fees go to burn address
  }
}
```

**Pros:**

- ✅ Decreasing supply over time
- ✅ Value accrual to holders
- ✅ Encourages holding

**Cons:**

- ❌ Can discourage usage
- ❌ May reduce liquidity

### Strategy 3: Governance (Treasury Accumulation)

**Use case:** Fund development, governance, buy-backs

```json
{
  "economics": {
    "feeStructure": {
      "transfer": "0.002", // 0.2% to treasury
      "mint": "0.01", // 1% to treasury
      "burn": "0.005" // 0.5% to treasury
    },
    "treasury": "gGovernanceTreasury..." // Multi-sig governance address
  }
}
```

**Pros:**

- ✅ Sustainable funding
- ✅ Can fund development
- ✅ Can do buy-backs

**Cons:**

- ❌ Treasury control concerns
- ❌ Requires governance
- ❌ Higher user costs

---

## Advanced Economics

### Dynamic Fee Structures

While Genesis defines base fees, you can implement dynamic fees via AMI Workers:

```javascript
// Dynamic fee worker (adjusts based on conditions)
const baseTransferFee = 0.001; // 0.1%

// Get network activity
const volume = await Stels.net.get(["metrics", "volume", "24h"]);
const currentVolume = volume.value.raw.total;

// Reduce fee during high volume (encourage usage)
let adjustedFee = baseTransferFee;
if (currentVolume > 10000000) {
  adjustedFee = baseTransferFee * 0.5; // 50% discount
}

// Store adjusted fee
await Stels.net.set(["tokens", "BTC", "dynamic_fee"], {
  rate: adjustedFee,
  reason: "high_volume_discount",
  timestamp: Date.now(),
});
```

### Fee Redistribution

Use AMI Workers to redistribute treasury fees:

```javascript
// Weekly redistribution worker
const treasury = await Stels.net.get(["account", "balance", treasuryAddress]);
const balance = treasury.value.raw.BTC || 0;

// Distribute 50% to holders, keep 50% for development
const toHolders = balance * 0.5;
const toDevelopment = balance * 0.5;

// Get all token holders
const holders = await Stels.net.get(["tokens", "BTC", "holders"]);

// Calculate proportional distribution
for (const holder of holders.value.raw) {
  const share = (holder.balance / totalSupply) * toHolders;
  await distributeToHolder(holder.address, share);
}
```

---

## Token Standards and Default Fees

Different token standards have different default fee recommendations:

### Fungible Tokens

```json
{
  "standard": "fungible",
  "economics": {
    "feeStructure": {
      "transfer": "0.001", // 0.1% recommended
      "mint": "0.005", // 0.5% recommended
      "burn": "0" // Usually free
    }
  }
}
```

### Non-Fungible Tokens (NFT)

```json
{
  "standard": "non-fungible",
  "economics": {
    "feeStructure": {
      "transfer": "0", // Usually free (fixed item)
      "mint": "0.02", // 2% minting fee
      "burn": "0" // Free burning
    }
  }
}
```

### Wrapped Assets

```json
{
  "standard": "wrapped",
  "economics": {
    "feeStructure": {
      "transfer": "0.001", // 0.1% (match native)
      "mint": "0", // Free minting (1:1 wrap)
      "burn": "0" // Free unwrapping (1:1)
    }
  }
}
```

### Soulbound Tokens

```json
{
  "standard": "soulbound",
  "economics": {
    "feeStructure": {
      "transfer": "0", // No transfers (soulbound)
      "mint": "0", // Free minting
      "burn": "0" // Free burning
    }
  }
}
```

---

## Summary

### Network Fees (TST)

- ✅ Paid in system currency (TST)
- ✅ Go to system treasury
- ✅ Apply to all transactions
- ✅ Fixed by network
- ✅ Cannot be customized

### Token Fees

- ✅ Paid in the token itself
- ✅ Go to token treasury
- ✅ Apply only to this token
- ✅ Set by token creator
- ✅ Fully customizable

**Both fees are collected automatically by the network during transaction
execution.**

---

## Next Steps

- 🛠️ **[Creating Tokens](CREATING_TOKENS.md)** - Step-by-step token creation
- 🤖 **[Creating AMI Workers](CREATING_AMI_WORKERS.md)** - Implement fee logic
- 🎨 **[Building with Schemas](BUILDING_WITH_SCHEMAS.md)** - Display fees in UI
- 📚 **[API Reference](API_REFERENCE.md)** - Fee calculation APIs

---

_© 2025 Gliesereum Ukraine. All rights reserved._
