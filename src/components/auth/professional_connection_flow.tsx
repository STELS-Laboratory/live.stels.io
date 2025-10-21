import React, { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { WalletTypeSelector } from "./wallet_type_selector";
import { WalletCreator } from "./wallet_creator";
import { WalletConfirmation } from "./wallet_confirmation";
import { NetworkSetup } from "./network_setup";
import { ConnectionProcess } from "./connection_process";

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
          <div className="text-center space-y-4 max-w-md mx-auto">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Welcome to STELS Web3
              </h2>
              <p className="text-muted-foreground text-sm">
                Your wallet is connected and ready to use
              </p>
            </div>
            <Alert className="bg-green-500/10 border-green-500/30 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-muted-foreground text-xs">
                You can now access all features of the STELS Web3 platform
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
    <div className="bg-background flex flex-1 justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Web3 Platform
          </h1>
          <p className="text-muted-foreground text-lg">
            Secure cryptocurrency wallet and trading platform
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">
              {stepTitle}
            </span>
            <span className="text-xs font-bold text-foreground">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-muted border border-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-3">
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
                    className={`w-2 h-2 rounded-full transition-all ${
                      isActive
                        ? isCurrent ? "bg-amber-500" : "bg-green-500"
                        : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 transition-colors font-medium ${
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

        {/* Step Content */}
        <div className="flex justify-center">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
