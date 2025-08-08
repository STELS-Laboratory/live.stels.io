import type { ReactElement } from "react";
import Screen from "@/routes/main/Screen.tsx";
import Header from "@/components/main/Header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function CodeBlock({ children }: { children: string }): ReactElement {
	return (
		<pre className="mt-2 w-full overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-200">
      <code>{children}</code>
		</pre>
	);
}

/**
 * Developer documentation for Gliesereum wallet protocol and reference API.
 * The goal is to describe the algorithms precisely so developers can
 * implement the same functionality in any programming language.
 */
function DocksWallet(): ReactElement {
	return (
		<Screen>
			<div className="space-y-4">
				<Header
					title="Gliesereum Wallet Protocol"
					description="Deterministic address format, signing/verification, and utility primitives."
				/>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">Overview</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<p>
							Gliesereum is a lightweight cryptographic wallet protocol based on
							secp256k1. It defines how to generate keys, derive user addresses,
							sign and verify messages, and produce deterministic identifiers.
						</p>
						<p>
							Official package (JSR):{"  "}
							<a
								href="https://jsr.io/@stels/gliesereum"
								target="_blank"
								rel="noreferrer"
								className="text-amber-400 underline"
							>
								@stels/gliesereum
							</a>
						</p>
						<Separator className="my-2" />
						<div className="grid gap-2">
							<div className="text-xs text-zinc-400">Core parameters:</div>
							<ul className="list-disc pl-5 space-y-1">
								<li>
									<span className="text-white font-medium">Curve</span>:
									secp256k1
								</li>
								<li>
									<span className="text-white font-medium">
										Address version byte
									</span>: 98
								</li>
								<li>
									<span className="text-white font-medium">Checksum</span>:
									SHA-256, first 4 bytes
								</li>
								<li>
									<span className="text-white font-medium">Encoding</span>:
									Base58 (payload with version + checksum)
								</li>
								<li>
									<span className="text-white font-medium">
										Hashing for address
									</span>: RIPEMD-160(SHA-256(pubkeyCompressed))
								</li>
							</ul>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">Data Types</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<p>Wallet object:</p>
						<CodeBlock>
							{`type Wallet = {
  publicKey: string        // hex, compressed (33 bytes)
  privateKey: string       // hex, 32 bytes
  address: string          // base58 with version+checksum
  biometric?: string|null  // reserved
  number: string           // deterministic 16-digit Luhn-valid number
}`}
						</CodeBlock>
						<p>Transaction object (reference):</p>
						<CodeBlock>
							{`type Transaction = {
  from: { address: string; publicKey: string; number: string }
  to: string
  amount: number
  fee: number
  timestamp: number
  prevHash?: string
  hash: string
  verified?: boolean
  validators: string[]
  status: "pending" | "confirmed" | "failed"
  signature?: string
  data?: string
}`}
						</CodeBlock>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">Address Specification</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<p>
							Address derivation from a secp256k1 public key follows a compact,
							checksum-protected scheme:
						</p>
						<ol className="list-decimal pl-5 space-y-1">
							<li>Ensure the public key is compressed to 33 bytes.</li>
							<li>Compute hash = RIPEMD160(SHA256(publicKeyCompressed)).</li>
							<li>Prefix with version byte 98: payload = [98] + hash.</li>
							<li>Create checksum = first 4 bytes of SHA256(payload).</li>
							<li>Concatenate: full = payload || checksum.</li>
							<li>Encode using Base58 to obtain the address string.</li>
						</ol>
						<p>Validation steps for an address string:</p>
						<ol className="list-decimal pl-5 space-y-1">
							<li>Base58-decode to bytes.</li>
							<li>
								Verify minimum length ≥ 1 (version) + 20 (hash) + 4 (checksum).
							</li>
							<li>Check that the first byte equals 98.</li>
							<li>
								Recompute checksum over version+hash and compare in constant
								time.
							</li>
						</ol>
						<CodeBlock>
							{`// Pseudocode (language-agnostic)
pubKeyCompressed = compressSecp256k1PublicKey(pubKey)
hash160 = RIPEMD160(SHA256(pubKeyCompressed))
payload = CONCAT(0x62 /*98*/, hash160)
checksum = SHA256(payload)[0..4)
full = CONCAT(payload, checksum)
address = BASE58_ENCODE(full)`}
						</CodeBlock>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">
							Signing and Verification
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<p>
							Gliesereum uses ECDSA over secp256k1 with canonical (low-s) DER
							signatures. The message to sign is a UTF-8 string hashed with
							SHA-256 prior to signing.
						</p>
						<ol className="list-decimal pl-5 space-y-1">
							<li>dataHash = SHA256(UTF8_ENCODE(dataString))</li>
							<li>signature = ECDSA_SIGN_SECP256K1(privateKey, dataHash)</li>
							<li>Serialize signature as DER, then hex-encode</li>
							<li>
								Verification: ECDSA_VERIFY(publicKeyCompressed, dataHash,
								signature)
							</li>
						</ol>
						<CodeBlock>
							{`// Pseudocode
dataHash = SHA256(UTF8(data))
sigDER = ECDSA_SIGN_SECP256K1(privKey, dataHash, canonical=true)
sigHex = HEX_ENCODE(sigDER)
isValid = ECDSA_VERIFY_SECP256K1(pubKeyCompressed, dataHash, sigDER)`}
						</CodeBlock>
						<p>
							When signing structured data, first deterministically serialize
							the object (see Deterministic Serialization) and then sign the
							resulting string.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">
							Deterministic Serialization
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<p>
							Objects must be serialized deterministically before
							hashing/signing to ensure cross-language compatibility:
						</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>Sort object keys alphabetically (ascending).</li>
							<li>Represent arrays by serializing each element recursively.</li>
							<li>Represent scalars via standard JSON rules.</li>
							<li>Undefined values are treated as null.</li>
						</ul>
						<CodeBlock>
							{`// Pseudocode
function deterministicStringify(value): string {
  if value is null or scalar: return JSON.stringify(value)
  if value is array: return "[" + value.map(deterministicStringify).join(",") + "]"
  // object case
  let keys = Object.keys(value).sort()
  return "{" + keys.map(k => "\"" + k + "\":" + deterministicStringify(value[k] ?? null)).join(",") + "}"
}`}
						</CodeBlock>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">
							Deterministic Card Number (Luhn)
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<p>
							Generates a 16-digit, Luhn-valid number from arbitrary input with
							an optional secret for HMAC-based personalization.
						</p>
						<ol className="list-decimal pl-5 space-y-1">
							<li>data = UTF8(input)</li>
							<li>hash = secret ? HMAC-SHA256(secret, data) : SHA256(data)</li>
							<li>digitsNeeded = 16 - prefix.length - 1</li>
							<li>body = DECIMAL(hash) padded/truncated to digitsNeeded</li>
							<li>base = prefix + body</li>
							<li>control = Luhn checksum over base</li>
							<li>number = base + control</li>
						</ol>
						<CodeBlock>
							{`// Luhn checksum pseudocode
function luhnChecksum(numberString): string {
  let sum = 0
  let double = false
  for i from rightmost digit to leftmost:
    let d = int(numberString[i])
    if double: d = d * 2; if d > 9: d = d - 9
    sum += d
    double = !double
  return ((10 - (sum % 10)) % 10).toString()
}`}
						</CodeBlock>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">Utility Primitives</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<ul className="list-disc pl-5 space-y-1">
							<li>
								<span className="text-white font-medium">
									hexToUint8Array(hex)
								</span>: Normalize hex (strip 0x, pad) and convert to bytes.
							</li>
							<li>
								<span className="text-white font-medium">toHex(bytes)</span>:
								Convert bytes to lowercase hex string.
							</li>
							<li>
								<span className="text-white font-medium">
									concatUint8(arrays)
								</span>: Concatenate multiple byte arrays.
							</li>
							<li>
								<span className="text-white font-medium">
									constantTimeEqual(a,b)
								</span>: Compare byte arrays without data-dependent timing.
							</li>
							<li>
								<span className="text-white font-medium">
									ensureCompressedKey(pub)
								</span>: Convert 65-byte uncompressed keys to 33-byte compressed
								form.
							</li>
						</ul>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">
							High-level API Reference
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-3">
						<ul className="list-disc pl-5 space-y-2">
							<li>
								<span className="text-white font-medium">createWallet()</span>
								{" "}
								→ Wallet
								<div>
									Generate secp256k1 key pair; derive address and card number.
								</div>
							</li>
							<li>
								<span className="text-white font-medium">
									getAddress(publicKeyBytes)
								</span>{" "}
								→ string
								<div>Derive Base58 address from compressed public key.</div>
							</li>
							<li>
								<span className="text-white font-medium">
									validateAddress(address)
								</span>{" "}
								→ boolean
								<div>Check version byte and checksum in constant time.</div>
							</li>
							<li>
								<span className="text-white font-medium">
									sign(data, privateKeyHex)
								</span>{" "}
								→ string
								<div>Return canonical DER signature encoded as hex.</div>
							</li>
							<li>
								<span className="text-white font-medium">
									verify(data, signatureHex, publicKeyHex)
								</span>{" "}
								→ boolean
								<div>Verify ECDSA signature for the given data.</div>
							</li>
							<li>
								<span className="text-white font-medium">
									cardNumber(input, prefix?, secret?)
								</span>{" "}
								→ string
								<div>
									Deterministic 16-digit number with Luhn control digit.
								</div>
							</li>
							<li>
								<span className="text-white font-medium">
									importWallet(privateKeyHex)
								</span>{" "}
								→ Wallet
								<div>Load wallet from raw 32-byte private key (hex).</div>
							</li>
						</ul>

						<Separator className="my-3" />
						<p className="text-xs text-zinc-400">
							Example (JavaScript / TypeScript):
						</p>
						<CodeBlock>
							{`import { Gliesereum } from "@stels/gliesereum"

const w = Gliesereum.createWallet()
const data = "hello gliesereum"
const sig = Gliesereum.sign(data, w.privateKey)
const ok = Gliesereum.verify(data, sig, w.publicKey)
const addrOk = Gliesereum.validateAddress(w.address)`}
						</CodeBlock>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-white">
							Security Considerations
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300 space-y-2">
						<ul className="list-disc pl-5 space-y-1">
							<li>Never log or transmit private keys or raw seeds.</li>
							<li>
								Use constant-time comparisons for sensitive data (checksums,
								MACs).
							</li>
							<li>Validate inputs (hex length, address structure) strictly.</li>
							<li>Serialize data deterministically prior to signing.</li>
							<li>Prefer secure randomness when generating keys.</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</Screen>
	);
}

export default DocksWallet;
