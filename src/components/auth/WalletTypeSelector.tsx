import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Key, Shield, Sparkles, Wallet } from "lucide-react";

interface WalletTypeSelectorProps {
  onSelectType: (type: "create" | "import") => void;
}

/**
 * Professional wallet type selector component
 */
export function WalletTypeSelector(
  { onSelectType }: WalletTypeSelectorProps,
): React.ReactElement {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Wallet className="h-6 w-6 text-amber-500" />
          Choose Wallet Setup Method
        </CardTitle>
        <p className="text-zinc-400 mt-2">
          Select how you want to set up your Gliesereum wallet
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Wallet */}
          <div className="group">
            <Card
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-zinc-700/50 hover:border-amber-500/50 bg-zinc-900/50 hover:bg-zinc-800/50"
              onClick={() => onSelectType("create")}
            >
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-amber-500/20 rounded-full">
                      <Sparkles className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Create New Wallet
                    </h3>
                    <p className="text-sm text-zinc-400 mb-4">
                      Generate a completely new wallet with a unique private key
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Unique private key</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Secure generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Ready to use</span>
                    </div>
                  </div>

                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Recommended
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import Existing Wallet */}
          <div className="group">
            <Card
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-zinc-700/50 hover:border-blue-500/50 bg-zinc-900/50 hover:bg-zinc-800/50"
              onClick={() => onSelectType("import")}
            >
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-blue-500/20 rounded-full">
                      <Key className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Import Existing Wallet
                    </h3>
                    <p className="text-sm text-zinc-400 mb-4">
                      Restore your wallet using your existing private key
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Restore access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Keep existing funds</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Secure import</span>
                    </div>
                  </div>

                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    For Existing Users
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-foreground mb-1">
                Security Guarantee
              </div>
              <div className="text-zinc-400">
                Your private key is generated and stored securely in your
                browser. We never have access to your private keys or funds.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
