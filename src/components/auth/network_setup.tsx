import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Network,
  Server,
  Shield,
  Wifi,
} from "lucide-react";
import { type NetworkConfig, useAuthStore } from "@/stores/modules/auth.store";
import { NetworkSelectorCompact } from "./network_selector_compact";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";

interface NetworkSetupProps {
  onBack: () => void;
  onConnect: () => void;
}

/**
 * Professional network setup component
 */
export function NetworkSetup(
  { onBack, onConnect }: NetworkSetupProps,
): React.ReactElement {
  console.log("[NetworkSetup] Component rendered");
  const {
    selectedNetwork,
    connectionError,
    isConnecting,
  } = useAuthStore();

  const getNetworkIcon = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return <Shield className="h-5 w-5 text-primary" />;
      case "mainnet":
        return <Server className="h-5 w-5 text-accent-foreground" />;
      case "localnet":
        return <Network className="h-5 w-5 text-secondary-foreground" />;
      default:
        return <Network className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNetworkStatusColor = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return "bg-primary/20 text-primary border-primary/30";
      case "mainnet":
        return "bg-accent text-accent-foreground border-accent-foreground/30";
      case "localnet":
        return "bg-secondary text-secondary-foreground border-secondary-foreground/30";
      default:
        return "bg-muted/20 text-muted-foreground border-border";
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Network Setup Card */}
      <Card className="bg-transparent border-0">
        <CardHeader className="text-center pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
          {/* Lottie Animation - Network Connection */}
          <div className="flex h-20 sm:h-24 md:h-32 items-center justify-center mb-2 sm:mb-3">
            <DotLottieReact
              src={LOTTIE_ANIMATIONS.network}
              loop
              autoplay
              style={LOTTIE_SIZES.small}
            />
          </div>

          <CardTitle className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold">
            <span className="text-foreground">
              Select Network
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed px-2">
            Your wallet is ready. Choose a network to connect to the STELS Web 5
            platform and begin building autonomous web agents.
          </p>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-2 sm:space-y-3">
          {/* Network Selector Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-card-foreground flex items-center gap-1.5 sm:gap-2">
                <Wifi className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                Network Selection
              </h3>
              {selectedNetwork && (
                <Badge
                  className={`text-[10px] sm:text-xs ${
                    getNetworkStatusColor(selectedNetwork)
                  }`}
                >
                  {selectedNetwork.developer ? "Dev" : "Prod"}
                </Badge>
              )}
            </div>

            {/* Network Selector */}
            <div className="p-2.5 sm:p-3 md:p-4 bg-muted/50 border border-border rounded">
              <NetworkSelectorCompact />
            </div>
          </div>

          {/* Error Display */}
          {connectionError && (
            <Alert
              variant="destructive"
              className="border-red-500/30 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Selected Network Summary */}
          {selectedNetwork && (
            <div className="p-2.5 sm:p-3 md:p-4 bg-amber-500/10 border border-amber-500/30 rounded">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center flex-shrink-0 ${
                      selectedNetwork.id === "testnet"
                        ? "bg-blue-500"
                        : selectedNetwork.id === "mainnet"
                        ? "bg-emerald-500"
                        : "bg-purple-500"
                    }`}
                  >
                    {getNetworkIcon(selectedNetwork)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-xs sm:text-sm truncate">
                      Ready to connect to {selectedNetwork.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {selectedNetwork.description}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/70 mt-0.5 sm:mt-1 truncate">
                      {selectedNetwork.api}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="hidden sm:inline">Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Information */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-green-500/10 border border-green-500/30 rounded">
            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-1 sm:p-1.5 rounded border border-green-500/30 bg-green-500/10 flex-shrink-0">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-xs">
                  Secure Connection
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                  Your connection will be encrypted and authenticated using your
                  wallet's private key. All data transmission is secured with
                  industry-standard encryption protocols.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              disabled={isConnecting}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="">Back</span>
            </Button>
            <Button
              onClick={() => {
                console.log("[NetworkSetup] Connect button clicked");
                console.log("[NetworkSetup] selectedNetwork:", selectedNetwork);
                console.log("[NetworkSetup] isConnecting:", isConnecting);
                onConnect();
              }}
              disabled={!selectedNetwork || isConnecting}
              className="flex-1 h-9 sm:h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm"
            >
              {isConnecting
                ? (
                  <>
                    <div className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-black border-t-transparent rounded-full mr-1.5 sm:mr-2" />
                    <span className="hidden xs:inline">Connecting...</span>
                    <span className="xs:hidden">...</span>
                  </>
                )
                : (
                  <>
                    <span className="hidden sm:inline">Connect to Network</span>
                    <span className="sm:hidden">Connect</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
                  </>
                )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
