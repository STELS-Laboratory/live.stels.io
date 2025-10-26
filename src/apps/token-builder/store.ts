/**
 * Token Builder Store
 * Zustand store for managing token creation state
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  TokenBuilderStore,
  TokenSchema,
  TokenMetadata,
  TokenEconomics,
  GovernanceSettings,
  ValidationError,
  TokenGenesisCertificate,
  TokenTemplate,
  ExportFormat,
  WizardStep,
} from "./types";
import { validateTokenSchema } from "./validation";
import { signTokenSchema } from "./signing";

const INITIAL_STEPS: WizardStep[] = [
  {
    id: "type",
    title: "Token Type",
    description: "Choose token standard and type",
    completed: false,
    valid: false,
  },
  {
    id: "metadata",
    title: "Token Information",
    description: "Name, symbol, and description",
    completed: false,
    valid: false,
  },
  {
    id: "economics",
    title: "Token Economics",
    description: "Supply, distribution, and fees",
    completed: false,
    valid: false,
  },
  {
    id: "advanced",
    title: "Advanced Settings",
    description: "Governance, restrictions, and custom fields",
    completed: false,
    valid: false,
  },
  {
    id: "review",
    title: "Review & Sign",
    description: "Review schema and create certificate",
    completed: false,
    valid: false,
  },
];

const INITIAL_SCHEMA: Partial<TokenSchema> = {
  version: "1.0.0",
  technical: {
    network: "STELS Test Network",
    chainId: 2,
    protocol: "smart-1.0",
    encoding: "utf-8",
    hashAlgorithm: "sha256",
  },
};

/**
 * Token Builder Zustand Store
 */
export const useTokenBuilderStore = create<TokenBuilderStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        currentStep: 0,
        steps: INITIAL_STEPS,
        schema: INITIAL_SCHEMA,
        certificate: undefined,
        certificateHistory: [],
        isValid: false,
        errors: {},

        // Actions
        setCurrentStep: (step: number): void => {
          if (step >= 0 && step < get().steps.length) {
            set({ currentStep: step });
          }
        },

        nextStep: (): void => {
          const { currentStep, steps } = get();
          if (currentStep < steps.length - 1) {
            set({ currentStep: currentStep + 1 });
          }
        },

        previousStep: (): void => {
          const { currentStep } = get();
          if (currentStep > 0) {
            set({ currentStep: currentStep - 1 });
          }
        },

        updateSchema: (updates: Partial<TokenSchema>): void => {
          set((state) => ({
            schema: { ...state.schema, ...updates },
          }));
        },

        updateMetadata: (metadata: Partial<TokenMetadata>): void => {
          set((state) => ({
            schema: {
              ...state.schema,
              metadata: { ...state.schema.metadata, ...metadata } as TokenMetadata,
            },
          }));
        },

        updateEconomics: (economics: Partial<TokenEconomics>): void => {
          set((state) => ({
            schema: {
              ...state.schema,
              economics: {
                ...state.schema.economics,
                ...economics,
              } as TokenEconomics,
            },
          }));
        },

        updateGovernance: (governance: Partial<GovernanceSettings>): void => {
          set((state) => ({
            schema: {
              ...state.schema,
              governance: {
                ...state.schema.governance,
                ...governance,
              } as GovernanceSettings,
            },
          }));
        },

        validateSchema: (): ValidationError[] => {
          const { schema } = get();
          const errors = validateTokenSchema(schema as TokenSchema);

          // Update errors in state
          const errorsByField: Record<string, string[]> = {};
          errors.forEach((error) => {
            if (!errorsByField[error.field]) {
              errorsByField[error.field] = [];
            }
            errorsByField[error.field].push(error.message);
          });

          set({
            errors: errorsByField,
            isValid: errors.length === 0,
          });

          return errors;
        },

        signSchema: async (privateKey: string): Promise<TokenGenesisCertificate> => {
          const { schema, certificateHistory } = get();

          // Validate before signing
          const errors = get().validateSchema();
          if (errors.length > 0) {
            throw new Error(
              `Cannot sign invalid schema: ${errors.map((e) => e.message).join(", ")}`,
            );
          }

          // Sign the schema
          const certificate = await signTokenSchema(
            schema as TokenSchema,
            privateKey,
          );

          // Add to history (keep last 10)
          const newHistory = [certificate, ...certificateHistory].slice(0, 10);

          set({ certificate, certificateHistory: newHistory });
          return certificate;
        },

        resetBuilder: (): void => {
          const { certificateHistory } = get();
          set({
            currentStep: 0,
            steps: INITIAL_STEPS,
            schema: INITIAL_SCHEMA,
            certificate: undefined,
            // Keep history when resetting
            certificateHistory: certificateHistory,
            isValid: false,
            errors: {},
          });
        },

        loadTemplate: (template: TokenTemplate): void => {
          set({
            schema: { ...INITIAL_SCHEMA, ...template.schema },
            currentStep: 0,
          });
        },

        exportSchema: (format: ExportFormat): string => {
          const { schema } = get();

          switch (format) {
            case "json":
              return JSON.stringify(schema, null, 2);
            case "yaml":
              // Simple YAML conversion
              return convertToYAML(schema);
            case "typescript":
              return `export const tokenSchema = ${JSON.stringify(schema, null, 2)} as const;`;
            default:
              return JSON.stringify(schema, null, 2);
          }
        },
      }),
      {
        name: "token-builder-store",
        partialize: (state) => ({
          schema: state.schema,
          currentStep: state.currentStep,
          certificate: state.certificate,
          certificateHistory: state.certificateHistory, // Persist history
        }),
      },
    ),
    { name: "Token Builder Store" },
  ),
);

/**
 * Simple YAML conversion helper
 */
function convertToYAML(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);
  let yaml = "";

  if (typeof obj === "object" && obj !== null) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        yaml += `${spaces}- ${convertToYAML(item, indent + 1).trim()}\n`;
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          yaml += `${spaces}${key}:\n${convertToYAML(value, indent + 1)}`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      });
    }
  } else {
    yaml = String(obj);
  }

  return yaml;
}

