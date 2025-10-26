/**
 * Token Builder Types
 * Type definitions for Web Token creation in STELS network
 */

/**
 * Token standard types supported by STELS network
 */
export type TokenStandard =
  | "fungible" // Standard fungible token (like ERC-20)
  | "non-fungible" // Non-fungible token (like ERC-721)
  | "semi-fungible" // Semi-fungible token (like ERC-1155)
  | "soulbound" // Non-transferable token
  | "wrapped" // Wrapped asset token
  | "governance" // Governance token with voting rights
  | "utility" // Utility token for services
  | "security" // Security token (regulated)
  | "custom"; // Custom token with arbitrary schema

/**
 * Token metadata standard
 */
export type MetadataStandard = "json" | "ipfs" | "arweave" | "custom";

/**
 * Token minting policy
 */
export type MintingPolicy =
  | "fixed" // Fixed supply, no minting after genesis
  | "mintable" // Can mint new tokens
  | "burnable" // Can burn tokens
  | "mintable-burnable"; // Both minting and burning allowed

/**
 * Token transfer restrictions
 */
export interface TransferRestrictions {
  enabled: boolean;
  whitelist?: string[]; // Addresses allowed to transfer
  blacklist?: string[]; // Addresses restricted from transfers
  timelock?: number; // Timelock in milliseconds
  maxAmount?: string; // Max amount per transfer
}

/**
 * Token governance settings
 */
export interface GovernanceSettings {
  enabled: boolean;
  votingPower?: "balance" | "quadratic" | "custom";
  proposalThreshold?: string; // Min tokens to create proposal
  quorumThreshold?: string; // Min votes for valid proposal
  votingPeriod?: number; // Voting period in milliseconds
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  decimals?: number;
  icon?: string; // Data URL (base64), URL, or IPFS hash - max 128KB
  website?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  tags?: string[];
}

/**
 * Token supply configuration
 */
export interface SupplyConfig {
  initial: string; // Initial supply
  max?: string; // Maximum supply (if capped)
  mintingPolicy: MintingPolicy;
  burnRate?: string; // Burn rate percentage (if applicable)
}

/**
 * Token economics
 */
export interface TokenEconomics {
  supply: SupplyConfig;
  distribution?: Array<{
    address: string;
    amount: string;
    vesting?: {
      cliff: number; // Cliff period in ms
      duration: number; // Total vesting duration in ms
      release: "linear" | "step"; // Release schedule
    };
  }>;
  treasury?: string; // Treasury address
  feeStructure?: {
    transfer?: string; // Transfer fee percentage
    mint?: string; // Minting fee
    burn?: string; // Burning fee
  };
}

/**
 * Token schema (JSON Schema compatible)
 */
export interface TokenSchema {
  $schema?: string;
  version: string;
  standard: TokenStandard;
  metadata: TokenMetadata;
  economics: TokenEconomics;
  transferRestrictions?: TransferRestrictions;
  governance?: GovernanceSettings;
  customFields?: Record<string, unknown>;
  technical?: {
    network: string;
    chainId: number;
    protocol: string;
    encoding?: string;
    hashAlgorithm?: string;
  };
}

/**
 * Token genesis certificate (final signed document)
 */
export interface TokenGenesisCertificate {
  id: string; // Unique token ID
  createdAt: string; // ISO timestamp
  activationTime?: string; // When token becomes active
  issuer: {
    address: string;
    publicKey: string;
    org?: string;
    contact?: string;
  };
  schema: TokenSchema;
  content: {
    hashAlg: string;
    hash: string;
    size: number;
  };
  signatures: Array<{
    kid: string;
    alg: string;
    sig: string;
  }>;
  signDomain: string[];
}

/**
 * Wizard step state
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  valid: boolean;
}

/**
 * Token builder state
 */
export interface TokenBuilderState {
  currentStep: number;
  steps: WizardStep[];
  schema: Partial<TokenSchema>;
  certificate?: TokenGenesisCertificate;
  certificateHistory: TokenGenesisCertificate[]; // History of created certificates
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Token template
 */
export interface TokenTemplate {
  id: string;
  name: string;
  description: string;
  standard: TokenStandard;
  icon?: string;
  schema: Partial<TokenSchema>;
  popular?: boolean;
}

/**
 * Export formats
 */
export type ExportFormat = "json" | "yaml" | "toml" | "typescript";

/**
 * Token builder actions
 */
export interface TokenBuilderActions {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateSchema: (schema: Partial<TokenSchema>) => void;
  updateMetadata: (metadata: Partial<TokenMetadata>) => void;
  updateEconomics: (economics: Partial<TokenEconomics>) => void;
  updateGovernance: (governance: Partial<GovernanceSettings>) => void;
  validateSchema: () => ValidationError[];
  signSchema: (privateKey: string) => Promise<TokenGenesisCertificate>;
  resetBuilder: () => void;
  loadTemplate: (template: TokenTemplate) => void;
  exportSchema: (format: ExportFormat) => string;
}

/**
 * Combined store type
 */
export type TokenBuilderStore = TokenBuilderState & TokenBuilderActions;

