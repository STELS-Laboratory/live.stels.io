import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/stores/modules/auth.store";
import { NetworkSetup } from "./network-setup";
import { GitHubAuth } from "./github-auth";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie-config";
import type {
  ProfessionalConnectionFlowProps,
  StepType,
} from "@/types/auth/types";

/**
 * Step configuration with progress and titles
 */
const STEP_CONFIG: Record<StepType, { progress: number; title: string }> = {
  network: { progress: 20, title: "Select Network" },
  connecting: { progress: 60, title: "GitHub Authentication" },
  success: { progress: 100, title: "Welcome!" },
};

/**
 * Animation variants for step transitions
 */
const stepVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
};

/**
 * Professional authentication flow with step-by-step process
 * Optimized with memoization and smooth animations
 */
export function ProfessionalConnectionFlow({
  onSuccess,
}: ProfessionalConnectionFlowProps = {}): React.ReactElement {
  const { isConnected, connectionSession } = useAuthStore();

  // Flow steps - start with network selection for GitHub auth
  const [currentStep, setCurrentStep] = useState<StepType>("network");

  // Auto-advance to connecting step if there's a pending GitHub OAuth callback
  useEffect(() => {
    const pendingCode = sessionStorage.getItem("github_oauth_pending_code");
    const pendingState = sessionStorage.getItem("github_oauth_pending_state");
    const storedState = sessionStorage.getItem("github_oauth_state");

    // If we have pending callback and valid state, go to connecting step
    if (
      pendingCode && pendingState && storedState === pendingState &&
      currentStep === "network"
    ) {
      setCurrentStep("connecting");
    }
  }, [currentStep]);

  // Reset to initial step if not connected
  useEffect(() => {
    if (!isConnected && currentStep === "success") {
      setCurrentStep("network");
    }
  }, [isConnected, currentStep]);

  // Auto-advance to success if connected
  useEffect(() => {
    if (isConnected && connectionSession && currentStep === "connecting") {
      setCurrentStep("success");
    }
  }, [isConnected, connectionSession, currentStep]);

  // Call onSuccess callback when authentication is complete
  useEffect(() => {
    if (
      isConnected && connectionSession && currentStep === "success" && onSuccess
    ) {
      // Small delay to show success screen before closing
      const timer = setTimeout(() => {
        onSuccess();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionSession, currentStep, onSuccess]);

  // Memoized handlers to prevent unnecessary re-renders

  const handleNetworkConnect = useCallback(async (): Promise<void> => {
    // For GitHub auth, go directly to GitHub auth step
    setCurrentStep("connecting");
  }, []);

  const handleConnectionSuccess = useCallback((): void => {
    setCurrentStep("success");
  }, []);

  const handleConnectionError = useCallback((): void => {
    // Stay on connecting step to show error and retry option
  }, []);

  // Memoized step rendering
  const renderStep = useCallback(() => {
    switch (currentStep) {
      case "network":
        return (
          <NetworkSetup
            onBack={() => {}}
            onConnect={handleNetworkConnect}
          />
        );

      case "connecting":
        // Show GitHub auth
        return (
          <div className="w-full flex justify-center">
            <GitHubAuth
              onSuccess={handleConnectionSuccess}
              onError={handleConnectionError}
            />
          </div>
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

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-1.5 sm:space-y-2"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Welcome to STELS
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed px-2">
                You are connected to the heterogeneous network
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Alert className="bg-accent/10 border-accent-foreground/30 rounded text-left">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground" />
                <AlertDescription className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  You now have access to the distributed Web OS and can begin
                  building autonomous web agents
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  }, [
    currentStep,
    handleNetworkConnect,
    handleConnectionSuccess,
    handleConnectionError,
  ]);

  // Memoized step configuration
  const stepConfig = useMemo(() => STEP_CONFIG[currentStep], [currentStep]);
  const progress = stepConfig.progress;
  const stepTitle = stepConfig.title;

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
          <div className="w-full bg-muted border border-border h-1.5 md:h-2 rounded-full overflow-hidden relative">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            {/* Progress glow effect */}
            {progress > 0 && progress < 100 && (
              <motion.div
                className="absolute top-0 left-0 h-full bg-primary/30 blur-sm"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            )}
          </div>

          {/* Step Indicators - Hidden on mobile for cleaner look */}
          <div className="hidden md:flex justify-between mt-4">
            {[
              { step: "network" as StepType, label: "Network", progress: 20 },
              {
                step: "connecting" as StepType,
                label: "GitHub Auth",
                progress: 60,
              },
              { step: "success" as StepType, label: "Complete", progress: 100 },
            ].map((item) => {
              const isActive = progress >= item.progress;
              const isCurrent = currentStep === item.step;

              return (
                <motion.div
                  key={item.step}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: item.progress / 100 * 0.2,
                  }}
                >
                  <motion.div
                    className={`w-2 h-2 rounded-full ${
                      isActive
                        ? isCurrent ? "bg-primary" : "bg-accent-foreground"
                        : "bg-border"
                    }`}
                    animate={{
                      scale: isCurrent ? 1.2 : 1,
                      boxShadow: isCurrent
                        ? "0 0 8px rgba(var(--primary), 0.5)"
                        : "none",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.span
                    className={`text-[10px] mt-1.5 font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                    animate={{
                      fontWeight: isCurrent ? 600 : 500,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
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
            {/* Smooth step transitions with AnimatePresence */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
