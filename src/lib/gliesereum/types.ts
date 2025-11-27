/**
 * Gliesereum type definitions
 * Core types and interfaces for the Gliesereum blockchain
 */

/**
 * Wallet structure
 */
export interface Wallet {
	readonly publicKey: string;
	readonly privateKey: string;
	readonly address: string;
	readonly biometric?: string | null;
	readonly number: string;
}

/**
 * Smart operation types
 */
export type SmartOp =
	| {
		op: "transfer";
		to: string;
		amount: string;
		memo?: string;
	}
	| {
		op: "assert.time";
		before_ms?: number;
		after_ms?: number;
	}
	| {
		op: "assert.balance";
		address: string;
		gte: string;
	}
	| {
		op: "assert.compare";
		left: string;
		cmp: "<" | "<=" | "==" | ">=" | ">";
		right: string;
	}
	| {
		op: "emit.event";
		kind: string;
		data?: Record<string, unknown>;
	};

/**
 * Cosign method configuration
 */
export interface CosignMethod {
	id: string;
	type: "cosign";
	threshold?: {
		k: number;
		n: number;
	};
	approvers?: string[];
	deadline_ms?: number;
}

/**
 * Cosign signature
 */
export interface CosignSignature {
	method_id: string;
	kid: string;
	alg: "ecdsa-secp256k1";
	sig: string;
}

/**
 * Transaction signature
 */
export interface TransactionSignature {
	kid: string;
	alg: "ecdsa-secp256k1";
	sig: string;
}

/**
 * Basic transaction structure
 */
export type Transaction = {
	from: {
		address: string;
		publicKey: string;
		number: string;
	};
	to: string;
	amount: number;
	fee: number;
	timestamp: number;
	hash: string;
	status?: "pending" | "confirmed" | "failed";
	verified?: boolean;
	validators: string[];
	signature?: string;
	data?: string;
};

/**
 * Smart transaction structure
 */
export interface SmartTransaction {
	type: "smart";
	method: "smart.exec";
	args: {
		ops: SmartOp[];
		memo?: string;
	};
	from: string;
	fee: string;
	currency: string;
	prev_hash: string | null;
	timestamp: number;
	signatures: TransactionSignature[];
	raw?: string;
	raw_encoding?: "utf8";
	raw_sha256?: string;
	methods?: CosignMethod[];
	cosigs?: CosignSignature[];
}

/**
 * Gliesereum library interface
 */
export interface Gliesereum {
	// Basic Wallet functions
	cardNumber(
		input: string | Uint8Array,
		prefix?: string,
		secretKey?: string | Uint8Array,
	): string;
	createWallet(): Wallet;
	importWallet(privateKey: string): Wallet;

	// Address functions
	validateAddress(address: string): boolean;
	getAddress(bytes: Uint8Array): string;

	// Basic transaction functions
	createSignedTransaction(
		wallet: Wallet,
		to: string,
		amount: number,
		fee: number,
		data?: string,
	): Transaction;
	validateTransaction(tx: Transaction): boolean;

	// Smart transaction functions
	createSmartTransaction(
		wallet: Wallet,
		ops: SmartOp[],
		fee?: string,
		memo?: string,
		prevHash?: string | null,
		rawData?: string,
	): SmartTransaction;
	validateSmartTransaction(tx: SmartTransaction): boolean;
	validateSmartOperation(op: SmartOp): boolean;
	calculateSmartTransactionFee(
		ops: SmartOp[],
		rawBytes?: number,
		baseFee?: string,
	): string;

	// Cosign functions
	createCosignMethod(
		id: string,
		approvers: string[],
		threshold: { k: number; n: number },
		deadlineMs?: number,
	): CosignMethod;
	createCosignSignature(
		methodId: string,
		publicKey: string,
		privateKey: string,
		transaction: SmartTransaction,
	): CosignSignature;
	signWithDomain(
		data: string,
		privateKey: string,
		domain: string[],
	): string;

	// Cryptographic functions
	sign(data: string, privateKey: string): string;
	verify(data: string, signature: string, publicKey: string): boolean;

	// Validation functions
	validateCosignMethod(method: CosignMethod): boolean;
	validateCosignSignature(cosig: CosignSignature): boolean;
	validateTransactionSignature(sig: TransactionSignature): boolean;
	validateFeeFormat(fee: string): boolean;
	validateAmountFormat(amount: string): boolean;
	validateRawData(rawData: string): boolean;
	validateMemo(memo: string): boolean;
	validateEventKind(kind: string): boolean;
	validateEventData(data: Record<string, unknown>): boolean;
	getAddressFromPublicKey(publicKey: string): string;
	verifyPublicKeyAddress(publicKey: string, address: string): boolean;
}
