/**
 * Gliesereum validation utilities
 * Validation functions for transactions, signatures, and data formats
 */

import type {
	CosignMethod,
	CosignSignature,
	TransactionSignature,
	SmartOp,
} from "./types";

/**
 * Validates fee format
 */
export function validateFeeFormat(fee: string): boolean {
	return /^\d+\.\d{6}$/.test(fee) && parseFloat(fee) >= 0;
}

/**
 * Validates amount format
 */
export function validateAmountFormat(amount: string): boolean {
	return /^\d+\.\d{6}$/.test(amount) && parseFloat(amount) > 0;
}

/**
 * Validates raw data
 */
export function validateRawData(rawData: string): boolean {
	if (!rawData || typeof rawData !== "string") return false;
	return rawData.length > 0 && rawData.length <= 10000;
}

/**
 * Validates memo
 */
export function validateMemo(memo: string): boolean {
	if (!memo || typeof memo !== "string") return false;
	return memo.length > 0 && memo.length <= 256;
}

/**
 * Validates event kind
 */
export function validateEventKind(kind: string): boolean {
	if (!kind || typeof kind !== "string") return false;
	return /^[a-z][a-z0-9._-]*$/.test(kind) && kind.length <= 64;
}

/**
 * Validates event data
 */
export function validateEventData(data: Record<string, unknown>): boolean {
	if (!data || typeof data !== "object") return false;
	const str = JSON.stringify(data);
	return str.length <= 1024;
}

/**
 * Validates cosign method
 */
export function validateCosignMethod(method: CosignMethod): boolean {
	if (!method || typeof method !== "object") return false;
	if (method.type !== "cosign") return false;
	if (!method.id || typeof method.id !== "string") return false;
	if (method.id.length === 0 || method.id.length > 64) return false;

	if (method.threshold) {
		if (
			typeof method.threshold.k !== "number" ||
			typeof method.threshold.n !== "number"
		) {
			return false;
		}
		if (method.threshold.k <= 0 || method.threshold.n <= 0) return false;
		if (method.threshold.k > method.threshold.n) return false;
	}

	if (method.approvers) {
		if (!Array.isArray(method.approvers)) return false;
		if (method.approvers.length === 0) return false;
		for (const approver of method.approvers) {
			if (typeof approver !== "string" || approver.length !== 66) {
				return false;
			}
		}
	}

	if (method.deadline_ms !== undefined) {
		if (typeof method.deadline_ms !== "number") return false;
		if (method.deadline_ms <= Date.now()) return false;
	}

	return true;
}

/**
 * Validates cosign signature
 */
export function validateCosignSignature(cosig: CosignSignature): boolean {
	if (!cosig || typeof cosig !== "object") return false;

	if (!cosig.method_id || typeof cosig.method_id !== "string") {
		return false;
	}
	if (cosig.method_id.length === 0 || cosig.method_id.length > 64) {
		return false;
	}

	if (!cosig.kid || typeof cosig.kid !== "string") return false;
	if (cosig.kid.length !== 66) return false;

	if (cosig.alg !== "ecdsa-secp256k1") return false;

	if (!cosig.sig || typeof cosig.sig !== "string") return false;
	if (cosig.sig.length !== 128) return false;

	return true;
}

/**
 * Validates transaction signature
 */
export function validateTransactionSignature(
	sig: TransactionSignature,
): boolean {
	if (!sig || typeof sig !== "object") return false;

	if (!sig.kid || typeof sig.kid !== "string") return false;
	if (sig.kid.length !== 66) return false;

	if (sig.alg !== "ecdsa-secp256k1") return false;

	if (!sig.sig || typeof sig.sig !== "string") return false;
	if (sig.sig.length !== 128) return false;

	return true;
}

/**
 * Validates smart operation
 */
export function validateSmartOperation(op: SmartOp): boolean {
	if (!op || typeof op !== "object") return false;
	if (!op.op || typeof op.op !== "string") return false;

	switch (op.op) {
		case "transfer":
			if (!("to" in op) || typeof op.to !== "string") return false;
			if (op.to.length !== 34) return false;
			if (!("amount" in op) || typeof op.amount !== "string") {
				return false;
			}
			if (!validateAmountFormat(op.amount)) return false;
			if (op.memo !== undefined) {
				if (typeof op.memo !== "string" || !validateMemo(op.memo)) {
					return false;
				}
			}
			break;

		case "assert.time":
			if (op.before_ms !== undefined) {
				if (typeof op.before_ms !== "number" || op.before_ms <= 0) {
					return false;
				}
			}
			if (op.after_ms !== undefined) {
				if (typeof op.after_ms !== "number" || op.after_ms <= 0) {
					return false;
				}
			}
			if (
				op.before_ms !== undefined &&
				op.after_ms !== undefined &&
				op.after_ms >= op.before_ms
			) {
				return false;
			}
			break;

		case "assert.balance":
			if (!("address" in op) || typeof op.address !== "string") {
				return false;
			}
			if (op.address.length !== 34) return false;
			if (!("gte" in op) || typeof op.gte !== "string") return false;
			if (!validateAmountFormat(op.gte)) return false;
			break;

		case "assert.compare":
			if (!("left" in op) || typeof op.left !== "string") return false;
			if (!("cmp" in op) || typeof op.cmp !== "string") return false;
			if (!["<", "<=", "==", ">=", ">"].includes(op.cmp)) return false;
			if (!("right" in op) || typeof op.right !== "string") {
				return false;
			}
			break;

		case "emit.event":
			if (!("kind" in op) || typeof op.kind !== "string") return false;
			if (!validateEventKind(op.kind)) return false;
			if (op.data !== undefined) {
				if (
					typeof op.data !== "object" ||
					!validateEventData(op.data as Record<string, unknown>)
				) {
					return false;
				}
			}
			break;

		default:
			return false;
	}

	return true;
}

