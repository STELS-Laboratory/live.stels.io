import React from "react";
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
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "mainnet":
        return <Server className="h-5 w-5 text-green-500" />;
      case "localnet":
        return <Network className="h-5 w-5 text-purple-500" />;
      default:
        return <Network className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNetworkStatusColor = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "mainnet":
        return "bg-green-500/20 text-green-700 dark:text-green-600 border-green-500/30";
      case "localnet":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-muted/20 text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Setup Card */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-md bg-card/80 border border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl font-bold">
            <div className="icon-container-md bg-primary rounded-lg flex items-center justify-center">
              <Network className="icon-lg text-primary-foreground" />
            </div>
            <span className="text-foreground">
              Select Network
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Your wallet is ready. Choose a network to connect to the STELS Web 5
            platform and begin building autonomous web agents.
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4">
          {/* Network Selector Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Wifi className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                Network Selection
              </h3>
              {selectedNetwork && (
                <Badge
                  className={`text-xs ${
                    getNetworkStatusColor(selectedNetwork)
                  }`}
                >
                  {selectedNetwork.developer ? "Development" : "Production"}
                </Badge>
              )}
            </div>

            {/* Network Selector */}
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
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
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`icon-container-sm rounded-lg flex items-center justify-center ${
                      selectedNetwork.id === "testnet"
                        ? "bg-blue-500"
                        : selectedNetwork.id === "mainnet"
                        ? "bg-emerald-500"
                        : "bg-purple-500"
                    }`}
                  >
                    {getNetworkIcon(selectedNetwork)}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">
                      Ready to connect to {selectedNetwork.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {selectedNetwork.description}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/70 mt-1">
                      {selectedNetwork.api}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Information */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg border border-green-500/30 bg-green-500/10">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-1 text-xs">
                  Secure Connection
                </div>
                <div className="text-muted-foreground text-xs">
                  Your connection will be encrypted and authenticated using your
                  wallet's private key. All data transmission is secured with
                  industry-standard encryption protocols.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-10"
              disabled={isConnecting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wallet
            </Button>
            <Button
              onClick={() => {
                console.log("[NetworkSetup] Connect button clicked");
                console.log("[NetworkSetup] selectedNetwork:", selectedNetwork);
                console.log("[NetworkSetup] isConnecting:", isConnecting);
                onConnect();
              }}
              disabled={!selectedNetwork || isConnecting}
              className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              {isConnecting
                ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                    Connecting...
                  </>
                )
                : (
                  <>
                    Connect to Network
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
