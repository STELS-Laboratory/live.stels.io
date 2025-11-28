import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield } from "lucide-react";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";

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
    <div className="w-full">
      <Card className="bg-transparent border-0">
        <CardHeader className="text-center pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
          {/* Lottie Animation - Wallet */}
          <div className="flex h-20 sm:h-24 md:h-32 items-center justify-center mb-2 sm:mb-3">
            <DotLottieReact
              src={LOTTIE_ANIMATIONS.walletMain}
              loop
              speed={0.5}
              autoplay
              style={LOTTIE_SIZES.large}
            />
          </div>

          <CardTitle className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-lg sm:text-xl md:text-2xl font-bold">
            <span className="text-foreground">
              Choose Setup Method
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2 md:mt-3 max-w-2xl mx-auto leading-relaxed px-2">
            Choose to create a new wallet or import an existing one to get started.
          </p>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {/* Create New Wallet */}
            <div
              className="group cursor-pointer bg-card rounded border border-border overflow-hidden hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 active:scale-[0.98]"
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
              <div className="p-3 sm:p-4 md:p-6">
                <div className="text-center space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground mb-1 sm:mb-1.5">
                      Create New Wallet
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed px-1">
                      Generate a completely new wallet with a unique private key
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-primary text-xs sm:text-sm font-medium pt-1">
                    <span>Get started</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Import Existing Wallet */}
            <div
              className="group cursor-pointer bg-card rounded border border-border overflow-hidden hover:border-secondary-foreground/50 hover:bg-secondary/20 transition-all duration-300 active:scale-[0.98]"
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
              <div className="p-3 sm:p-4 md:p-6">
                <div className="text-center space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground mb-1 sm:mb-1.5">
                      Import Existing Wallet
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed px-1">
                      Restore your wallet using your existing private key
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-secondary-foreground text-xs sm:text-sm font-medium pt-1">
                    <span>Restore wallet</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-3 sm:mt-4 md:mt-6 p-2.5 sm:p-3 md:p-4 bg-accent/10 border border-accent-foreground/30 rounded">
            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-1 sm:p-1.5 rounded border border-accent-foreground/30 bg-accent/10 flex-shrink-0">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-xs md:text-sm">
                  Security Guarantee
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
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
