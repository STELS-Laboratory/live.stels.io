import { type ReactElement, useMemo, useState } from "react";
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
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import { filterSession } from "@/lib/utils.ts";
import {
	ArrowDownRight,
	ArrowUpRight,
	Code2,
	Globe,
	Send,
	ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock(
	{ children, label }: { children: string; label?: string },
): ReactElement {
	const [copied, setCopied] = useState<boolean>(false);

	const language = useMemo<string>(() => {
		const map: Record<string, string> = {
			typescript: "typescript",
			ts: "typescript",
			javascript: "javascript",
			js: "javascript",
			json: "json",
			curl: "bash",
			pseudocode: "none",
		};
		const key = (label || "text").trim().toLowerCase();
		return map[key] || "none";
	}, [label]);

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
			<div className="mt-2 w-full overflow-hidden rounded-md bg-zinc-900 pt-5">
				<SyntaxHighlighter
					language={language}
					style={vscDarkPlus as unknown as {
						[key: string]: React.CSSProperties;
					}}
					customStyle={{ margin: 0, padding: "12px" }}
					wrapLongLines
				>
					{children}
				</SyntaxHighlighter>
			</div>
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

// Types for safely parsing ticker data from session entries
interface SessionEntry {
	key: string;
	value: unknown;
}

interface TickerRaw {
	exchange: string;
	market: string;
	last: number;
	bid: number;
	ask: number;
	change: number;
	percentage: number;
	baseVolume: number;
	quoteVolume: number;
	timestamp: number;
	latency: number;
}

interface TickerValue {
	channel: string;
	module: string;
	widget: string;
	raw: TickerRaw;
	timestamp: number;
}

interface MappedTicker {
	id: string;
	exchange: string;
	symbol: string;
	last: number;
	bid: number;
	ask: number;
	change: number;
	percentage: number;
}

function isTickerValue(v: unknown): v is TickerValue {
	if (typeof v !== "object" || v === null) return false;
	const tv = v as Record<string, unknown>;
	const raw = tv.raw as Record<string, unknown> | undefined;
	return typeof tv.channel === "string" &&
		typeof tv.module === "string" &&
		typeof tv.widget === "string" &&
		typeof tv.timestamp === "number" &&
		!!raw &&
		typeof raw.exchange === "string" &&
		typeof raw.market === "string" &&
		typeof raw.last === "number" &&
		typeof raw.bid === "number" &&
		typeof raw.ask === "number" &&
		typeof raw.change === "number" &&
		typeof raw.percentage === "number";
}

function formatPrice(value: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatPercent(value: number, precision = 2): string {
	return `${value >= 0 ? "+" : ""}${value.toFixed(precision)}%`;
}

function formatChangeAbs(value: number): string {
	const abs = Math.abs(value);
	const sign = value >= 0 ? "+" : "-";
	return `${sign}${
		new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(abs)
	}`;
}

function mapTickers(entries: SessionEntry[]): MappedTicker[] {
	const result: MappedTicker[] = [];
	for (const { key, value } of entries) {
		if (!isTickerValue(value)) continue;
		const raw = value.raw;
		result.push({
			id: key,
			exchange: raw.exchange,
			symbol: raw.market,
			last: raw.last,
			bid: raw.bid,
			ask: raw.ask,
			change: raw.change,
			percentage: raw.percentage,
		});
	}
	return result;
}

function TickerTape(
	{ entries }: { entries: SessionEntry[] },
): ReactElement | null {
	const items = mapTickers(entries);
	if (items.length === 0) return null;

	return (
		<div
			aria-label="Live market ticker"
			className="rounded-md border border-zinc-800 bg-zinc-900/40"
		>
			<div className="flex items-stretch gap-2 overflow-x-auto px-2 py-2">
				{items.map((t) => {
					const positive = t.percentage > 0 ||
						(t.percentage === 0 && t.change > 0);
					const negative = t.percentage < 0 ||
						(t.percentage === 0 && t.change < 0);
					const priceColor = positive
						? "text-emerald-400"
						: negative
						? "text-red-400"
						: "text-zinc-200";
					const badgeBase = positive
						? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
						: negative
						? "border-red-500/30 bg-red-500/10 text-red-400"
						: "border-zinc-700 bg-zinc-800 text-zinc-300";

					return (
						<div
							key={t.id}
							className="min-w-[260px] rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
						>
							<div className="flex items-center justify-between">
								<div>
									<div className="text-xs text-zinc-400">
										{t.exchange.toUpperCase()}
									</div>
									<div className="text-sm font-medium text-white">
										{t.symbol}
									</div>
								</div>
								<div className="text-right">
									<div className={`text-sm font-semibold ${priceColor}`}>
										<span className="font-mono">{formatPrice(t.last)}</span>
									</div>
									<div className="mt-1 flex items-center justify-end gap-1 text-xs">
										<div
											className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${badgeBase}`}
										>
											{positive
												? <ArrowUpRight className="h-3 w-3" />
												: negative
												? <ArrowDownRight className="h-3 w-3" />
												: null}
											<span className="font-mono">
												{formatPercent(t.percentage)}
											</span>
										</div>
										<div className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
											<span className="font-mono">
												{formatChangeAbs(t.change)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
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
	const tickers = filterSession(session || {}, /.spot\..*\.ticker$/);

	return (
		<div className="min-h-screen bg-background">
			<div id="top" className="space-y-4">
				<Header
					title="Gliesereum Wallet Protocol"
					description="Deterministic address format, signing/verification, and utility primitives."
				/>

				{/* Top ticker tape */}
				<TickerTape entries={tickers as SessionEntry[]} />

				{/* Table of Contents */}
				<Card>
					<CardHeader>
						<CardTitle className="text-white">Contents</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-zinc-300">
						<nav className="grid grid-cols-1 gap-y-1 sm:grid-cols-2">
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
							<a className="text-amber-400 hover:underline" href="#wallet-info">
								9. Wallet Info (WebFix API)
							</a>
							<a className="text-amber-400 hover:underline" href="#security">
								10. Security Considerations
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
							<ul className="list-disc space-y-1 pl-5">
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
						<ol className="list-decimal space-y-1 pl-5">
							<li>Ensure the public key is compressed to 33 bytes.</li>
							<li>Compute hash = RIPEMD160(SHA256(publicKeyCompressed)).</li>
							<li>Prefix with version byte 98: payload = [98] + hash.</li>
							<li>Create checksum = first 4 bytes of SHA256(payload).</li>
							<li>Concatenate: full = payload || checksum.</li>
							<li>Encode using Base58 to obtain the address string.</li>
						</ol>
						<p>Validation steps:</p>
						<ol className="list-decimal space-y-1 pl-5">
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
						<ol className="list-decimal space-y-1 pl-5">
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
									<ul className="list-disc space-y-1 pl-5">
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
  return "{" + keys.map(k => '"' + k + '":' + deterministicStringify(value[k] ?? null)).join(",") + "}"
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
						<ol className="list-decimal space-y-1 pl-5">
							<li>data = UTF8(input)</li>
							<li>hash = secret ? HMAC-SHA256(secret, data) : SHA256(data)</li>
							<li>digitsNeeded = 16 - prefix length - 1</li>
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
						<ul className="list-disc space-y-2 pl-5">
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

				<DocSection id="wallet-info" title="Wallet Info (WebFix API)">
					<>
						<p>
							You can fetch wallet information using the WebFix API endpoint.
							This example demonstrates how to request wallet details for a
							Gliesereum address.
						</p>

						{/* Pretty chips row */}
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs">
								<Globe className="h-3.5 w-3.5 text-amber-400" />
								<span className="text-zinc-400">Endpoint</span>
								<span className="text-white">https://live.stels.dev</span>
							</div>
							<div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs">
								<Send className="h-3.5 w-3.5 text-amber-400" />
								<span className="text-zinc-400">Method</span>
								<Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">
									POST
								</Badge>
							</div>
							<div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs">
								<Code2 className="h-3.5 w-3.5 text-amber-400" />
								<span className="text-zinc-400">Content-Type</span>
								<span className="text-white">application/json</span>
							</div>
						</div>

						<Alert className="border-amber-500/30 bg-amber-500/5">
							<ShieldAlert className="text-amber-400" />
							<AlertTitle>Security Note</AlertTitle>
							<AlertDescription>
								Do not send private keys. The endpoint only requires a wallet
								address. Always use HTTPS.
							</AlertDescription>
						</Alert>

						<p className="text-xs text-zinc-400">Request body (JSON):</p>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<CodeBlock label="JSON">
								{`{
  "webfix": "1.0",
  "method": "getWalletInfo",
  "params": [
    "gliesereum"
  ],
  "body": {
    "address": "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv"
  }
}`}
							</CodeBlock>
							<div>
								<p className="text-xs text-zinc-400">Example (cURL):</p>
								<CodeBlock label="cURL">
									{`curl -sS -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "webfix": "1.0",
    "method": "getWalletInfo",
    "params": ["gliesereum"],
    "body": { "address": "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv" }
  }' \
  https://live.stels.dev`}
								</CodeBlock>
							</div>
						</div>

						<p className="text-xs text-zinc-400">
							Example (fetch, TypeScript):
						</p>
						<CodeBlock label="TypeScript">
							{`interface GetWalletInfoRequest {
  webfix: "1.0";
  method: "getWalletInfo";
  params: ["gliesereum"];
  body: { address: string };
}

interface GetWalletInfoResponse<T = unknown> {
  ok: boolean;
  result?: T;
  error?: { code: string; message: string };
}

async function getWalletInfo(address: string) {
  const payload: GetWalletInfoRequest = {
    webfix: "1.0",
    method: "getWalletInfo",
    params: ["gliesereum"],
    body: { address },
  };

  const res = await fetch("https://live.stels.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = (await res.json()) as GetWalletInfoResponse;
  if (!data.ok) throw new Error(data.error?.message || "Unknown error");
  return data.result;
}`}
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
						<ul className="list-disc space-y-1 pl-5">
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
		</div>
	);
}

export default DocksWallet;
