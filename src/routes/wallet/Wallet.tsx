import {useEffect, useState} from "react"
import type {AccountRequest, ProtocolData, SignedAccountRequest} from "@/lib/api-types"
import {createWallet, deterministicStringify, sign, importWallet, type Wallet} from "@/lib/gliesereum"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Textarea} from "@/components/ui/textarea"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion"
import {Checkbox} from "@/components/ui/checkbox"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Download,
	KeyRound,
	Sparkles,
	WalletCards,
} from "lucide-react"

interface WebfixPayload {
	webfix: string
	method: string
	params: string[]
	body: SignedAccountRequest
}

const initialAccountState: AccountRequest = {
	nid: "Neuron Market ID",
	connection: true,
	exchange: "binance",
	note: "My primary trading account.",
	apiKey: "",
	secret: "",
	status: "active",
	password: "",
	viewers: [],
}

const initialProtocolState: ProtocolData = {
	maxRiskPerTrade: 3.5,
	strategy: "Trend Following",
	maxLeverage: 10,
	markets: ["BTC/USDT", "ETH/USDT"],
	maxDrawdown: 20,
	stopLoss: 2,
	takeProfit: 4,
	riskRewardRatio: 2,
	tradingStyle: "Swing Trading",
	positionSizing: "Fixed Fractional",
	portfolioAllocation: 50,
	slippageTolerance: 0.5,
	orderTypes: ["Limit", "Market"],
	timeframes: ["4h", "1d"],
	marketConditions: ["Trending", "Volatile"],
	hedgingEnabled: true,
	scalingEnabled: false,
	trailingStopEnabled: true,
	dynamicPositionSizing: false,
}

const annaAriadnaStrategy: ProtocolData = {
	strategy: "Anna Ariadna",
	tradingStyle: "Intelligent Position Trading",
	maxRiskPerTrade: 6,
	maxLeverage: 5,
	maxDrawdown: 18,
	stopLoss: 5,
	takeProfit: 9,
	riskRewardRatio: 7,
	positionSizing: "Dynamic Volatility Adjusted",
	portfolioAllocation: 75,
	slippageTolerance: 0.25,
	markets: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
	orderTypes: ["Limit", "Stop-Limit"],
	timeframes: ["1d", "3d", "1w"],
	marketConditions: ["Trending", "High Volume"],
	hedgingEnabled: true,
	scalingEnabled: true,
	trailingStopEnabled: true,
	dynamicPositionSizing: true,
}

const parseStringToArray = (str: string) =>
	str
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)

export default function GliesereumWallet() {
	const [step, setStep] = useState(1) // 1: Wallet, 2: Account, 3: Protocol, 4: Done
	const [wallet, setWallet] = useState<Wallet | null>(null)
	const [isNewWallet, setIsNewWallet] = useState(false)
	const [privateKeyInput, setPrivateKeyInput] = useState("")
	const [importError, setImportError] = useState<string | null>(null)
	
	const [account, setAccount] = useState<AccountRequest>(initialAccountState)
	const [protocol, setProtocol] = useState<ProtocolData>(initialProtocolState)
	const [viewersStr, setViewersStr] = useState("")
	
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
	const [payloadToSign, setPayloadToSign] = useState<WebfixPayload | null>(null)
	const [finalResult, setFinalResult] = useState<WebfixPayload | null>(null)
	
	useEffect(() => {
		const walletStorage = localStorage.getItem("_g")
		if (walletStorage){
			setWallet(JSON.parse(walletStorage))
		}
	}, [])
	
	const handleCreateWallet = () => {
		const newWallet = createWallet()
		setWallet(newWallet)
		localStorage.setItem("_g", JSON.stringify(newWallet))
		setIsNewWallet(true)
		setImportError(null)
	}
	
	const handleImportWallet = () => {
		try {
			const importedWallet = importWallet(privateKeyInput)
			setWallet(importedWallet)
			localStorage.setItem("_g", JSON.stringify(importedWallet))
			setIsNewWallet(false)
			setImportError(null)
		} catch (error: any) {
			setImportError(error.message || "Failed to import wallet. Please check the private key.")
		}
	}
	
	const handleSaveKey = () => {
		if (!wallet) return
		const blob = new Blob([wallet.privateKey], {type: "text/plain"})
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `gliesereum-private-key-${wallet.address.slice(0, 8)}.txt`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}
	
	const handleReview = () => {
		if (!wallet) return
		
		const accountRequestData: AccountRequest = {
			...account,
			viewers: parseStringToArray(viewersStr),
			protocol: protocol,
		}
		
		// Create payload with placeholders for signing
		const unsignedBody: SignedAccountRequest = {
			account: accountRequestData,
			publicKey: wallet.publicKey,
			address: wallet.address,
			signature: "[SIGNATURE_WILL_BE_GENERATED_AFTER_CONFIRMATION]",
		}
		
		const unsignedPayload: WebfixPayload = {
			webfix: "1.0",
			method: "setAccount",
			params: ["gliesereum"],
			body: unsignedBody,
		}
		
		setPayloadToSign(unsignedPayload)
		setIsConfirmModalOpen(true)
	}
	
	const handleConfirmAndSign = () => {
		if (!wallet || !payloadToSign) return
		
		const accountToSign = payloadToSign.body.account
		const dataString = deterministicStringify(accountToSign)
		const signature = sign(dataString, wallet.privateKey)
		
		const signedBody: SignedAccountRequest = {
			...payloadToSign.body,
			signature: signature,
		}
		
		const finalSignedPayload: WebfixPayload = {
			...payloadToSign,
			body: signedBody,
		}
		
		setFinalResult(finalSignedPayload)
		setIsConfirmModalOpen(false)
		setStep(4)
	}
	
	const startOver = () => {
		setStep(1)
		//setWallet(null)
		setIsNewWallet(false)
		setPrivateKeyInput("")
		setImportError(null)
		setAccount(initialAccountState)
		setProtocol(initialProtocolState)
		setViewersStr("")
		setPayloadToSign(null)
		setFinalResult(null)
	}
	
	return (
		<div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
			{step === 1 && (
				<Card>
					<CardHeader>
						<CardTitle>Step 1: Wallet</CardTitle>
						<CardDescription>Create a new wallet or import an existing one to begin.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{!wallet ? (
							<>
								<Button onClick={handleCreateWallet} className="w-full" size="lg">
									<WalletCards className="mr-2 h-5 w-5"/> Create New Wallet
								</Button>
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t"/>
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-card px-2 text-muted-foreground">Or Import Existing</span>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="privateKey">Private Key</Label>
									<div className="flex gap-2">
										<Input
											id="privateKey"
											type="password"
											placeholder="Enter your 64-character hex private key"
											value={privateKeyInput}
											onChange={(e) => setPrivateKeyInput(e.target.value)}
										/>
										<Button onClick={handleImportWallet} variant="secondary">
											<KeyRound className="mr-2 h-4 w-4"/> Import
										</Button>
									</div>
									{importError && <p className="text-sm text-destructive mt-2">{importError}</p>}
								</div>
							</>
						) : (
							<div className="space-y-4">
								<Alert
									variant="default"
									className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
								>
									<CheckCircle2 className="h-4 w-4 text-green-600"/>
									<AlertTitle className="text-green-800 dark:text-green-300">Wallet Ready</AlertTitle>
									<AlertDescription className="text-green-700 dark:text-green-400">
										Your wallet has been loaded successfully.
									</AlertDescription>
								</Alert>
								{isNewWallet && (
									<>
										<Alert variant="destructive">
											<AlertTriangle className="h-4 w-4"/>
											<AlertTitle>Action Required: Secure Your Private Key</AlertTitle>
											<AlertDescription>
												Save your private key in a secure, offline location. If you lose it, you will lose access to
												your funds forever.
											</AlertDescription>
										</Alert>
										<Button onClick={handleSaveKey} className="w-full">
											<Download className="mr-2 h-4 w-4"/> Save Private Key
										</Button>
									</>
								)}
							</div>
						)}
					</CardContent>
					<CardFooter className="flex justify-end">
						<Button onClick={() => setStep(2)} disabled={!wallet}>
							Next <ArrowRight className="ml-2 h-4 w-4"/>
						</Button>
					</CardFooter>
				</Card>
			)}
			
			{step === 2 && (
				<Card>
					<CardHeader>
						<CardTitle>Step 2: Account Details</CardTitle>
						<CardDescription>Fill in the primary details for the exchange account.</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label htmlFor="nid">Node ID (nid)</Label>
							<Input
								id="nid"
								name="nid"
								value={account.nid}
								onChange={(e) => setAccount((p) => ({...p, nid: e.target.value}))}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="exchange">Exchange</Label>
							<Select
								name="exchange"
								value={account.exchange}
								onValueChange={(value) => setAccount((p) => ({...p, exchange: value}))}
							>
								<SelectTrigger id="exchange">
									<SelectValue placeholder="Select exchange"/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="binance">Binance</SelectItem>
									<SelectItem value="kraken">Kraken</SelectItem>
									<SelectItem value="coinbase">Coinbase</SelectItem>
									<SelectItem value="bybit">Bybit</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="apiKey">API Key</Label>
							<Input
								id="apiKey"
								name="apiKey"
								type="password"
								value={account.apiKey}
								onChange={(e) => setAccount((p) => ({...p, apiKey: e.target.value}))}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="secret">API Secret</Label>
							<Input
								id="secret"
								name="secret"
								type="password"
								value={account.secret}
								onChange={(e) => setAccount((p) => ({...p, secret: e.target.value}))}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">API Password (Optional)</Label>
							<Input
								id="password"
								name="password"
								type="password"
								value={account.password || ""}
								onChange={(e) => setAccount((p) => ({...p, password: e.target.value}))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								name="status"
								value={account.status}
								onValueChange={(value: "active" | "learn" | "stopped") => setAccount((p) => ({...p, status: value}))}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="Select status"/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="learn">Learn</SelectItem>
									<SelectItem value="stopped">Stopped</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="note">Note</Label>
							<Textarea
								id="note"
								name="note"
								value={account.note}
								onChange={(e) => setAccount((p) => ({...p, note: e.target.value}))}
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="viewers">Viewers (comma-separated addresses)</Label>
							<Textarea
								id="viewers"
								name="viewers"
								value={viewersStr}
								onChange={(e) => setViewersStr(e.target.value)}
								placeholder="g..., g..., g..."
							/>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" onClick={() => setStep(1)}>
							<ArrowLeft className="mr-2 h-4 w-4"/> Back
						</Button>
						<Button onClick={() => setStep(3)}>
							Next <ArrowRight className="ml-2 h-4 w-4"/>
						</Button>
					</CardFooter>
				</Card>
			)}
			
			{step === 3 && (
				<Card>
					<CardHeader>
						<CardTitle>Step 3: Protocol Configuration</CardTitle>
						<CardDescription>Set the trading strategy parameters for this account.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="pb-6">
							<Button type="button" variant="outline" onClick={() => setProtocol(annaAriadnaStrategy)}>
								<Sparkles className="mr-2 h-4 w-4 text-yellow-500"/>
								Load 'Anna Ariadna' Strategy
							</Button>
						</div>
						<Accordion type="single" collapsible className="w-full" defaultValue="item-1">
							<AccordionItem value="item-1">
								<AccordionTrigger>View & Edit Parameters</AccordionTrigger>
								<AccordionContent className="pt-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* All protocol fields here, simplified for brevity */}
										<div className="space-y-2">
											<Label>Strategy</Label>
											<Input
												value={protocol.strategy}
												onChange={(e) => setProtocol((p) => ({...p, strategy: e.target.value}))}
											/>
										</div>
										<div className="space-y-2">
											<Label>Trading Style</Label>
											<Input
												value={protocol.tradingStyle}
												onChange={(e) => setProtocol((p) => ({...p, tradingStyle: e.target.value}))}
											/>
										</div>
										<div className="space-y-2">
											<Label>Max Risk Per Trade (%)</Label>
											<Input
												type="number"
												value={protocol.maxRiskPerTrade}
												onChange={(e) =>
													setProtocol((p) => ({...p, maxRiskPerTrade: Number.parseFloat(e.target.value)}))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>Risk/Reward Ratio</Label>
											<Input
												type="number"
												value={protocol.riskRewardRatio}
												onChange={(e) =>
													setProtocol((p) => ({...p, riskRewardRatio: Number.parseFloat(e.target.value)}))
												}
											/>
										</div>
										<div className="flex items-center space-x-2 pt-6">
											<Checkbox
												id="hedgingEnabled"
												checked={protocol.hedgingEnabled}
												onCheckedChange={(checked) => setProtocol((p) => ({...p, hedgingEnabled: !!checked}))}
											/>
											<Label htmlFor="hedgingEnabled">Hedging Enabled</Label>
										</div>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" onClick={() => setStep(2)}>
							<ArrowLeft className="mr-2 h-4 w-4"/> Back
						</Button>
						<Button onClick={handleReview}>Review & Sign</Button>
					</CardFooter>
				</Card>
			)}
			
			{step === 4 && finalResult && (
				<Card>
					<CardHeader>
						<CardTitle>Process Complete</CardTitle>
						<CardDescription>The signed payload has been generated successfully.</CardDescription>
					</CardHeader>
					<CardContent>
            <pre className="w-full bg-muted p-4 rounded-md text-xs overflow-x-auto">
              {JSON.stringify(finalResult, null, 2)}
            </pre>
					</CardContent>
					<CardFooter className="flex justify-end">
						<Button onClick={startOver}>Start Over</Button>
					</CardFooter>
				</Card>
			)}
			
			<Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Confirm & Sign Data</DialogTitle>
						<DialogDescription>
							Review the final JSON payload below. If correct, confirm to apply your cryptographic signature. This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="my-4 max-h-[50vh] overflow-y-auto rounded-md border bg-muted">
						<pre className="p-4 text-xs">{JSON.stringify(payloadToSign, null, 2)}</pre>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleConfirmAndSign}>Confirm & Sign</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
