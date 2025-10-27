/**
 * Schema Preview Component
 * Shows JSON preview of token schema
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileJson } from "lucide-react";
import { useTokenBuilderStore } from "../../store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/hooks/use_theme";

/**
 * Schema Preview - shows JSON schema
 */
export const SchemaPreview = React.memo(
  function SchemaPreview(): React.ReactElement {
    const { resolvedTheme } = useTheme();
    const exportSchema = useTokenBuilderStore((state) => state.exportSchema);
    const [showPreview, setShowPreview] = useState(false);

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-foreground">
            Token Schema
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-6 text-xs"
          >
            <FileJson className="w-3 h-3 mr-1" />
            {showPreview ? "Hide" : "Show"} JSON
          </Button>
        </div>

        {showPreview && (
          <div className="rounded border border-border overflow-hidden">
            <SyntaxHighlighter
              language="json"
              style={resolvedTheme === "dark" ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: "8px",
                fontSize: "10px",
                lineHeight: "1.4",
                background: resolvedTheme === "dark" ? "#1a1a1a" : "#fafafa",
              }}
              wrapLongLines={true}
            >
              {exportSchema("json")}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    );
  },
);

export default SchemaPreview;
