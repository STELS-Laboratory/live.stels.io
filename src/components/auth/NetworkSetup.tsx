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
import { NetworkSelectorCompact } from "./NetworkSelectorCompact";

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
        return <Network className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getNetworkStatusColor = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "mainnet":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "localnet":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Network Setup Card */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-zinc-900/80 border-zinc-700/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg" />
              <div className="relative p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-sm">
                <Network className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-amber-400 via-white to-orange-400 bg-clip-text text-transparent">
              Select Network
            </span>
          </CardTitle>
          <p className="text-zinc-400 text-lg mt-3 leading-relaxed">
            Your wallet is ready. Choose a network to connect to the SONAR Web3
            platform.
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-8">
          {/* Network Selector Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
                <Wifi className="h-5 w-5 text-amber-400" />
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
            <div className="p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl border border-zinc-700/30 backdrop-blur-sm">
              <NetworkSelectorCompact />
            </div>
          </div>

          {/* Error Display */}
          {connectionError && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Selected Network Summary */}
          {selectedNetwork && (
            <div className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-full blur-lg ${
                        selectedNetwork.id === "testnet"
                          ? "bg-blue-500/20"
                          : selectedNetwork.id === "mainnet"
                          ? "bg-green-500/20"
                          : "bg-purple-500/20"
                      }`}
                    />
                    <div
                      className={`relative p-3 rounded-full ${
                        selectedNetwork.id === "testnet"
                          ? "bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30"
                          : selectedNetwork.id === "mainnet"
                          ? "bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30"
                          : "bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30"
                      } backdrop-blur-sm`}
                    >
                      {getNetworkIcon(selectedNetwork)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-amber-400 text-lg">
                      Ready to connect to {selectedNetwork.name}
                    </div>
                    <div className="text-sm text-zinc-300 mt-1">
                      {selectedNetwork.description}
                    </div>
                    <div className="text-xs font-mono text-zinc-500 mt-2">
                      {selectedNetwork.api}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Information */}
          <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-green-300 mb-2 text-lg">
                  🔒 Secure Connection
                </div>
                <div className="text-green-200/80 text-sm leading-relaxed">
                  Your connection will be encrypted and authenticated using your
                  wallet's private key. All data transmission is secured with
                  industry-standard encryption protocols.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 border-zinc-700/50 hover:border-zinc-600/50 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-300"
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
              className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-900 shadow-lg shadow-amber-500/25 transition-all duration-300"
            >
              {isConnecting
                ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-900 mr-2" />
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

      {/* Custom Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fade-in-up {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .animate-fade-in-up {
              animation: fade-in-up 0.8s ease-out forwards;
              opacity: 0;
            }
          `,
        }}
      />
    </div>
  );
}
