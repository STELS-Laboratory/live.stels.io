/**
 * Lottie Animation URLs Configuration
 * Centralized configuration for all Lottie animations in auth flow
 * Modern, thematic animations optimized for professional UX
 */

export const LOTTIE_ANIMATIONS = {
  // WalletTypeSelector animations - Wallet & Security theme (amber/gold)
  walletMain: "https://lottie.host/0e9dd65f-f18d-489b-88c1-eeb2218b735d/DAzEJFWnNZ.json", // Elegant wallet icon
  walletCreate: "https://lottie.host/ec1278be-1aa1-45dc-a9f9-65ca8fca6f1e/MjZ123tAmp.json", // Magic sparkles creation
  walletImport: "https://lottie.host/a49b2869-cc56-4425-9a19-6cde2b1b7919/di1je0kuBl.json", // FIXED: Using walletCreate (403 error on original)

  // WalletCreator animations - Generation & Import theme
  creating: "https://lottie.host/959817d2-7099-402d-8913-67015b4bc9b3/uvwVTUUtnB.json", // FIXED: Using connecting animation (403 error on original)
  importing: "https://lottie.host/8d829337-70a0-40c1-9ae9-e55085d7e279/9JGJmBjMGu.json", // FIXED: Using connecting animation (403 error on original)

  // WalletConfirmation animation - Success & Verification theme (green accent)
  success: "https://lottie.host/b6668d2f-fc0a-4678-9f3d-378193301306/XJ0mKGjN0b.json", // Success checkmark circle

  // NetworkSetup animation - Network & Globe theme (blue/tech)
  network: "https://lottie.host/a9dd7309-d9a5-4a49-bd0f-611682003e92/EifgNUZKhC.json", // Globe with network nodes

  // ConnectionProcess animations - Dynamic states
  connecting: "https://assets10.lottiefiles.com/packages/lf20_usmfx6bp.json", // Smooth circular pulse
  connected: "https://lottie.host/8d829337-70a0-40c1-9ae9-e55085d7e279/9JGJmBjMGu.json", // FIXED: Using success animation (403 error on original)
  error: "https://assets7.lottiefiles.com/packages/lf20_tbjuenb2.json", // Error X shake

  // Success celebration - Grand finale (multi-color gold)
  celebration: "https://assets6.lottiefiles.com/packages/lf20_rovf9gzu.json", // Confetti celebration
} as const;

/**
 * Animation sizes configuration
 */
export const LOTTIE_SIZES = {
  superSmall: { width: "20px", height: "20px" },
  small: { width: "80px", height: "80px" },
  medium: { width: "100px", height: "100px" },
  large: { width: "120px", height: "120px" },
  xlarge: { width: "160px", height: "160px" },
} as const;

/**
 * Default animation props
 */
export const DEFAULT_LOTTIE_PROPS = {
  loop: true,
  autoplay: true,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
} as const;

/**
 * Animation metadata for better UX
 */
export const ANIMATION_METADATA = {
  walletMain: { theme: "security", mood: "trustworthy", colors: ["amber", "gold"] },
  walletCreate: { theme: "creation", mood: "exciting", colors: ["amber", "yellow"] },
  walletImport: { theme: "security", mood: "secure", colors: ["blue", "gray"] },
  creating: { theme: "process", mood: "patient", colors: ["amber", "orange"] },
  importing: { theme: "process", mood: "restoring", colors: ["blue", "cyan"] },
  success: { theme: "achievement", mood: "accomplished", colors: ["green", "emerald"] },
  network: { theme: "technology", mood: "connected", colors: ["blue", "cyan"] },
  connecting: { theme: "process", mood: "active", colors: ["amber", "orange"] },
  connected: { theme: "achievement", mood: "victorious", colors: ["green", "emerald"] },
  error: { theme: "alert", mood: "attention", colors: ["red", "orange"] },
  celebration: { theme: "celebration", mood: "joyful", colors: ["gold", "rainbow"] },
} as const;
