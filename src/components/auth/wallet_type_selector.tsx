import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Key, Shield, Sparkles, Wallet } from "lucide-react";

interface WalletTypeSelectorProps {
  onSelectType: (type: "create" | "import") => void;
}

/**
 * Professional Wallet type selector component
 */
export function WalletTypeSelector(
  { onSelectType }: WalletTypeSelectorProps,
): React.ReactElement {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="backdrop-blur-md bg-zinc-900/80 border border-zinc-800">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-black" />
            </div>
            <span className="text-foreground">
              Choose Setup Method
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl mx-auto">
            Select how you want to set up your Gliesereum wallet. Both options
            are secure and encrypted.
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Create New Wallet */}
            <div
              className="group cursor-pointer bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden hover:border-amber-500/50 transition-all"
              onClick={() => onSelectType("create")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectType("create");
                }
              }}
              aria-label="Create new wallet - Generate a completely new wallet with a unique private key"
            >
              <div className="p-6">
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-black" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Create New Wallet
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Generate a completely new wallet with a unique private key
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-medium">
                    <span>Get started</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Import Existing Wallet */}
            <div
              className="group cursor-pointer bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden hover:border-blue-500/50 transition-all"
              onClick={() => onSelectType("import")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectType("import");
                }
              }}
              aria-label="Import existing wallet - Restore your wallet using your existing private key"
            >
              <div className="p-6">
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Key className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Import Existing Wallet
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Restore your wallet using your existing private key
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className="flex items-center justify-center gap-2 text-blue-500 text-xs font-medium">
                    <span>Restore wallet</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg border border-green-500/30 bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-1 text-sm">
                  Security Guarantee
                </div>
                <div className="text-muted-foreground text-xs">
                  Your private key is generated and stored securely in your
                  browser using advanced encryption. We never have access to
                  your private keys or funds - everything stays local to your
                  device.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
