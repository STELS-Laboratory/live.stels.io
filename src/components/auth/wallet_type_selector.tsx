import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Container, Github, Send, Shield } from "lucide-react";
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
            Select how you want to set up your Gliesereum wallet. Both options
            are secure and encrypted.
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

          {/* Marketing Block */}
          <div className="mt-3 sm:mt-4 md:mt-6 p-3 sm:p-4 md:p-5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 rounded">
            <div className="space-y-3 sm:space-y-4">
              {/* Title & Description */}
              <div className="text-center space-y-1.5 sm:space-y-2">
                <h3 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
                  The Next Era of Distributed AI
                </h3>
                <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
                  STELS Web 5 is a decentralized platform for creating
                  AI-powered autonomous agents that operate across heterogeneous
                  networks. Build, deploy, and manage intelligent workflows with
                  blockchain-level security.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/20 border border-primary/40 rounded">
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-primary">
                    Distributed Execution
                  </span>
                </div>
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-accent/20 border border-accent-foreground/40 rounded">
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-accent-foreground">
                    Real-time WebSocket
                  </span>
                </div>
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 border border-green-500/40 rounded">
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-green-700 dark:text-green-400">
                    Blockchain Security
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-2 sm:pt-3">
                <a
                  href="https://github.com/STELS-Laboratory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card/80 border border-border hover:border-primary/50 hover:bg-primary/5 rounded transition-all duration-300 active:scale-95 w-full sm:w-auto justify-center"
                  aria-label="Visit STELS Laboratory on GitHub"
                >
                  <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    GitHub
                  </span>
                </a>

                <a
                  href="https://hub.docker.com/u/gliesereum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card/80 border border-border hover:border-blue-500/50 hover:bg-blue-500/5 rounded transition-all duration-300 active:scale-95 w-full sm:w-auto justify-center"
                  aria-label="View Gliesereum on Docker Hub"
                >
                  <Container className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground group-hover:text-blue-500 transition-colors" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground group-hover:text-blue-500 transition-colors">
                    Docker Hub
                  </span>
                </a>

                <a
                  href="https://t.me/stelsio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card/80 border border-border hover:border-blue-400/50 hover:bg-blue-400/5 rounded transition-all duration-300 active:scale-95 w-full sm:w-auto justify-center"
                  aria-label="Join STELS community on Telegram"
                >
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground group-hover:text-blue-400 transition-colors" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground group-hover:text-blue-400 transition-colors">
                    Telegram
                  </span>
                </a>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 sm:pt-3 border-t border-border/50">
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80">
                  Open Source • Decentralized • Secure
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-1">
                  © 2025 Gliesereum Ukraine. Licensed under MIT.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
