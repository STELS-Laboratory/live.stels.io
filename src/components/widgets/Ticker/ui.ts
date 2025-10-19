import React from "react";

interface FormatConfig {
  type: "number" | "volume" | "datetime" | "time";
  decimals?: number;
}

interface Condition {
  key: string;
  operator: "===" | ">" | "<" | ">=" | "<=";
  value: unknown;
}

interface IterateConfig {
  source: string;
  limit?: number;
  reverse?: boolean;
}

export interface UINode {
  type: string;
  className?: string;
  style?: Record<string, unknown>;
  children?: UINode[];
  text?: string;
  format?: FormatConfig;
  condition?: Condition;
  iterate?: IterateConfig;
  refreshInterval?: number;
}

const getValue = (obj: unknown, path: string): unknown => {
  if (!path) return obj;

  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc === null || acc === undefined) return undefined;

    if (Array.isArray(acc)) {
      const index = parseInt(part, 10);
      if (!isNaN(index)) {
        return acc[index];
      }
    }

    if (typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }

    return undefined;
  }, obj);
};

const formatValue = (value: unknown, format: FormatConfig): string => {
  const num = parseFloat(String(value));

  switch (format.type) {
    case "number":
      return num.toFixed(format.decimals ?? 0);
    case "volume":
      if (num >= 1e9) return `${(num / 1e9).toFixed(format.decimals)}B`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(format.decimals)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(format.decimals)}K`;
      return num.toFixed(format.decimals);
    case "datetime":
      return new Date(num).toLocaleString();
    case "time":
      return new Date(num).toLocaleTimeString();
    default:
      return String(value);
  }
};

const interpolate = (
  text: string,
  data: Record<string, unknown>,
  item?: unknown,
): string => {
  return text.replace(/\$?\{([^}]+)\}/g, (_match, expression: string) => {
    console.log(
      "[interpolate] expression:",
      expression,
      "| data:",
      data,
      "| item:",
      item,
    );

    const hasOperators = /[+\-*/]/.test(expression);

    if (hasOperators) {
      const evaluated = expression.replace(
        /(\$item(?:\[[0-9]+\])+|data\.[a-zA-Z0-9]+(?:\[[0-9]+\])*(?:\[[0-9]+\])*|\$item\.[a-zA-Z0-9.]+)/g,
        (varMatch) => {
          console.log("[interpolate] varMatch in expression:", varMatch);
          let value: unknown;

          if (varMatch.startsWith("$item")) {
            let path = varMatch.replace("$item", "");
            path = path.replace(/\[/g, ".").replace(/\]/g, "");
            if (path.startsWith(".")) {
              path = path.slice(1);
            }
            value = getValue(item, path);
          } else if (varMatch.startsWith("data.")) {
            let path = varMatch.replace("data.", "");
            path = path.replace(/\[/g, ".").replace(/\]/g, "");
            const dataObj = data.data as Record<string, unknown>;
            value = getValue(dataObj, path);
          }

          console.log("[interpolate] extracted value:", value);
          return String(value ?? "0");
        },
      );

      try {
        console.log("[interpolate] evaluated expression:", evaluated);
        const result = new Function(`return ${evaluated}`)();
        console.log("[interpolate] result:", result);
        return String(result);
      } catch (e) {
        console.error("[interpolate] eval error:", e);
        return "NaN";
      }
    } else {
      let result: unknown;

      if (expression.startsWith("$item")) {
        let path = expression.replace("$item", "");
        path = path.replace(/\[/g, ".").replace(/\]/g, "");
        if (path.startsWith(".")) {
          path = path.slice(1);
        }
        result = getValue(item, path);
      } else if (expression.startsWith("data.")) {
        let path = expression.replace("data.", "");
        path = path.replace(/\[/g, ".").replace(/\]/g, "");
        const dataObj = data.data as Record<string, unknown>;
        result = getValue(dataObj, path);
      } else {
        result = getValue(data, expression);
      }

      console.log("[interpolate] simple value result:", result);
      return String(result ?? "");
    }
  });
};

const evaluateCondition = (
  condition: Condition,
  data: Record<string, unknown>,
  item?: unknown,
): boolean => {
  let value: unknown;

  if (condition.key.startsWith("$item")) {
    const path = condition.key
      .replace("$item.", "")
      .replace("$item", "");
    value = getValue(item, path);
  } else {
    value = getValue(data, condition.key);
  }

  switch (condition.operator) {
    case "===":
      return value === condition.value;
    case ">":
      return Number(value) > Number(condition.value);
    case "<":
      return Number(value) < Number(condition.value);
    case ">=":
      return Number(value) >= Number(condition.value);
    case "<=":
      return Number(value) <= Number(condition.value);
    default:
      return false;
  }
};

const resolveStyle = (
  style: Record<string, unknown>,
  data: Record<string, unknown>,
  item?: unknown,
): React.CSSProperties => {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if (
      typeof value === "object" &&
      value !== null &&
      "condition" in value &&
      "true" in value &&
      "false" in value
    ) {
      const condValue = value as {
        condition: Condition;
        true: unknown;
        false: unknown;
      };
      resolved[key] = evaluateCondition(condValue.condition, data, item)
        ? condValue.true
        : condValue.false;
    } else if (
      typeof value === "object" &&
      value !== null &&
      "calculate" in value
    ) {
      const calcValue = value as {
        calculate: string;
        value: string;
        max: string;
      };

      if (calcValue.calculate === "percentage") {
        const valueStr = interpolate(calcValue.value, data, item);
        const maxStr = interpolate(calcValue.max, data, item);
        const numValue = parseFloat(valueStr);
        const numMax = parseFloat(maxStr);

        console.log(
          "[resolveStyle] percentage calc - value:",
          numValue,
          "max:",
          numMax,
        );

        if (!isNaN(numValue) && !isNaN(numMax) && numMax > 0) {
          const percentage = (numValue / numMax) * 100;
          resolved[key] = `${percentage.toFixed(2)}%`;
        } else {
          resolved[key] = "0%";
        }
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved as React.CSSProperties;
};

export const UIRenderer: React.FC<{
  schema: UINode;
  data: Record<string, unknown>;
}> = ({ schema, data }) => {
  const renderNode = (
    node: UINode,
    index: number,
    iterationItem?: unknown,
  ): React.ReactNode => {
    if (
      node.condition &&
      !evaluateCondition(node.condition, data, iterationItem)
    ) {
      return null;
    }

    const { type, className, style, children, text, iterate } = node;
    const Element = type as keyof React.JSX.IntrinsicElements;

    const resolvedStyle = style
      ? resolveStyle(style, data, iterationItem)
      : undefined;

    let content: string | null = null;

    if (text) {
      if (node.format) {
        content = text.replace(
          /\$?\{([^}]+)\}/g,
          (_match, expression: string) => {
            const interpolated = interpolate(
              `{${expression}}`,
              data,
              iterationItem,
            );
            return formatValue(interpolated, node.format!);
          },
        );
      } else {
        content = interpolate(text, data, iterationItem);
      }
    }

    if (iterate) {
      const items = getValue(data, iterate.source);
      if (!Array.isArray(items)) return null;

      const limited = items.slice(0, iterate.limit || items.length);
      const ordered = iterate.reverse ? [...limited].reverse() : limited;

      return ordered.map((item: unknown, idx: number) =>
        renderNode({ ...node, iterate: undefined }, idx, item)
      );
    }

    const childNodes = children?.map((child: UINode, idx: number) =>
      renderNode(child, idx, iterationItem)
    );

    return React.createElement(
      Element,
      { key: index, className, style: resolvedStyle },
      content,
      childNodes,
    );
  };

  return renderNode(schema, 0);
};

export default UIRenderer;
