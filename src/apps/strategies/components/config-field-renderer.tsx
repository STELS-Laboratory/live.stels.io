/**
 * Config Field Renderer Component
 * Dynamically renders form fields based on configSchema field definitions
 * Aligned with OpenAPI specification
 * 
 * IMPORTANT: For "account" type fields, accounts are filtered by the selected agent's
 * connectedAccounts. This ensures strategies can only use accounts the agent has access to.
 */

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, HelpCircle, Plus, Trash2, Sparkles, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type { StrategyConfigField } from "../types";
import type { Agent } from "@/apps/agents/types";
import { TRADE_CAPABLE_SCOPES } from "@/apps/agents/types";

// ============================================================================
// Main Component Props
// ============================================================================

interface ConfigFieldRendererProps {
  field: StrategyConfigField;
  value: unknown;
  onChange: (fieldId: string, value: unknown) => void;
  allValues?: Record<string, unknown>;
  error?: string;
  disabled?: boolean;
  /** Selected agent - used to filter account options by agent's connectedAccounts */
  selectedAgent?: Agent;
}

// ============================================================================
// Main Component
// ============================================================================

export function ConfigFieldRenderer({
  field,
  value,
  onChange,
  allValues = {},
  error,
  disabled = false,
  selectedAgent,
}: ConfigFieldRendererProps) {
  // Check dependsOn condition
  if (field.dependsOn) {
    const dependentValue = allValues[field.dependsOn.field];
    if (dependentValue !== field.dependsOn.value) {
      return null; // Don't render this field
    }
  }

  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(field.id, newValue);
    },
    [field.id, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={field.id}
          className={cn(
            "text-sm font-medium",
            error && "text-destructive"
          )}
        >
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {field.advanced && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            Advanced
          </Badge>
        )}
        {field.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{field.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <FieldInput
        field={field}
        value={value}
        onChange={handleChange}
        error={error}
        disabled={disabled}
        selectedAgent={selectedAgent}
      />

      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Field Input Component
// ============================================================================

interface FieldInputProps {
  field: StrategyConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  selectedAgent?: Agent;
}

function FieldInput({ field, value, onChange, error, disabled, selectedAgent }: FieldInputProps) {
  switch (field.type) {
    case "string":
      return (
        <StringField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <NumberField
          field={field}
          value={value as number}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    case "boolean":
      return (
        <BooleanField
          field={field}
          value={value as boolean}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "select":
      return (
        <SelectField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    case "multiselect":
      return (
        <MultiselectField
          field={field}
          value={value as string[]}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    case "account":
      return (
        <AccountField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          selectedAgent={selectedAgent}
        />
      );

    case "symbol":
      return (
        <SymbolField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    case "array":
      return (
        <ArrayField
          field={field}
          value={value as string[]}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );

    default:
      return (
        <StringField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
  }
}

// ============================================================================
// String Field
// ============================================================================

interface StringFieldProps {
  field: StrategyConfigField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function StringField({ field, value, onChange, error, disabled }: StringFieldProps) {
  return (
    <Input
      id={field.id}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? `Enter ${field.label?.toLowerCase() ?? "value"}`}
      disabled={disabled}
      className={cn(error && "border-destructive")}
    />
  );
}

// ============================================================================
// Number Field
// ============================================================================

interface NumberFieldProps {
  field: StrategyConfigField;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

function NumberField({ field, value, onChange, error, disabled }: NumberFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        onChange(field.default as number ?? 0);
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          onChange(num);
        }
      }
    },
    [onChange, field.default]
  );

  return (
    <Input
      id={field.id}
      type="number"
      value={value ?? ""}
      onChange={handleChange}
      placeholder={field.placeholder ?? "0"}
      disabled={disabled}
      min={field.min}
      max={field.max}
      step={field.step ?? 1}
      className={cn(error && "border-destructive")}
    />
  );
}

// ============================================================================
// Boolean Field
// ============================================================================

interface BooleanFieldProps {
  field: StrategyConfigField;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function BooleanField({ field, value, onChange, disabled }: BooleanFieldProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Switch
        id={field.id}
        checked={value ?? (field.default as boolean) ?? false}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label htmlFor={field.id} className="text-sm text-muted-foreground cursor-pointer">
        {value ? "Enabled" : "Disabled"}
      </Label>
    </div>
  );
}

// ============================================================================
// Select Field
// ============================================================================

interface SelectFieldProps {
  field: StrategyConfigField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function SelectField({ field, value, onChange, error, disabled }: SelectFieldProps) {
  const options = field.options ?? [];

  return (
    <Select
      value={value ?? (field.default as string) ?? ""}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", error && "border-destructive")}>
        <SelectValue placeholder={field.placeholder ?? `Select ${field.label?.toLowerCase() ?? "option"}`} />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[100]">
        {options.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No options available
          </div>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Multiselect Field
// ============================================================================

interface MultiselectFieldProps {
  field: StrategyConfigField;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

function MultiselectField({ field, value, onChange, error, disabled }: MultiselectFieldProps) {
  const options = field.options ?? [];
  const selectedValues = value ?? [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className={cn(
      "border rounded-md p-3 space-y-2",
      error && "border-destructive"
    )}>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center">No options available</p>
      ) : (
        options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox
              id={`${field.id}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => toggleOption(option.value)}
              disabled={disabled}
            />
            <Label
              htmlFor={`${field.id}-${option.value}`}
              className="text-sm cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))
      )}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {selectedValues.map(v => {
            const opt = options.find(o => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="text-xs">
                {opt?.label ?? v}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Account Field
// ============================================================================

interface AccountFieldProps {
  field: StrategyConfigField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Selected agent - accounts will be filtered to only show those connected to this agent */
  selectedAgent?: Agent;
}

function AccountField({ field, value, onChange, error, disabled, selectedAgent }: AccountFieldProps) {
  const { accounts: allAccounts } = useAccountsStore();

  // Filter accounts based on agent's connectedAccounts
  const availableAccounts = useMemo(() => {
    if (!selectedAgent) {
      // No agent selected - show message instead of accounts
      return [];
    }

    const connectedAccountIds = new Set(
      selectedAgent.connectedAccounts?.map((acc) => acc.accountId) || []
    );

    // Filter to only show accounts that are connected to the selected agent
    return allAccounts.filter((stored) => {
      const accountId = stored.account.nid;
      return connectedAccountIds.has(accountId);
    });
  }, [allAccounts, selectedAgent]);

  // Get the connected account info (for showing scopes)
  const getConnectedAccountInfo = useCallback(
    (accountId: string) => {
      return selectedAgent?.connectedAccounts?.find(
        (acc) => acc.accountId === accountId
      );
    },
    [selectedAgent]
  );

  // Show warning if no agent selected
  if (!selectedAgent) {
    return (
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
          Please select an agent first to see available accounts.
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if agent has no connected accounts
  if (availableAccounts.length === 0) {
    return (
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <Wallet className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
          The selected agent has no connected accounts. 
          Please connect accounts to the agent first in Agent Settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", error && "border-destructive")}>
        <SelectValue placeholder="Select an account" />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[100]">
        {availableAccounts.map((stored) => {
          const account = stored.account;
          const exchange = account.exchange?.toUpperCase() || "UNKNOWN";
          const iconPath = getExchangeIconPath(exchange);
          const label = account.note || account.nid || account.uid || "Account";
          const connectedInfo = getConnectedAccountInfo(account.nid);
          const scopes = connectedInfo?.grantedScopes || [];
          const hasTradePermission = TRADE_CAPABLE_SCOPES.some((s) => scopes.includes(s));

          return (
            <SelectItem key={account.nid} value={account.nid}>
              <div className="flex items-center gap-2">
                {iconPath && (
                  <img
                    src={iconPath}
                    alt={exchange}
                    className="w-4 h-4 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span className="truncate">{label}</span>
                <span className="text-xs text-muted-foreground">({exchange})</span>
                {hasTradePermission && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    trade
                  </Badge>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Symbol Field
// ============================================================================

interface SymbolFieldProps {
  field: StrategyConfigField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

// Common trading pairs
const COMMON_SYMBOLS = [
  { value: "BTC/USDT", label: "BTC/USDT" },
  { value: "ETH/USDT", label: "ETH/USDT" },
  { value: "SOL/USDT", label: "SOL/USDT" },
  { value: "BNB/USDT", label: "BNB/USDT" },
  { value: "XRP/USDT", label: "XRP/USDT" },
  { value: "ADA/USDT", label: "ADA/USDT" },
  { value: "DOGE/USDT", label: "DOGE/USDT" },
  { value: "DOT/USDT", label: "DOT/USDT" },
  { value: "MATIC/USDT", label: "MATIC/USDT" },
  { value: "AVAX/USDT", label: "AVAX/USDT" },
];

function SymbolField({ field, value, onChange, error, disabled }: SymbolFieldProps) {
  const options = field.options ?? COMMON_SYMBOLS;

  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", error && "border-destructive")}>
        <SelectValue placeholder="Select trading pair" />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[100]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// Array Field (Dynamic List)
// ============================================================================

interface ArrayFieldProps {
  field: StrategyConfigField;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

function ArrayField({ field, value, onChange, error, disabled }: ArrayFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const items = value ?? [];

  const addItem = () => {
    if (inputValue.trim() && !items.includes(inputValue.trim())) {
      onChange([...items, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className={cn(
      "border rounded-md p-3 space-y-3",
      error && "border-destructive"
    )}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder ?? "Add item..."}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addItem}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded text-sm"
            >
              <span>{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeItem(index)}
                disabled={disabled}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No items added yet
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateField(
  field: StrategyConfigField,
  value: unknown
): string | undefined {
  // Required check
  if (field.required) {
    if (value === undefined || value === null || value === "") {
      return `${field.label} is required`;
    }
    // Array/multiselect empty check
    if (Array.isArray(value) && value.length === 0) {
      return `${field.label} requires at least one selection`;
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  // Type-specific validation
  if (field.type === "number") {
    const numValue = typeof value === "number" ? value : parseFloat(String(value));
    
    if (isNaN(numValue)) {
      return `${field.label} must be a number`;
    }

    if (field.min !== undefined && numValue < field.min) {
      return `${field.label} must be at least ${field.min}`;
    }

    if (field.max !== undefined && numValue > field.max) {
      return `${field.label} must be at most ${field.max}`;
    }
  }

  if (field.type === "string" && field.validation?.pattern) {
    const regex = new RegExp(field.validation.pattern);
    if (!regex.test(String(value))) {
      return field.validation.message ?? `${field.label} has invalid format`;
    }
  }

  return undefined;
}

export function validateConfig(
  fields: StrategyConfigField[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const error = validateField(field, values[field.id]);
    if (error) {
      errors[field.id] = error;
    }
  });

  return errors;
}

/**
 * Check if a field should be visible based on dependsOn condition
 */
export function isFieldVisible(
  field: StrategyConfigField,
  allValues: Record<string, unknown>
): boolean {
  if (!field.dependsOn) return true;
  return allValues[field.dependsOn.field] === field.dependsOn.value;
}
