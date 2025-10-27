/**
 * Validation Status Component
 * Displays schema validation status and errors
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useTokenBuilderStore } from "../../store";

/**
 * Validation Status - shows validation results
 */
export const ValidationStatus = React.memo(
  function ValidationStatus(): React.ReactElement {
    const errors = useTokenBuilderStore((state) => state.errors);
    const hasErrors = Object.keys(errors).length > 0;

    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground mb-1">
                Validation Status
              </p>
              {!hasErrors
                ? (
                  <p className="text-xs text-green-600">
                    ✓ Schema is valid and ready to sign
                  </p>
                )
                : (
                  <div className="text-xs text-red-600">
                    <p>✗ Please fix the following errors:</p>
                    <ul className="list-disc list-inside mt-1">
                      {Object.entries(errors).map(([field, messages]) => (
                        <li key={field}>
                          {field}: {messages[0]}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

export default ValidationStatus;
