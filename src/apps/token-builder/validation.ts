/**
 * Token Schema Validation
 * Validates token schemas according to STELS standards
 */

import type { TokenSchema, ValidationError } from "./types";

/**
 * Sanitize user input to prevent XSS and invalid characters
 * NOTE: Does NOT trim - trimming happens during validation only
 * @param input - Raw user input string
 * @returns Sanitized string safe for storage
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove HTML brackets
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .substring(0, 256); // Max length for safety
}

/**
 * Validate token schema according to STELS standards
 * Performs comprehensive validation of all required and optional fields
 * @param schema - Token schema to validate
 * @returns Array of validation errors (empty array if valid)
 */
export function validateTokenSchema(schema: TokenSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate version
  if (!schema.version) {
    errors.push({
      field: "version",
      message: "Version is required",
      code: "REQUIRED",
    });
  } else if (!/^\d+\.\d+\.\d+$/.test(schema.version)) {
    errors.push({
      field: "version",
      message: "Version must follow semver format (e.g., 1.0.0)",
      code: "INVALID_FORMAT",
    });
  }

  // Validate standard
  if (!schema.standard) {
    errors.push({
      field: "standard",
      message: "Token standard is required",
      code: "REQUIRED",
    });
  }

  // Validate metadata
  if (!schema.metadata) {
    errors.push({
      field: "metadata",
      message: "Metadata is required",
      code: "REQUIRED",
    });
  } else {
    errors.push(...validateMetadata(schema.metadata));
  }

  // Validate economics
  if (!schema.economics) {
    errors.push({
      field: "economics",
      message: "Economics configuration is required",
      code: "REQUIRED",
    });
  } else {
    errors.push(...validateEconomics(schema.economics));
  }

  // Validate governance if enabled
  // NOTE: Individual fields are optional - only validate if they have values
  if (schema.governance?.enabled) {
    errors.push(...validateGovernance(schema.governance));
  }

  // Validate transfer restrictions if enabled
  if (schema.transferRestrictions?.enabled) {
    errors.push(...validateTransferRestrictions(schema.transferRestrictions));
  }

  // Validate technical configuration
  if (schema.technical) {
    errors.push(...validateTechnical(schema.technical));
  }

  // Validate custom fields if present
  if (schema.customFields) {
    errors.push(...validateCustomFields(schema.customFields));
  }

  return errors;
}

/**
 * Validate metadata
 */
function validateMetadata(metadata: TokenSchema["metadata"]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate name (trim for validation only)
  const trimmedName = metadata.name?.trim() || "";
  if (!trimmedName || trimmedName.length === 0) {
    errors.push({
      field: "metadata.name",
      message: "Token name is required",
      code: "REQUIRED",
    });
  } else if (trimmedName.length > 64) {
    errors.push({
      field: "metadata.name",
      message: "Token name must be 64 characters or less",
      code: "MAX_LENGTH",
    });
  }

  // Validate symbol (trim for validation only)
  const trimmedSymbol = metadata.symbol?.trim().toUpperCase() || "";
  if (!trimmedSymbol || trimmedSymbol.length === 0) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol is required",
      code: "REQUIRED",
    });
  } else if (trimmedSymbol.length < 3) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol must be at least 3 characters",
      code: "MIN_LENGTH",
    });
  } else if (trimmedSymbol.length > 5) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol must be 5 characters or less",
      code: "MAX_LENGTH",
    });
  } else if (!/^[A-Z]+$/.test(trimmedSymbol)) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol must contain only uppercase letters (no numbers or special characters)",
      code: "INVALID_FORMAT",
    });
  }

  // CRITICAL: Validate decimals according to genesis.json requirements
  // TST currency requires decimals = 6 for fungible tokens
  // NFT tokens (non-fungible, semi-fungible, soulbound) can use decimals = 0
  if (metadata.decimals !== undefined) {
    if (metadata.decimals !== 6 && metadata.decimals !== 0) {
      errors.push({
        field: "metadata.decimals",
        message: "Decimals must be 6 (for fungible tokens) or 0 (for NFTs) according to genesis.json TST currency standard",
        code: "GENESIS_COMPLIANCE",
      });
    }
    
    if (metadata.decimals < 0 || metadata.decimals > 18) {
      errors.push({
        field: "metadata.decimals",
        message: "Decimals must be between 0 and 18",
        code: "OUT_OF_RANGE",
      });
    }
  } else {
    // Decimals is REQUIRED and must default to 6
    errors.push({
      field: "metadata.decimals",
      message: "Decimals is required and must be set to 6 (genesis.json compliance)",
      code: "REQUIRED",
    });
  }

  if (metadata.icon) {
    // Check if it's a Data URL, regular URL, or IPFS hash
    const isDataURL = metadata.icon.startsWith("data:");
    const isURL = isValidURL(metadata.icon);
    const isIPFS = isValidIPFSHash(metadata.icon);

    if (!isDataURL && !isURL && !isIPFS) {
      errors.push({
        field: "metadata.icon",
        message: "Icon must be a valid Data URL, URL, or IPFS hash",
        code: "INVALID_FORMAT",
      });
    }

    // Validate Data URL size (max 128KB)
    if (isDataURL) {
      const sizeInBytes = Math.ceil((metadata.icon.length * 3) / 4);
      const maxSizeInBytes = 128 * 1024; // 128KB

      if (sizeInBytes > maxSizeInBytes) {
        errors.push({
          field: "metadata.icon",
          message: `Icon size (${Math.round(sizeInBytes / 1024)}KB) exceeds maximum allowed size (128KB)`,
          code: "MAX_SIZE",
        });
      }
    }
  }

  // Validate description (optional but should be reasonable)
  if (metadata.description) {
    if (metadata.description.length > 500) {
      errors.push({
        field: "metadata.description",
        message: "Description must be 500 characters or less",
        code: "MAX_LENGTH",
      });
    }
    if (metadata.description.trim().length < 10) {
      errors.push({
        field: "metadata.description",
        message: "Description should be at least 10 characters",
        code: "MIN_LENGTH",
      });
    }
  }

  // Validate contact email (optional)
  if (metadata.contact) {
    if (!isValidEmail(metadata.contact)) {
      errors.push({
        field: "metadata.contact",
        message: "Invalid email format (example: user@domain.com)",
        code: "INVALID_FORMAT",
      });
    }
  }

  // Validate website URL (optional)
  if (metadata.website) {
    if (!isValidURL(metadata.website)) {
      errors.push({
        field: "metadata.website",
        message: "Invalid URL format (must start with http:// or https://)",
        code: "INVALID_FORMAT",
      });
    }
    if (metadata.website.length > 256) {
      errors.push({
        field: "metadata.website",
        message: "Website URL must be 256 characters or less",
        code: "MAX_LENGTH",
      });
    }
  }

  // Validate social links (optional)
  if (metadata.social) {
    if (metadata.social.twitter && !isValidURL(metadata.social.twitter)) {
      errors.push({
        field: "metadata.social.twitter",
        message: "Invalid Twitter URL",
        code: "INVALID_FORMAT",
      });
    }
    if (metadata.social.telegram && !isValidURL(metadata.social.telegram)) {
      errors.push({
        field: "metadata.social.telegram",
        message: "Invalid Telegram URL",
        code: "INVALID_FORMAT",
      });
    }
    if (metadata.social.discord && !isValidURL(metadata.social.discord)) {
      errors.push({
        field: "metadata.social.discord",
        message: "Invalid Discord URL",
        code: "INVALID_FORMAT",
      });
    }
  }

  // Validate tags (optional)
  if (metadata.tags && metadata.tags.length > 0) {
    if (metadata.tags.length > 10) {
      errors.push({
        field: "metadata.tags",
        message: "Maximum 10 tags allowed",
        code: "MAX_ITEMS",
      });
    }
    metadata.tags.forEach((tag, index) => {
      if (tag.length > 32) {
        errors.push({
          field: `metadata.tags[${index}]`,
          message: "Tag must be 32 characters or less",
          code: "MAX_LENGTH",
        });
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(tag)) {
        errors.push({
          field: `metadata.tags[${index}]`,
          message: "Tag can only contain letters, numbers, hyphens and underscores",
          code: "INVALID_FORMAT",
        });
      }
    });
  }

  return errors;
}

/**
 * Validate economics
 */
function validateEconomics(economics: TokenSchema["economics"]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!economics.supply) {
    errors.push({
      field: "economics.supply",
      message: "Supply configuration is required",
      code: "REQUIRED",
    });
    return errors;
  }

  // Validate initial supply
  if (!economics.supply.initial) {
    errors.push({
      field: "economics.supply.initial",
      message: "Initial supply is required",
      code: "REQUIRED",
    });
  } else if (!isValidAmount(economics.supply.initial)) {
    errors.push({
      field: "economics.supply.initial",
      message: "Initial supply must be a valid positive number",
      code: "INVALID_FORMAT",
    });
  }

  // Validate max supply
  if (economics.supply.max) {
    if (!isValidAmount(economics.supply.max)) {
      errors.push({
        field: "economics.supply.max",
        message: "Max supply must be a valid positive number",
        code: "INVALID_FORMAT",
      });
    } else if (
      parseFloat(economics.supply.max) < parseFloat(economics.supply.initial)
    ) {
      errors.push({
        field: "economics.supply.max",
        message: "Max supply must be greater than or equal to initial supply",
        code: "INVALID_VALUE",
      });
    }
  }

  // Validate distribution
  if (economics.distribution) {
    economics.distribution.forEach((dist, index) => {
      if (!isValidAddress(dist.address)) {
        errors.push({
          field: `economics.distribution[${index}].address`,
          message: "Invalid address format",
          code: "INVALID_FORMAT",
        });
      }
      if (!isValidAmount(dist.amount)) {
        errors.push({
          field: `economics.distribution[${index}].amount`,
          message: "Invalid amount format",
          code: "INVALID_FORMAT",
        });
      }
    });

    // Validate total distribution
    const totalDistribution = economics.distribution.reduce(
      (sum, dist) => sum + parseFloat(dist.amount),
      0,
    );
    const initialSupply = parseFloat(economics.supply.initial);

    if (totalDistribution > initialSupply) {
      errors.push({
        field: "economics.distribution",
        message: "Total distribution exceeds initial supply",
        code: "INVALID_VALUE",
      });
    }
  }

  // Validate fee structure (token fees, not network fees!)
  if (economics.feeStructure) {
    if (economics.feeStructure.transfer && economics.feeStructure.transfer.trim() !== "") {
      if (!isValidAmount(economics.feeStructure.transfer)) {
        errors.push({
          field: "economics.feeStructure.transfer",
          message: "Transfer fee must be a valid positive number",
          code: "INVALID_FORMAT",
        });
      }
      if (parseFloat(economics.feeStructure.transfer) > 100) {
        errors.push({
          field: "economics.feeStructure.transfer",
          message: "Transfer fee cannot exceed 100%",
          code: "OUT_OF_RANGE",
        });
      }
    }
    if (economics.feeStructure.mint && economics.feeStructure.mint.trim() !== "") {
      if (!isValidAmount(economics.feeStructure.mint)) {
        errors.push({
          field: "economics.feeStructure.mint",
          message: "Mint fee must be a valid positive number",
          code: "INVALID_FORMAT",
        });
      }
      if (parseFloat(economics.feeStructure.mint) > 100) {
        errors.push({
          field: "economics.feeStructure.mint",
          message: "Mint fee cannot exceed 100%",
          code: "OUT_OF_RANGE",
        });
      }
    }
    if (economics.feeStructure.burn && economics.feeStructure.burn.trim() !== "") {
      if (!isValidAmount(economics.feeStructure.burn)) {
        errors.push({
          field: "economics.feeStructure.burn",
          message: "Burn fee must be a valid positive number",
          code: "INVALID_FORMAT",
        });
      }
      if (parseFloat(economics.feeStructure.burn) > 100) {
        errors.push({
          field: "economics.feeStructure.burn",
          message: "Burn fee cannot exceed 100%",
          code: "OUT_OF_RANGE",
        });
      }
    }
  }

  // Validate treasury address (token treasury, not network treasury!)
  if (economics.treasury && economics.treasury.trim() !== "") {
    if (!isValidAddress(economics.treasury)) {
      errors.push({
        field: "economics.treasury",
        message: "Invalid treasury address format (must be valid base58 address)",
        code: "INVALID_FORMAT",
      });
    }
  }

  // Validate burn rate
  if (economics.supply.burnRate !== undefined) {
    const burnRate = parseFloat(economics.supply.burnRate.toString());
    if (isNaN(burnRate) || burnRate < 0 || burnRate > 100) {
      errors.push({
        field: "economics.supply.burnRate",
        message: "Burn rate must be between 0 and 100%",
        code: "OUT_OF_RANGE",
      });
    }
  }

  // Validate minting policy
  if (!economics.supply.mintingPolicy) {
    errors.push({
      field: "economics.supply.mintingPolicy",
      message: "Minting policy is required",
      code: "REQUIRED",
    });
  } else {
    // If minting policy is 'fixed', max supply should equal initial supply
    if (economics.supply.mintingPolicy === "fixed" && economics.supply.max) {
      if (economics.supply.max !== economics.supply.initial) {
        errors.push({
          field: "economics.supply.max",
          message: "For fixed supply, max supply must equal initial supply",
          code: "INVALID_VALUE",
        });
      }
    }
  }

  return errors;
}

/**
 * Validate governance
 */
function validateGovernance(
  governance: NonNullable<TokenSchema["governance"]>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Skip validation if governance is enabled but all fields are empty
  const hasAnyData = 
    (governance.proposalThreshold && governance.proposalThreshold.trim() !== "") ||
    (governance.quorumThreshold && governance.quorumThreshold.trim() !== "") ||
    (governance.votingPeriod !== undefined && governance.votingPeriod > 0);
  
  // If governance is enabled but no data provided, it's OK (all fields are optional)
  if (!hasAnyData) {
    return errors;
  }

  if (governance.proposalThreshold && governance.proposalThreshold.trim() !== "") {
    if (!isValidAmount(governance.proposalThreshold)) {
      errors.push({
        field: "governance.proposalThreshold",
        message: "Proposal threshold must be a valid positive number",
        code: "INVALID_FORMAT",
      });
    }
  }

  if (governance.quorumThreshold && governance.quorumThreshold.trim() !== "") {
    if (!isValidAmount(governance.quorumThreshold)) {
      errors.push({
        field: "governance.quorumThreshold",
        message: "Quorum threshold must be a valid positive number",
        code: "INVALID_FORMAT",
      });
    }
  }

  if (governance.votingPeriod !== undefined && governance.votingPeriod > 0) {
    // votingPeriod is valid, no error
  } else if (governance.votingPeriod !== undefined && governance.votingPeriod <= 0) {
    errors.push({
      field: "governance.votingPeriod",
      message: "Voting period must be greater than 0",
      code: "INVALID_VALUE",
    });
  }

  return errors;
}

/**
 * Validate technical configuration
 */
function validateTechnical(
  technical: NonNullable<TokenSchema["technical"]>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!technical.network) {
    errors.push({
      field: "technical.network",
      message: "Network name is required",
      code: "REQUIRED",
    });
  }

  if (technical.chainId === undefined || technical.chainId < 0) {
    errors.push({
      field: "technical.chainId",
      message: "Valid chain ID is required",
      code: "REQUIRED",
    });
  }

  if (!technical.protocol) {
    errors.push({
      field: "technical.protocol",
      message: "Protocol version is required",
      code: "REQUIRED",
    });
  }

  return errors;
}

/**
 * Helper: Validate amount string
 */
function isValidAmount(amount: string): boolean {
  return /^\d+(?:\.\d{1,18})?$/.test(amount) && parseFloat(amount) > 0;
}

/**
 * Helper: Validate address format (STELS base58)
 */
function isValidAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{24,128}$/.test(address);
}

/**
 * Helper: Validate URL
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Validate IPFS hash
 */
function isValidIPFSHash(hash: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{56}/.test(hash);
}

/**
 * Validate transfer restrictions
 */
function validateTransferRestrictions(
  restrictions: NonNullable<TokenSchema["transferRestrictions"]>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate timelock
  if (restrictions.timelock !== undefined) {
    if (restrictions.timelock < 0) {
      errors.push({
        field: "transferRestrictions.timelock",
        message: "Timelock period cannot be negative",
        code: "INVALID_VALUE",
      });
    }
    // Check reasonable maximum (e.g., 1 year = 365 * 24 * 60 * 60 * 1000 ms)
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (restrictions.timelock > oneYearMs) {
      errors.push({
        field: "transferRestrictions.timelock",
        message: "Timelock period cannot exceed 1 year",
        code: "OUT_OF_RANGE",
      });
    }
  }

  // Validate whitelist addresses if present
  if (restrictions.whitelist && restrictions.whitelist.length > 0) {
    if (restrictions.whitelist.length > 1000) {
      errors.push({
        field: "transferRestrictions.whitelist",
        message: "Whitelist cannot exceed 1000 addresses",
        code: "MAX_ITEMS",
      });
    }
    restrictions.whitelist.forEach((address, index) => {
      if (!isValidAddress(address)) {
        errors.push({
          field: `transferRestrictions.whitelist[${index}]`,
          message: "Invalid whitelist address format",
          code: "INVALID_FORMAT",
        });
      }
    });
  }

  // Validate blacklist addresses if present
  if (restrictions.blacklist && restrictions.blacklist.length > 0) {
    if (restrictions.blacklist.length > 1000) {
      errors.push({
        field: "transferRestrictions.blacklist",
        message: "Blacklist cannot exceed 1000 addresses",
        code: "MAX_ITEMS",
      });
    }
    restrictions.blacklist.forEach((address, index) => {
      if (!isValidAddress(address)) {
        errors.push({
          field: `transferRestrictions.blacklist[${index}]`,
          message: "Invalid blacklist address format",
          code: "INVALID_FORMAT",
        });
      }
    });
  }

  return errors;
}

/**
 * Validate custom fields
 */
function validateCustomFields(
  customFields: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Limit number of custom fields
  const fieldCount = Object.keys(customFields).length;
  if (fieldCount > 50) {
    errors.push({
      field: "customFields",
      message: "Maximum 50 custom fields allowed",
      code: "MAX_ITEMS",
    });
  }

  // Validate each custom field
  Object.entries(customFields).forEach(([key, value]) => {
    // Validate key format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      errors.push({
        field: `customFields.${key}`,
        message: "Custom field key must start with letter or underscore and contain only alphanumeric characters and underscores",
        code: "INVALID_FORMAT",
      });
    }
    if (key.length > 64) {
      errors.push({
        field: `customFields.${key}`,
        message: "Custom field key must be 64 characters or less",
        code: "MAX_LENGTH",
      });
    }

    // Validate value size (prevent extremely large values)
    const valueStr = JSON.stringify(value);
    if (valueStr.length > 10000) {
      errors.push({
        field: `customFields.${key}`,
        message: "Custom field value is too large (max 10KB)",
        code: "MAX_SIZE",
      });
    }

    // Check for dangerous patterns in string values
    if (typeof value === "string") {
      if (/<script|javascript:|onerror=/i.test(value)) {
        errors.push({
          field: `customFields.${key}`,
          message: "Custom field value contains potentially dangerous content",
          code: "SECURITY_RISK",
        });
      }
    }
  });

  return errors;
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 128;
}

