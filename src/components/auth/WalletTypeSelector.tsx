import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle,
  Key,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

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
    <div className="w-full max-w-4xl mx-auto">
      <Card className="backdrop-blur-sm bg-zinc-900/80 border-zinc-700/50 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg" />
              <Wallet className="relative h-8 w-8 text-amber-400" />
            </div>
            <span className="bg-gradient-to-r from-amber-400 via-white to-blue-400 bg-clip-text text-transparent">
              Choose Setup Method
            </span>
          </CardTitle>
          <p className="text-zinc-400 text-lg mt-3 max-w-2xl mx-auto leading-relaxed">
            Select how you want to set up your Gliesereum wallet. Both options
            are secure and encrypted.
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create New Wallet */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <Card
                className="relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-zinc-700/50 hover:border-amber-500/50 bg-zinc-900/60 hover:bg-zinc-800/60 backdrop-blur-sm group-hover:shadow-amber-500/10"
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
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    {/* Icon with enhanced animation */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-pulse" />
                        <div className="relative p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30 backdrop-blur-sm">
                          <Sparkles className="h-10 w-10 text-amber-400 group-hover:animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-amber-400 transition-colors">
                        Create New Wallet
                      </h3>
                      <p className="text-zinc-400 mb-6 leading-relaxed">
                        Generate a completely new wallet with a unique private
                        key
                      </p>
                    </div>

                    {/* Features with enhanced styling */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        <div className="p-1 bg-green-500/20 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Cryptographically secure key generation</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        <div className="p-1 bg-green-500/20 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Local generation - never leaves your device</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        <div className="p-1 bg-green-500/20 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Ready for immediate use</span>
                      </div>
                    </div>

                    {/* Enhanced badge */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 px-4 py-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="h-5 w-5 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Import Existing Wallet */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <Card
                className="relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-zinc-700/50 hover:border-blue-500/50 bg-zinc-900/60 hover:bg-zinc-800/60 backdrop-blur-sm group-hover:shadow-blue-500/10"
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
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    {/* Icon with enhanced animation */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-pulse" />
                        <div className="relative p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30 backdrop-blur-sm">
                          <Key className="h-10 w-10 text-blue-400 group-hover:animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-400 transition-colors">
                        Import Existing Wallet
                      </h3>
                      <p className="text-zinc-400 mb-6 leading-relaxed">
                        Restore your wallet using your existing private key
                      </p>
                    </div>

                    {/* Features with enhanced styling */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        <div className="p-1 bg-green-500/20 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Restore access to existing funds</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        <div className="p-1 bg-green-500/20 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Keep all your transaction history</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                        <div className="p-1 bg-green-500/20 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Secure validation and import</span>
                      </div>
                    </div>

                    {/* Enhanced badge */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30 px-4 py-2">
                        <Key className="h-3 w-3 mr-1" />
                        For Existing Users
                      </Badge>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Security Notice */}
          <div className="mt-12 p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl border border-zinc-700/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-foreground mb-2 text-lg">
                  🔒 Security Guarantee
                </div>
                <div className="text-zinc-300 leading-relaxed">
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
