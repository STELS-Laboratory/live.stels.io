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
      <Card className="bg-card border">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
            <div className="relative p-2 border border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
              <Wallet className="h-6 w-6 text-amber-500" />
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
            <Card
              className="relative cursor-pointer transition-colors hover:border-amber-500/50 bg-card border"
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
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border hover:border-amber-500/50 transition-colors" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border hover:border-amber-500/50 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border hover:border-amber-500/50 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border hover:border-amber-500/50 transition-colors" />

              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="relative p-4 border-2 border-amber-500/30 bg-amber-500/10">
                      <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-amber-500/50" />
                      <Sparkles className="h-8 w-8 text-amber-500" />
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
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Existing Wallet */}
            <Card
              className="relative cursor-pointer transition-colors hover:border-blue-500/50 bg-card border"
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
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border hover:border-blue-500/50 transition-colors" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border hover:border-blue-500/50 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border hover:border-blue-500/50 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border hover:border-blue-500/50 transition-colors" />

              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="relative p-4 border-2 border-blue-500/30 bg-blue-500/10">
                      <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-blue-500/50" />
                      <Key className="h-8 w-8 text-blue-500" />
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
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <div className="relative mt-8 p-4 bg-green-500/5 border border-green-500/30">
            {/* Corner accents */}
            <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-green-500/50" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-green-500/50" />

            <div className="flex items-start gap-3">
              <div className="p-2 border border-green-500/30 bg-green-500/10">
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
