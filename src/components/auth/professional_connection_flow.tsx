import React, { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { WalletTypeSelector } from "./wallet_type_selector";
import { WalletCreator } from "./wallet_creator";
import { WalletConfirmation } from "./wallet_confirmation";
import { NetworkSetup } from "./network_setup";
import { ConnectionProcess } from "./connection_process";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";

/**
 * Professional authentication flow with step-by-step process
 */
export function ProfessionalConnectionFlow(): React.ReactElement {
  const { isConnected, connectionSession, connectToNode } = useAuthStore();

  // Flow steps
  const [currentStep, setCurrentStep] = useState<
    "type" | "create" | "confirm" | "network" | "connecting" | "success"
  >("type");
  const [walletType, setWalletType] = useState<"create" | "import">("create");

  // Reset to initial step if not connected
  useEffect(() => {
    if (!isConnected && currentStep === "success") {
      setCurrentStep("type");
    }
  }, [isConnected, currentStep]);

  // Auto-advance to success if connected
  useEffect(() => {
    if (isConnected && connectionSession && currentStep === "connecting") {
      setCurrentStep("success");
    }
  }, [isConnected, connectionSession, currentStep]);

  const handleTypeSelect = (type: "create" | "import"): void => {
    setWalletType(type);
    setCurrentStep("create");
  };

  const handleCreateSuccess = (): void => {
    setCurrentStep("confirm");
  };

  const handleConfirmSuccess = (): void => {
    setCurrentStep("network");
  };

  const handleNetworkConnect = async (): Promise<void> => {
    console.log("[ProfessionalConnectionFlow] Starting network connection...");
    setCurrentStep("connecting");
    // Start the actual connection process
    try {
      console.log("[ProfessionalConnectionFlow] Calling connectToNode...");
      const result = await connectToNode();
      console.log("[ProfessionalConnectionFlow] connectToNode result:", result);
    } catch (error) {
      console.error("[ProfessionalConnectionFlow] Connection failed:", error);
      // Error handling is done in ConnectionProcess component
    }
  };

  const handleConnectionSuccess = (): void => {
    setCurrentStep("success");
  };

  const handleConnectionError = (): void => {
    // Stay on connecting step to show error and retry option
  };

  const handleBackToType = (): void => {
    setCurrentStep("type");
  };

  const handleBackToCreate = (): void => {
    setCurrentStep("create");
  };

  const handleBackToConfirm = (): void => {
    setCurrentStep("confirm");
  };

  const handleBackToNetwork = (): void => {
    setCurrentStep("network");
  };

  const renderStep = () => {
    switch (currentStep) {
      case "type":
        return <WalletTypeSelector onSelectType={handleTypeSelect} />;

      case "create":
        return (
          <WalletCreator
            walletType={walletType}
            onBack={handleBackToType}
            onSuccess={handleCreateSuccess}
          />
        );

      case "confirm":
        return (
          <WalletConfirmation
            walletType={walletType}
            onConfirm={handleConfirmSuccess}
            onBack={handleBackToCreate}
          />
        );

      case "network":
        return (
          <NetworkSetup
            onBack={handleBackToConfirm}
            onConnect={handleNetworkConnect}
          />
        );

      case "connecting":
        return (
          <ConnectionProcess
            onBack={handleBackToNetwork}
            onSuccess={handleConnectionSuccess}
            onError={handleConnectionError}
          />
        );

      case "success":
        return (
          <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 max-w-lg mx-auto px-2 sm:px-4">
            {/* Lottie Animation - Success Celebration */}
            <div className="flex h-32 sm:h-40 md:h-48 items-center justify-center">
              <DotLottieReact
                src={LOTTIE_ANIMATIONS.celebration}
                autoplay
                style={LOTTIE_SIZES.xlarge}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Welcome to STELS
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed px-2">
                Your wallet is connected to the heterogeneous network
              </p>
            </div>

            <Alert className="bg-accent/10 border-accent-foreground/30 rounded text-left">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground" />
              <AlertDescription className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-relaxed">
                You now have access to the distributed Web OS and can begin
                building autonomous web agents
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "type":
        return 0;
      case "create":
        return 20;
      case "confirm":
        return 40;
      case "network":
        return 60;
      case "connecting":
        return 80;
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "type":
        return "Choose Setup Method";
      case "create":
        return walletType === "create" ? "Create New Wallet" : "Import Wallet";
      case "confirm":
        return "Confirm Wallet";
      case "network":
        return "Select Network";
      case "connecting":
        return "Connecting...";
      case "success":
        return "Welcome!";
      default:
        return "";
    }
  };

  const progress = getStepProgress();
  const stepTitle = getStepTitle();

  return (
    <div className="bg-background flex h-fit justify-center items-start overflow-hidden">
      <div className="w-full h-full max-w-4xl flex flex-col px-3 sm:px-4 md:px-6">
	      <div className="h-0 sm:h-0 md:h-0 flex justify-center items-center text-4xl font-bold text-primary">
		     
	      </div>
        {/* Progress Indicator - Fixed at top with padding */}
        <div className="flex-shrink-0 max-w-3xl mx-auto w-full pt-4 sm:pt-6 md:pt-12 lg:pt-16 pb-8 sm:pb-5 md:pb-8">
          <div className="flex items-center justify-between mt-1.5 sm:mt-2 md:mt-3 mb-1.5 sm:mb-2 md:mb-3">
            <span className="text-[11px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">
              {stepTitle}
            </span>
            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-primary ml-2">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-muted border border-border h-1.5 md:h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Indicators - Hidden on mobile for cleaner look */}
          <div className="hidden md:flex justify-between mt-4">
            {[
              { step: "type", label: "Setup", progress: 20 },
              { step: "create", label: "Wallet", progress: 40 },
              { step: "confirm", label: "Confirm", progress: 60 },
              { step: "network", label: "Network", progress: 80 },
              { step: "connecting", label: "Connect", progress: 100 },
            ].map((item) => {
              const isActive = progress >= item.progress;
              const isCurrent = currentStep === item.step;

              return (
                <div key={item.step} className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? isCurrent
                          ? "bg-primary ring-2 ring-primary/30"
                          : "bg-accent-foreground"
                        : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1.5 transition-colors font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content - Scrollable area with smooth iOS scrolling */}
        <div
          className="overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="w-full max-w-4xl mx-auto pb-6 sm:pb-8 md:pb-10">
            {/* Fade transition with key for proper animation on step change */}
            <div
              key={currentStep}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
            >
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
