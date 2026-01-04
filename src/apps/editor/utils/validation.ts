/**
 * Validation utilities for Editor
 */

/**
 * Validate dependencies array
 * @param dependencies - Array of dependency strings
 * @returns Validation result with error message if invalid
 */
export function validateDependencies(
	dependencies: string[],
): { valid: boolean; error?: string } {
	// Check for empty strings
	if (dependencies.some((dep) => !dep.trim())) {
		return {
			valid: false,
			error: "Dependencies cannot contain empty values",
		};
	}

	// Check for duplicates
	const uniqueDeps = new Set(dependencies.map((d) => d.trim().toLowerCase()));
	if (uniqueDeps.size !== dependencies.length) {
		return {
			valid: false,
			error: "Dependencies cannot contain duplicates",
		};
	}

	// Check for invalid characters (alphanumeric, dash, underscore only)
	const invalidChars = /[^a-zA-Z0-9\-_]/;
	if (dependencies.some((dep) => invalidChars.test(dep.trim()))) {
		return {
			valid: false,
			error: "Dependencies can only contain letters, numbers, dashes, and underscores",
		};
	}

	// Check length (reasonable limit)
	if (dependencies.some((dep) => dep.trim().length > 50)) {
		return {
			valid: false,
			error: "Dependency names cannot exceed 50 characters",
		};
	}

	return { valid: true };
}

/**
 * Validate version string
 * @param version - Version string (e.g., "1.19.2")
 * @returns Validation result with error message if invalid
 */
export function validateVersion(version: string): { valid: boolean; error?: string } {
	if (!version.trim()) {
		return {
			valid: false,
			error: "Version is required",
		};
	}

	// Basic version format check (semver-like: x.y.z or x.y)
	const versionPattern = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9-]+)?$/;
	if (!versionPattern.test(version.trim())) {
		return {
			valid: false,
			error: "Version must be in format x.y.z or x.y (e.g., 1.19.2)",
		};
	}

	return { valid: true };
}

/**
 * Validate node ID format
 * @param nid - Node ID string (e.g., "s-0001")
 * @returns Validation result with error message if invalid
 */
export function validateNodeId(nid: string): { valid: boolean; error?: string } {
	if (!nid.trim()) {
		return { valid: true }; // Optional field
	}

	// Check format: s-XXXX or similar
	const nodeIdPattern = /^[a-z]-[a-zA-Z0-9-]+$/;
	if (!nodeIdPattern.test(nid.trim())) {
		return {
			valid: false,
			error: "Node ID must be in format: prefix-id (e.g., s-0001)",
		};
	}

	return { valid: true };
}

/**
 * Validate account ID format
 * @param accountId - Account ID string (e.g., "g-bhts")
 * @returns Validation result with error message if invalid
 */
export function validateAccountId(
	accountId: string,
): { valid: boolean; error?: string } {
	if (!accountId.trim()) {
		return { valid: true }; // Optional field
	}

	// Check format: g-XXXX or similar
	const accountIdPattern = /^[a-z]-[a-zA-Z0-9-]+$/;
	if (!accountIdPattern.test(accountId.trim())) {
		return {
			valid: false,
			error: "Account ID must be in format: prefix-id (e.g., g-bhts)",
		};
	}

	return { valid: true };
}
