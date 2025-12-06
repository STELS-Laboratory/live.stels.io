/**
 * Smart Transaction Dialog Component
 * Form for creating and submitting smart transactions with multiple operations
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import type { RawAssetData } from "@/types/token";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useCreateSmartTransaction } from "@/hooks/use_create_smart_transaction";
import { validateAddress } from "@/lib/gliesereum";
import type { SmartOp } from "@/lib/gliesereum";
import { cn } from "@/lib/utils";

interface SmartTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile?: boolean;
  onTransactionSent?: () => void;
}

type OperationType =
  | "transfer"
  | "assert.balance"
  | "assert.time"
  | "assert.compare"
  | "emit.event";

interface OperationForm {
  id: string;
  type: OperationType;
  // Transfer fields
  to?: string;
  amount?: string;
  memo?: string;
  // Assert balance fields
  address?: string;
  gte?: string;
  // Assert time fields
  before_ms?: number;
  after_ms?: number;
  // Assert compare fields
  left?: string;
  cmp?: "<" | "<=" | "==" | ">=" | ">";
  right?: string;
  // Emit event fields
  kind?: string;
  eventData?: string;
}

/**
 * Smart Transaction Dialog Component
 */
export function SmartTransactionDialog({
  open,
  onOpenChange,
  mobile = false,
  onTransactionSent,
}: SmartTransactionDialogProps): React.ReactElement {
  const { wallet, connectionSession } = useAuthStore();
  const {
    createTransaction,
    submitTransaction,
    calculateFee,
    submitting,
    error,
  } = useCreateSmartTransaction();

  // Get network ID
  const networkId = connectionSession?.network || "testnet";

  // Get raw assets to find genesis document for currency decimals
  const { assets: rawAssets } = usePublicAssetList({
    network: networkId,
  });

  // Extract currency decimals from genesis document (default: 8 for SLI)
  const currencyDecimals = useMemo((): number => {
    // Find genesis document
    const genesisDoc = rawAssets?.find((asset) => {
      const isGenesisDoc = asset.channel?.includes(".genesis:") ||
        (asset.raw?.genesis && !asset.raw.genesis.token &&
          asset.raw.genesis.genesis);
      return isGenesisDoc;
    }) as RawAssetData | undefined;

    // Extract decimals from genesis document
    if (
      genesisDoc?.raw?.genesis?.parameters?.currency?.decimals !== undefined
    ) {
      return genesisDoc.raw.genesis.parameters.currency.decimals;
    }

    // Default to 8 for SLI (as per protocol)
    return 8;
  }, [rawAssets]);

  const [operations, setOperations] = useState<OperationForm[]>([
    {
      id: `op-${Date.now()}`,
      type: "transfer",
      to: "",
      amount: "",
    },
  ]);
  const [memo, setMemo] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Clear operations error when operations are added or when dialog opens
  useEffect(() => {
    if (operations.length > 0) {
      setErrors((prev) => {
        if (prev.operations) {
          const newErrors = { ...prev };
          delete newErrors.operations;
          return newErrors;
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operations.length, open]);

  /**
   * Format amount to 6 decimal places (required by Smart Transaction API)
   * Note: User can input up to currencyDecimals (8), but we format to 6 for API
   */
  const formatAmount = useCallback((amount: string): string => {
    const trimmed = amount.trim();
    if (!trimmed) return "";

    // Parse the number
    const num = Number.parseFloat(trimmed);
    if (isNaN(num)) return trimmed;

    // Format to exactly 6 decimal places (Smart Transactions API requirement)
    return num.toFixed(6);
  }, []);

  /**
   * Convert operation form to SmartOp
   */
  const convertOperationToSmartOp = useCallback(
    (op: OperationForm): SmartOp | null => {
      switch (op.type) {
        case "transfer":
          if (!op.to || !op.amount) return null;
          return {
            op: "transfer",
            to: op.to.trim(),
            amount: formatAmount(op.amount),
            ...(op.memo?.trim() && { memo: op.memo.trim() }),
          };
        case "assert.balance":
          if (!op.address || !op.gte) return null;
          return {
            op: "assert.balance",
            address: op.address.trim(),
            gte: formatAmount(op.gte),
          };
        case "assert.time":
          if (!op.before_ms && !op.after_ms) return null;
          return {
            op: "assert.time",
            ...(op.before_ms && { before_ms: op.before_ms }),
            ...(op.after_ms && { after_ms: op.after_ms }),
          };
        case "assert.compare":
          if (!op.left || !op.cmp || !op.right) return null;
          return {
            op: "assert.compare",
            left: formatAmount(op.left),
            cmp: op.cmp,
            right: formatAmount(op.right),
          };
        case "emit.event":
          if (!op.kind) return null;
          let data: Record<string, unknown> | undefined;
          if (op.eventData) {
            try {
              data = JSON.parse(op.eventData);
            } catch {
              return null;
            }
          }
          return {
            op: "emit.event",
            kind: op.kind,
            ...(data && { data }),
          };
        default:
          return null;
      }
    },
    [formatAmount],
  );

  // Calculate fee based on operations
  const calculatedFee = useMemo((): string => {
    try {
      const ops: SmartOp[] = operations
        .map((op) => convertOperationToSmartOp(op))
        .filter((op): op is SmartOp => op !== null);
      return calculateFee(ops);
    } catch {
      return "0.000100";
    }
  }, [operations, calculateFee, convertOperationToSmartOp]);

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (operations.length === 0) {
      newErrors.operations = "At least one operation is required";
    } else if (operations.length > 16) {
      newErrors.operations = "Maximum 16 operations allowed";
    }

    operations.forEach((op, index) => {
      const prefix = `op-${index}`;

      switch (op.type) {
        case "transfer":
          if (!op.to?.trim()) {
            newErrors[`${prefix}-to`] = "Recipient address is required";
          } else if (!validateAddress(op.to.trim())) {
            newErrors[`${prefix}-to`] = "Invalid recipient address";
          }
          if (!op.amount?.trim()) {
            newErrors[`${prefix}-amount`] = "Amount is required";
          } else {
            // Allow input up to currencyDecimals (8), but will format to 6 for API
            const amountRegex = new RegExp(
              `^\\d+(\\.\\d{1,${currencyDecimals}})?$`,
            );
            if (!amountRegex.test(op.amount.trim())) {
              newErrors[`${prefix}-amount`] =
                `Invalid amount format (max ${currencyDecimals} decimals)`;
            }
          }
          break;
        case "assert.balance":
          if (!op.address?.trim()) {
            newErrors[`${prefix}-address`] = "Address is required";
          } else if (!validateAddress(op.address.trim())) {
            newErrors[`${prefix}-address`] = "Invalid address";
          }
          if (!op.gte?.trim()) {
            newErrors[`${prefix}-gte`] = "Minimum balance is required";
          } else {
            // Allow input up to currencyDecimals (8), but will format to 6 for API
            const amountRegex = new RegExp(
              `^\\d+(\\.\\d{1,${currencyDecimals}})?$`,
            );
            if (!amountRegex.test(op.gte.trim())) {
              newErrors[`${prefix}-gte`] =
                `Invalid amount format (max ${currencyDecimals} decimals)`;
            }
          }
          break;
        case "assert.time":
          if (!op.before_ms && !op.after_ms) {
            newErrors[`${prefix}-time`] =
              "At least one time constraint is required";
          }
          if (op.before_ms && op.before_ms <= 0) {
            newErrors[`${prefix}-before_ms`] = "Before time must be positive";
          }
          if (op.after_ms && op.after_ms <= 0) {
            newErrors[`${prefix}-after_ms`] = "After time must be positive";
          }
          break;
        case "assert.compare":
          if (!op.left?.trim()) {
            newErrors[`${prefix}-left`] = "Left value is required";
          }
          if (!op.cmp) {
            newErrors[`${prefix}-cmp`] = "Comparison operator is required";
          }
          if (!op.right?.trim()) {
            newErrors[`${prefix}-right`] = "Right value is required";
          }
          break;
        case "emit.event":
          if (!op.kind?.trim()) {
            newErrors[`${prefix}-kind`] = "Event kind is required";
          } else if (!/^[a-z][a-z0-9._-]*$/.test(op.kind.trim())) {
            newErrors[`${prefix}-kind`] =
              "Invalid event kind format (must start with lowercase letter)";
          } else if (op.kind.length > 64) {
            newErrors[`${prefix}-kind`] =
              "Event kind must be 64 characters or less";
          }
          if (op.eventData) {
            try {
              const data = JSON.parse(op.eventData);
              const dataSize = JSON.stringify(data).length;
              if (dataSize > 1024) {
                newErrors[`${prefix}-eventData`] =
                  "Event data must be 1024 bytes or less";
              }
            } catch {
              newErrors[`${prefix}-eventData`] = "Invalid JSON format";
            }
          }
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [operations, currencyDecimals]);

  /**
   * Add new operation
   */
  const addOperation = useCallback((): void => {
    setOperations((prev) => [
      ...prev,
      {
        id: `op-${Date.now()}-${Math.random()}`,
        type: "transfer",
        to: "",
        amount: "",
      },
    ]);
    // Clear operations error when adding an operation
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.operations;
      return newErrors;
    });
  }, []);

  /**
   * Remove operation
   */
  const removeOperation = useCallback((id: string): void => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  }, []);

  /**
   * Update operation
   */
  const updateOperation = useCallback(
    (id: string, updates: Partial<OperationForm>): void => {
      setOperations((prev) =>
        prev.map((op) => (op.id === id ? { ...op, ...updates } : op))
      );
    },
    [],
  );

  /**
   * Reset form
   */
  const resetForm = useCallback((): void => {
    setOperations([
      {
        id: `op-${Date.now()}`,
        type: "transfer",
        to: "",
        amount: "",
      },
    ]);
    setMemo("");
    setErrors({});
    setSubmitError(null);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();

      if (!wallet || !connectionSession) {
        setSubmitError("Wallet or connection not available");
        return;
      }

      if (!validateForm()) {
        return;
      }

      setSubmitError(null);

      try {
        // Convert operations to SmartOp format
        const ops: SmartOp[] = operations
          .map((op) => convertOperationToSmartOp(op))
          .filter((op): op is SmartOp => op !== null);

        if (ops.length === 0) {
          setSubmitError("No valid operations");
          return;
        }

        // Validate operations before creating transaction
        for (let i = 0; i < ops.length; i++) {
          const op = ops[i];
          if (op.op === "transfer") {
            if (!op.to || op.to.length !== 34) {
              setSubmitError(
                `Operation ${i + 1}: Invalid recipient address (length: ${
                  op.to?.length || 0
                })`,
              );
              return;
            }
            if (!op.amount || !/^\d+\.\d{6}$/.test(op.amount)) {
              setSubmitError(
                `Operation ${
                  i + 1
                }: Invalid amount format: "${op.amount}" (expected format: "1.000000")`,
              );
              return;
            }
          }
        }

        // Create transaction
        const transaction = createTransaction({
          wallet,
          ops,
          memo: memo.trim() || undefined,
          prevHash: null,
        });

        // Submit transaction
        await submitTransaction(transaction);

        // Notify parent component
        onTransactionSent?.();

        // Reset form and close
        resetForm();
        onOpenChange(false);
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to send smart transaction";
        setSubmitError(errorMessage);
      }
    },
    [
      wallet,
      connectionSession,
      validateForm,
      operations,
      memo,
      convertOperationToSmartOp,
      createTransaction,
      submitTransaction,
      onTransactionSent,
      resetForm,
      onOpenChange,
    ],
  );

  /**
   * Handle dialog close
   */
  const handleClose = useCallback((): void => {
    if (!submitting) {
      resetForm();
      onOpenChange(false);
    }
  }, [submitting, resetForm, onOpenChange]);

  if (!wallet || !connectionSession) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Send Smart Transaction</DialogTitle>
            <DialogDescription>
              {!wallet
                ? "Wallet not found. Please create or import a wallet first."
                : "Not connected to network. Please connect to a network first."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-y-auto",
          mobile && "max-w-[calc(100vw-2rem)]",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5" />
            Smart Transaction
          </DialogTitle>
          <DialogDescription>
            Create a smart transaction with multiple operations (up to 16)
          </DialogDescription>
        </DialogHeader>

        {(error || submitError) && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error || submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Operations ({operations.length}/16)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOperation}
                disabled={operations.length >= 16 || submitting}
              >
                <Plus className="size-4 mr-2" />
                Add Operation
              </Button>
            </div>

            {operations.map((op, index) => (
              <div
                key={op.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Operation {index + 1}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={op.type}
                      onValueChange={(value: OperationType) =>
                        updateOperation(op.id, {
                          type: value,
                          to: "",
                          amount: "",
                          address: "",
                          gte: "",
                          before_ms: undefined,
                          after_ms: undefined,
                          left: "",
                          cmp: undefined,
                          right: "",
                          kind: "",
                          eventData: "",
                        })}
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="assert.balance">
                          Assert Balance
                        </SelectItem>
                        <SelectItem value="assert.time">Assert Time</SelectItem>
                        <SelectItem value="assert.compare">
                          Assert Compare
                        </SelectItem>
                        <SelectItem value="emit.event">Emit Event</SelectItem>
                      </SelectContent>
                    </Select>
                    {operations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOperation(op.id)}
                        disabled={submitting}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Transfer Operation */}
                {op.type === "transfer" && (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`${op.id}-to`}>
                        Recipient Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${op.id}-to`}
                        value={op.to || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { to: e.target.value })}
                        placeholder="gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu"
                        disabled={submitting}
                        aria-invalid={errors[`op-${index}-to`]
                          ? "true"
                          : "false"}
                      />
                      {errors[`op-${index}-to`] && (
                        <p className="text-xs text-destructive">
                          {errors[`op-${index}-to`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`${op.id}-amount`}>
                        Amount <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${op.id}-amount`}
                        type="text"
                        value={op.amount || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { amount: e.target.value })}
                        placeholder="10.000000"
                        disabled={submitting}
                        aria-invalid={errors[`op-${index}-amount`]
                          ? "true"
                          : "false"}
                      />
                      {errors[`op-${index}-amount`] && (
                        <p className="text-xs text-destructive">
                          {errors[`op-${index}-amount`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`${op.id}-memo`}>Memo (Optional)</Label>
                      <Input
                        id={`${op.id}-memo`}
                        value={op.memo || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { memo: e.target.value })}
                        placeholder="Payment memo"
                        disabled={submitting}
                        maxLength={256}
                      />
                    </div>
                  </div>
                )}

                {/* Assert Balance Operation */}
                {op.type === "assert.balance" && (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`${op.id}-address`}>
                        Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${op.id}-address`}
                        value={op.address || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { address: e.target.value })}
                        placeholder="gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu"
                        disabled={submitting}
                        aria-invalid={errors[`op-${index}-address`]
                          ? "true"
                          : "false"}
                      />
                      {errors[`op-${index}-address`] && (
                        <p className="text-xs text-destructive">
                          {errors[`op-${index}-address`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`${op.id}-gte`}>
                        Minimum Balance{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${op.id}-gte`}
                        type="text"
                        value={op.gte || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { gte: e.target.value })}
                        placeholder="100.000000"
                        disabled={submitting}
                        aria-invalid={errors[`op-${index}-gte`]
                          ? "true"
                          : "false"}
                      />
                      {errors[`op-${index}-gte`] && (
                        <p className="text-xs text-destructive">
                          {errors[`op-${index}-gte`]}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Assert Time Operation */}
                {op.type === "assert.time" && (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`${op.id}-before_ms`}>
                        Before (ms) - Max execution time
                      </Label>
                      <Input
                        id={`${op.id}-before_ms`}
                        type="number"
                        value={op.before_ms || ""}
                        onChange={(e) =>
                          updateOperation(op.id, {
                            before_ms: e.target.value
                              ? Number.parseInt(e.target.value, 10)
                              : undefined,
                          })}
                        placeholder="300000 (5 minutes)"
                        disabled={submitting}
                        min={0}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${op.id}-after_ms`}>
                        After (ms) - Min execution time
                      </Label>
                      <Input
                        id={`${op.id}-after_ms`}
                        type="number"
                        value={op.after_ms || ""}
                        onChange={(e) =>
                          updateOperation(op.id, {
                            after_ms: e.target.value
                              ? Number.parseInt(e.target.value, 10)
                              : undefined,
                          })}
                        placeholder="3600000 (1 hour)"
                        disabled={submitting}
                        min={0}
                      />
                    </div>
                    {errors[`op-${index}-time`] && (
                      <p className="text-xs text-destructive">
                        {errors[`op-${index}-time`]}
                      </p>
                    )}
                  </div>
                )}

                {/* Assert Compare Operation */}
                {op.type === "assert.compare" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`${op.id}-left`}>
                          Left <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${op.id}-left`}
                          type="text"
                          value={op.left || ""}
                          onChange={(e) =>
                            updateOperation(op.id, { left: e.target.value })}
                          placeholder="100.000000"
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${op.id}-cmp`}>
                          Operator <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={op.cmp || ""}
                          onValueChange={(
                            value: "<" | "<=" | "==" | ">=" | ">",
                          ) => updateOperation(op.id, { cmp: value })}
                          disabled={submitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<">&lt;</SelectItem>
                            <SelectItem value="<=">&lt;=</SelectItem>
                            <SelectItem value="==">==</SelectItem>
                            <SelectItem value=">=">&gt;=</SelectItem>
                            <SelectItem value=">">&gt;</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`${op.id}-right`}>
                          Right <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${op.id}-right`}
                          type="text"
                          value={op.right || ""}
                          onChange={(e) =>
                            updateOperation(op.id, { right: e.target.value })}
                          placeholder="200.000000"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Emit Event Operation */}
                {op.type === "emit.event" && (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`${op.id}-kind`}>
                        Event Kind <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${op.id}-kind`}
                        value={op.kind || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { kind: e.target.value })}
                        placeholder="payment.completed"
                        disabled={submitting}
                        maxLength={64}
                        aria-invalid={errors[`op-${index}-kind`]
                          ? "true"
                          : "false"}
                      />
                      {errors[`op-${index}-kind`] && (
                        <p className="text-xs text-destructive">
                          {errors[`op-${index}-kind`]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Format: lowercase letters, numbers, dots, underscores,
                        hyphens
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`${op.id}-eventData`}>
                        Event Data (JSON, Optional)
                      </Label>
                      <Textarea
                        id={`${op.id}-eventData`}
                        value={op.eventData || ""}
                        onChange={(e) =>
                          updateOperation(op.id, { eventData: e.target.value })}
                        placeholder='{"order_id": "12345", "amount": "100.000000"}'
                        disabled={submitting}
                        className="min-h-[4rem] font-mono text-xs"
                      />
                      {errors[`op-${index}-eventData`] && (
                        <p className="text-xs text-destructive">
                          {errors[`op-${index}-eventData`]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Max 1024 bytes JSON
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {operations.length === 0 && errors.operations && (
              <p className="text-xs text-destructive">{errors.operations}</p>
            )}
          </div>

          {/* Transaction Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo">Transaction Memo (Optional)</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Transaction memo"
              disabled={submitting}
              className="min-h-[4rem]"
              maxLength={256}
            />
          </div>

          {/* Fee */}
          <div className="space-y-2">
            <Label htmlFor="fee">Transaction Fee</Label>
            <Input
              id="fee"
              type="text"
              value={calculatedFee}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Fee is calculated based on operations and transaction size
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending...
                  </>
                )
                : (
                  <>
                    <Zap className="size-4 mr-2" />
                    Send Smart Transaction
                  </>
                )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
