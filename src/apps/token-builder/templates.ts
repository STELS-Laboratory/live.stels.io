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
    description: "Classic fungible token for currencies, rewards, and utility",
    standard: "fungible",
    popular: true,
    icon: "🪙",
    schema: {
      standard: "fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "Standard fungible token for general purpose use",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "100000000",
          mintingPolicy: "fixed",
        },
      },
    },
  },
  {
    id: "governance-token",
    name: "Governance Token",
    description: "DAO governance token with voting rights and proposal mechanisms",
    standard: "governance",
    popular: true,
    icon: "🗳️",
    schema: {
      standard: "governance",
      metadata: {
        name: "",
        symbol: "",
        description: "Governance token with voting and proposal rights",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "50000000",
          mintingPolicy: "fixed",
        },
      },
      governance: {
        enabled: true,
        votingPower: "balance",
        proposalThreshold: "100000",
        quorumThreshold: "5000000",
        votingPeriod: 604800000, // 7 days
      },
    },
  },
  {
    id: "utility-token",
    name: "Utility Token",
    description: "Platform utility token for accessing services and features",
    standard: "utility",
    popular: true,
    icon: "🔧",
    schema: {
      standard: "utility",
      metadata: {
        name: "",
        symbol: "",
        description: "Utility token for platform services and features",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "500000000",
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
    description: "Unique digital collectibles and art NFTs",
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
    description: "Wrapped representation of external blockchain assets",
    standard: "wrapped",
    icon: "📦",
    schema: {
      standard: "wrapped",
      metadata: {
        name: "",
        symbol: "",
        description: "Wrapped asset token",
        decimals: 6,
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
    description: "Regulated security token for digital securities and assets",
    standard: "security",
    icon: "🛡️",
    schema: {
      standard: "security",
      metadata: {
        name: "",
        symbol: "",
        description: "Security token with compliance features",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "10000000",
          max: "100000000",
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
    description: "Token with built-in time-locked vesting schedules",
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
          initial: "100000000",
          mintingPolicy: "fixed",
        },
        distribution: [
          {
            address: "",
            amount: "30000000",
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
    description: "Self-reducing supply token with automatic burn mechanism",
    standard: "fungible",
    icon: "🔥",
    schema: {
      standard: "fungible",
      metadata: {
        name: "",
        symbol: "",
        description: "Deflationary token with automatic burn mechanism",
        decimals: 6,
      },
      economics: {
        supply: {
          initial: "1000000000",
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

