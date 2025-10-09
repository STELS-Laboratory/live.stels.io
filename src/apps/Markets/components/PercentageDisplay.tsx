import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface PercentageDisplayProps {
  percentage: number;
}

/**
 * Percentage display component with color coding
 */
export function PercentageDisplay({
  percentage,
}: PercentageDisplayProps): React.ReactElement {
  const isPositive = percentage >= 0;

  return (
    <div
      className={`flex w-auto items-center gap-1 ${
        isPositive ? "text-green-600" : "text-red-600"
      }`}
    >
      {isPositive
        ? <ArrowUp className="h-3 w-3" />
        : <ArrowDown className="h-3 w-3" />}
      {Math.abs(percentage).toFixed(2)}%
    </div>
  );
}
