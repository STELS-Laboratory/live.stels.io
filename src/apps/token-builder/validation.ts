/**
 * Token Schema Validation
 * Validates token schemas according to STELS standards
 */

import type { TokenSchema, ValidationError } from "./types";

/**
 * Sanitize user input to prevent XSS and invalid characters
 * @param input - Raw user input string
 * @returns Sanitized string safe for storage
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
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
  if (schema.governance?.enabled) {
    errors.push(...validateGovernance(schema.governance));
  }

  // Validate technical configuration
  if (schema.technical) {
    errors.push(...validateTechnical(schema.technical));
  }

  return errors;
}

/**
 * Validate metadata
 */
function validateMetadata(metadata: TokenSchema["metadata"]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!metadata.name || metadata.name.trim().length === 0) {
    errors.push({
      field: "metadata.name",
      message: "Token name is required",
      code: "REQUIRED",
    });
  } else if (metadata.name.length > 64) {
    errors.push({
      field: "metadata.name",
      message: "Token name must be 64 characters or less",
      code: "MAX_LENGTH",
    });
  }

  if (!metadata.symbol || metadata.symbol.trim().length === 0) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol is required",
      code: "REQUIRED",
    });
  } else if (metadata.symbol.length > 12) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol must be 12 characters or less",
      code: "MAX_LENGTH",
    });
  } else if (!/^[A-Z0-9]+$/.test(metadata.symbol)) {
    errors.push({
      field: "metadata.symbol",
      message: "Token symbol must contain only uppercase letters and numbers",
      code: "INVALID_FORMAT",
    });
  }

  if (metadata.decimals !== undefined) {
    if (metadata.decimals < 0 || metadata.decimals > 18) {
      errors.push({
        field: "metadata.decimals",
        message: "Decimals must be between 0 and 18",
        code: "OUT_OF_RANGE",
      });
    }
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

  return errors;
}

/**
 * Validate governance
 */
function validateGovernance(
  governance: NonNullable<TokenSchema["governance"]>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (governance.proposalThreshold) {
    if (!isValidAmount(governance.proposalThreshold)) {
      errors.push({
        field: "governance.proposalThreshold",
        message: "Proposal threshold must be a valid positive number",
        code: "INVALID_FORMAT",
      });
    }
  }

  if (governance.quorumThreshold) {
    if (!isValidAmount(governance.quorumThreshold)) {
      errors.push({
        field: "governance.quorumThreshold",
        message: "Quorum threshold must be a valid positive number",
        code: "INVALID_FORMAT",
      });
    }
  }

  if (governance.votingPeriod !== undefined && governance.votingPeriod <= 0) {
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

