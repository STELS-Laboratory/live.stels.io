/**
 * Token Templates
 * Pre-configured templates for common token types
 */

import type { TokenTemplate } from "./types";

/**
 * Built-in token templates
 */
export const TOKEN_TEMPLATES: TokenTemplate[] = [
  {
    id: "fungible-standard",
    name: "Standard Fungible Token",
    description: "Classic ERC-20 style token for currencies and utility",
    standard: "fungible",
    popular: true,
    icon: "🪙",
    schema: {
      standard: "fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "A standard fungible token",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "1000000",
          mintingPolicy: "fixed",
        },
      },
    },
  },
  {
    id: "governance-token",
    name: "Governance Token",
    description: "Token with built-in voting and governance capabilities",
    standard: "governance",
    popular: true,
    icon: "🗳️",
    schema: {
      standard: "governance",
      metadata: {
        name: "",
        symbol: "",
        description: "Governance token with voting rights",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "1000000",
          mintingPolicy: "fixed",
        },
      },
      governance: {
        enabled: true,
        votingPower: "balance",
        proposalThreshold: "10000",
        quorumThreshold: "100000",
        votingPeriod: 604800000, // 7 days
      },
    },
  },
  {
    id: "utility-token",
    name: "Utility Token",
    description: "Token for accessing services and features",
    standard: "utility",
    popular: true,
    icon: "🔧",
    schema: {
      standard: "utility",
      metadata: {
        name: "",
        symbol: "",
        description: "Utility token for platform services",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "10000000",
          mintingPolicy: "mintable-burnable",
        },
        feeStructure: {
          transfer: "0.001",
        },
      },
    },
  },
  {
    id: "nft-collection",
    name: "NFT Collection",
    description: "Non-fungible token collection (ERC-721 style)",
    standard: "non-fungible",
    icon: "🎨",
    schema: {
      standard: "non-fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "Non-fungible token collection",
        decimals: 0,
      },
      economics: {
        supply: {
          initial: "0",
          max: "10000",
          mintingPolicy: "mintable",
        },
      },
    },
  },
  {
    id: "soulbound-token",
    name: "Soulbound Token",
    description: "Non-transferable achievement or identity token",
    standard: "soulbound",
    icon: "🎖️",
    schema: {
      standard: "soulbound",
      metadata: {
        name: "",
        symbol: "",
        description: "Non-transferable identity token",
        decimals: 0,
      },
      economics: {
        supply: {
          initial: "0",
          mintingPolicy: "mintable",
        },
      },
      transferRestrictions: {
        enabled: true,
      },
    },
  },
  {
    id: "wrapped-asset",
    name: "Wrapped Asset",
    description: "Wrapped representation of an external asset",
    standard: "wrapped",
    icon: "📦",
    schema: {
      standard: "wrapped",
      metadata: {
        name: "",
        symbol: "",
        description: "Wrapped asset token",
        decimals: 8,
      },
      economics: {
        supply: {
          initial: "0",
          mintingPolicy: "mintable-burnable",
        },
      },
    },
  },
  {
    id: "security-token",
    name: "Security Token",
    description: "Regulated security token with compliance features",
    standard: "security",
    icon: "🛡️",
    schema: {
      standard: "security",
      metadata: {
        name: "",
        symbol: "",
        description: "Compliant security token",
        decimals: 2,
      },
      economics: {
        supply: {
          initial: "1000000",
          max: "10000000",
          mintingPolicy: "mintable",
        },
      },
      transferRestrictions: {
        enabled: true,
        timelock: 86400000, // 24 hours
      },
    },
  },
  {
    id: "semi-fungible",
    name: "Semi-Fungible Token",
    description: "Hybrid token (ERC-1155 style) for gaming and collectibles",
    standard: "semi-fungible",
    icon: "🎮",
    schema: {
      standard: "semi-fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "Semi-fungible token collection",
        decimals: 0,
      },
      economics: {
        supply: {
          initial: "0",
          mintingPolicy: "mintable-burnable",
        },
      },
    },
  },
  {
    id: "vesting-token",
    name: "Vesting Token",
    description: "Token with built-in vesting schedules",
    standard: "fungible",
    icon: "⏳",
    schema: {
      standard: "fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "Token with vesting schedule",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "10000000",
          mintingPolicy: "fixed",
        },
        distribution: [
          {
            address: "",
            amount: "3000000",
            vesting: {
              cliff: 15552000000, // 180 days
              duration: 63072000000, // 2 years
              release: "linear",
            },
          },
        ],
      },
    },
  },
  {
    id: "deflationary-token",
    name: "Deflationary Token",
    description: "Token with automatic burning mechanism",
    standard: "fungible",
    icon: "🔥",
    schema: {
      standard: "fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "Deflationary token with burn mechanism",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "100000000",
          mintingPolicy: "burnable",
          burnRate: "0.01", // 1% per transaction
        },
        feeStructure: {
          transfer: "0.01",
          burn: "0.01",
        },
      },
    },
  },
];

/**
 * Get template by ID
 * Retrieves a specific token template
 * 
 * @param id - Unique template identifier
 * @returns Token template if found, undefined otherwise
 */
export function getTemplate(id: string): TokenTemplate | undefined {
  return TOKEN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get popular templates
 * Returns templates marked as popular for quick access
 * 
 * @returns Array of popular token templates
 */
export function getPopularTemplates(): TokenTemplate[] {
  return TOKEN_TEMPLATES.filter((t) => t.popular);
}

/**
 * Get templates by token standard
 * Filter templates by their token standard type
 * 
 * @param standard - Token standard to filter by (e.g., "fungible", "nft")
 * @returns Array of templates matching the standard
 */
export function getTemplatesByStandard(
  standard: string,
): TokenTemplate[] {
  return TOKEN_TEMPLATES.filter((t) => t.schema.standard === standard);
}

