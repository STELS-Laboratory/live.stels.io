import { type ReactElement, useState } from "react";
import Screen from "@/routes/main/Screen.tsx";
import Header from "@/components/main/Header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import {filterSession} from "@/lib/utils.ts";

function CodeBlock(
	{ children, label }: { children: string; label?: string },
): ReactElement {
	const [copied, setCopied] = useState<boolean>(false);

	const onCopy = async (): Promise<void> => {
		try {
			await navigator.clipboard.writeText(children);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="relative">
			{label
				? (
					<div className="absolute left-2 top-2 text-[10px] uppercase tracking-wide text-zinc-400">
						{label}
					</div>
				)
				: null}
			<pre className="mt-2 w-full overflow-x-auto rounded-md bg-zinc-900 p-3 pt-5 text-xs text-zinc-200">
        <code>{children}</code>
			</pre>
			<div className="absolute right-2 top-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							aria-label={copied ? "Copied" : "Copy to clipboard"}
							onClick={onCopy}
							className="h-7 px-2 text-xs"
						>
							{copied ? "Copied" : "Copy"}
						</Button>
					</TooltipTrigger>
					<TooltipContent sideOffset={6}>
						{copied ? "Copied" : "Copy to clipboard"}
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}

function DocSection(
	{ id, title, children }: {
		id: string;
		title: string;
		children: ReactElement | ReactElement[];
	},
): ReactElement {
	return (
		<div id={id} className="scroll-mt-24">
			<Card>
				<CardHeader>
					<CardTitle className="text-white">{title}</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-zinc-300 space-y-3">
					{children}
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Developer documentation for Gliesereum wallet protocol and reference API.
 * The goal is to describe the algorithms precisely so developers can
 * implement the same functionality in any programming language.
 */
function DocksWallet(): ReactElement {
	const session = useSessionStoreSync() as Record<string, unknown> | null;
	const tickers = filterSession(session || {}, /\.spot\..*\.ticker$/);
	
	console.log(tickers);
	
	// tickers data structure example:
	// [
	// 	{
	// 		"key": "testnet.runtime.connector.exchange.crypto.bybit.spot.JASMY/USDT.ticker",
	// 		"value": {
	// 			"channel": "testnet.runtime.connector.exchange.crypto.bybit.spot.JASMY/USDT.ticker",
	// 			"module": "ticker",
	// 			"widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.spot.JASMY/USDT.ticker",
	// 			"raw": {
	// 				"exchange": "bybit",
	// 				"market": "JASMY/USDT",
	// 				"last": 0.01595,
	// 				"bid": 0.01596,
	// 				"ask": 0.01597,
	// 				"change": 0.00055,
	// 				"percentage": 3.57,
	// 				"baseVolume": 123323858.92,
	// 				"quoteVolume": 1942660.4621817,
	// 				"timestamp": 1754684423790,
	// 				"latency": 5286
	// 			},
	// 			"timestamp": 1754684423790
	// 		}
	// 	},
	// 	{
	// 		"key": "testnet.runtime.connector.exchange.crypto.bybit.spot.XRP/USDT.ticker",
	// 		"value": {
	// 			"channel": "testnet.runtime.connector.exchange.crypto.bybit.spot.XRP/USDT.ticker",
	// 			"module": "ticker",
	// 			"widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.spot.XRP/USDT.ticker",
	// 			"raw": {
	// 				"exchange": "bybit",
	// 				"market": "XRP/USDT",
	// 				"last": 3.3012,
	// 				"bid": 3.3008,
	// 				"ask": 3.3009,
	// 				"change": 0.1926,
	// 				"percentage": 6.2,
	// 				"baseVolume": 136115594.92,
	// 				"quoteVolume": 448677611.570038,
	// 				"timestamp": 1754684428717,
	// 				"latency": 3809
	// 			},
	// 			"timestamp": 1754684428717
	// 		}
	// 	},
	// 	{
	// 		"key": "testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker",
	// 		"value": {
	// 			"channel": "testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker",
	// 			"module": "ticker",
	// 			"widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker",
	// 			"raw": {
	// 				"exchange": "bybit",
	// 				"market": "BTC/USDT",
	// 				"last": 116425.9,
	// 				"bid": 116425.9,
	// 				"ask": 116426,
	// 				"change": -918.9,
	// 				"percentage": -0.78,
	// 				"baseVolume": 5989.752191,
	// 				"quoteVolume": 699368844.7694075,
	// 				"timestamp": 1754684428160,
	// 				"latency": 3590
	// 			},
	// 			"timestamp": 1754684428160
	// 		}
	// 	},
	// 	{
	// 		"key": "testnet.runtime.connector.exchange.crypto.bybit.spot.ETH/USDT.ticker",
	// 		"value": {
	// 			"channel": "testnet.runtime.connector.exchange.crypto.bybit.spot.ETH/USDT.ticker",
	// 			"module": "ticker",
	// 			"widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.spot.ETH/USDT.ticker",
	// 			"raw": {
	// 				"exchange": "bybit",
	// 				"market": "ETH/USDT",
	// 				"last": 4050.39,
	// 				"bid": 4050.3,
	// 				"ask": 4050.31,
	// 				"change": 190.29,
	// 				"percentage": 4.93,
	// 				"baseVolume": 283557.95185,
	// 				"quoteVolume": 1120380293.8686707,
	// 				"timestamp": 1754684428953,
	// 				"latency": 2709
	// 			},
	// 			"timestamp": 1754684428953
	// 		}
	// 	},
	// 	{
	// 		"key": "testnet.runtime.connector.exchange.crypto.bybit.spot.SOL/USDT.ticker",
	// 		"value": {
	// 			"channel": "testnet.runtime.connector.exchange.crypto.bybit.spot.SOL/USDT.ticker",
	// 			"module": "ticker",
	// 			"widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.spot.SOL/USDT.ticker",
	// 			"raw": {
	// 				"exchange": "bybit",
	// 				"market": "SOL/USDT",
	// 				"last": 177.44,
	// 				"bid": 177.44,
	// 				"ask": 177.45,
	// 				"change": 5.11,
	// 				"percentage": 2.97,
	// 				"baseVolume": 1032170.128,
	// 				"quoteVolume": 181579570.49285,
	// 				"timestamp": 1754684428122,
	// 				"latency": 3476
	// 			},
	// 			"timestamp": 1754684428122
	// 		}
	// 	}
	// ]
	
	return (
		<Screen>
			<div id="top" className="space-y-4">
				<Header
					title="Gliesereum Wallet Protocol"
					description="Deterministic address format, signing/verification, and utility primitives."
				/>

				{/* Table of Contents */}
				<Card>
					<CardHeader>
						<CardTitle className="text-white">Contents</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300">
						<nav className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
							<a className="text-amber-400 hover:underline" href="#overview">
								1. Overview
							</a>
							<a className="text-amber-400 hover:underline" href="#data-types">
								2. Data Types
							</a>
							<a
								className="text-amber-400 hover:underline"
								href="#address-spec"
							>
								3. Address Specification
							</a>
							<a className="text-amber-400 hover:underline" href="#sign-verify">
								4. Signing & Verification
							</a>
							<a
								className="text-amber-400 hover:underline"
								href="#det-serialization"
							>
								5. Deterministic Serialization
							</a>
							<a className="text-amber-400 hover:underline" href="#luhn">
								6. Deterministic Card Number (Luhn)
							</a>
							<a className="text-amber-400 hover:underline" href="#utilities">
								7. Utility Primitives
							</a>
							<a className="text-amber-400 hover:underline" href="#api">
								8. High-level API Reference
							</a>
							<a className="text-amber-400 hover:underline" href="#security">
								9. Security Considerations
							</a>
						</nav>
					</CardContent>
				</Card>

				<DocSection id="overview" title="Overview">
					<>
						<p>
							Gliesereum is a lightweight cryptographic wallet protocol based on
							secp256k1. It defines key generation, address derivation, message
							signing/verification, and deterministic identifiers.
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
									<span className="text-white font-medium">Address hash</span>:
									RIPEMD-160(SHA-256(pubkeyCompressed))
								</li>
							</ul>
						</div>
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="data-types" title="Data Types">
					<>
						<p>Wallet object:</p>
						<CodeBlock label="TypeScript">
							{`type Wallet = {
  publicKey: string        // hex, compressed (33 bytes)
  privateKey: string       // hex, 32 bytes
  address: string          // base58 with version+checksum
  biometric?: string|null  // reserved
  number: string           // deterministic 16-digit Luhn-valid number
}`}
						</CodeBlock>
						<p>Transaction object (reference):</p>
						<CodeBlock label="TypeScript">
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
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="address-spec" title="Address Specification">
					<>
						<p>Address derivation from a secp256k1 public key:</p>
						<ol className="list-decimal pl-5 space-y-1">
							<li>Ensure the public key is compressed to 33 bytes.</li>
							<li>Compute hash = RIPEMD160(SHA256(publicKeyCompressed)).</li>
							<li>Prefix with version byte 98: payload = [98] + hash.</li>
							<li>Create checksum = first 4 bytes of SHA256(payload).</li>
							<li>Concatenate: full = payload || checksum.</li>
							<li>Encode using Base58 to obtain the address string.</li>
						</ol>
						<p>Validation steps:</p>
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
						<CodeBlock label="Pseudocode">
							{`pubKeyCompressed = compressSecp256k1PublicKey(pubKey)
hash160 = RIPEMD160(SHA256(pubKeyCompressed))
payload = CONCAT(0x62 /*98*/, hash160)
checksum = SHA256(payload)[0..4)
full = CONCAT(payload, checksum)
address = BASE58_ENCODE(full)`}
						</CodeBlock>
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="sign-verify" title="Signing and Verification">
					<>
						<p>
							ECDSA over secp256k1 with canonical (low-s) DER signatures. The
							message to sign is UTF-8 encoded and hashed with SHA-256 before
							signing.
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
						<CodeBlock label="Pseudocode">
							{`dataHash = SHA256(UTF8(data))
sigDER = ECDSA_SIGN_SECP256K1(privKey, dataHash, canonical=true)
sigHex = HEX_ENCODE(sigDER)
isValid = ECDSA_VERIFY_SECP256K1(pubKeyCompressed, dataHash, sigDER)`}
						</CodeBlock>
						<p>
							For structured data, first apply Deterministic Serialization (see
							below), then sign the resulting string.
						</p>
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="det-serialization" title="Deterministic Serialization">
					<>
						<p>Rules to ensure cross-language consistent hashing/signing:</p>
						<Accordion type="single" collapsible defaultValue="open">
							<AccordionItem value="rules">
								<AccordionTrigger>Serialization rules</AccordionTrigger>
								<AccordionContent>
									<ul className="list-disc pl-5 space-y-1">
										<li>Sort object keys alphabetically (ascending).</li>
										<li>
											Represent arrays by serializing each element recursively.
										</li>
										<li>Represent scalars via standard JSON rules.</li>
										<li>Undefined values are treated as null.</li>
									</ul>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
						<CodeBlock label="Pseudocode">
							{`function deterministicStringify(value): string {
  if value is null or scalar: return JSON.stringify(value)
  if value is array: return "[" + value.map(deterministicStringify).join(",") + "]"
  // object case
  let keys = Object.keys(value).sort()
  return "{" + keys.map(k => "\"" + k + "\":" + deterministicStringify(value[k] ?? null)).join(",") + "}"
}`}
						</CodeBlock>
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="luhn" title="Deterministic Card Number (Luhn)">
					<>
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
						<CodeBlock label="Pseudocode">
							{`function luhnChecksum(numberString): string {
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
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="utilities" title="Utility Primitives">
					<>
						<Accordion type="multiple" defaultValue={["hex", "concat"]}>
							<AccordionItem value="hex">
								<AccordionTrigger>
									hexToUint8Array(hex), toHex(bytes)
								</AccordionTrigger>
								<AccordionContent>
									<p className="text-zinc-300">
										Normalize hex (strip 0x, pad) and convert to bytes; and
										convert bytes to lowercase hex.
									</p>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value="concat">
								<AccordionTrigger>concatUint8(arrays)</AccordionTrigger>
								<AccordionContent>
									<p className="text-zinc-300">
										Concatenate multiple byte arrays preserving order.
									</p>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value="ct">
								<AccordionTrigger>constantTimeEqual(a, b)</AccordionTrigger>
								<AccordionContent>
									<p className="text-zinc-300">
										Compare byte arrays with timing-attack resistance.
									</p>
								</AccordionContent>
							</AccordionItem>
							<AccordionItem value="compress">
								<AccordionTrigger>ensureCompressedKey(pub)</AccordionTrigger>
								<AccordionContent>
									<p className="text-zinc-300">
										Convert 65-byte uncompressed keys to 33-byte compressed
										form.
									</p>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="api" title="High-level API Reference">
					<>
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
						<CodeBlock label="TypeScript">
							{`import { Gliesereum } from "@stels/gliesereum"

const w = Gliesereum.createWallet()
const data = "hello gliesereum"
const sig = Gliesereum.sign(data, w.privateKey)
const ok = Gliesereum.verify(data, sig, w.publicKey)
const addrOk = Gliesereum.validateAddress(w.address)`}
						</CodeBlock>
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>

				<DocSection id="security" title="Security Considerations">
					<>
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
						<div className="pt-2 text-xs">
							<a href="#top" className="text-amber-400 hover:underline">
								Back to top
							</a>
						</div>
					</>
				</DocSection>
			</div>
		</Screen>
	);
}

export default DocksWallet;
