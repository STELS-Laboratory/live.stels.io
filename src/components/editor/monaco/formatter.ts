/**
 * Professional JavaScript Code Formatter
 *
 * Simple and reliable formatter with 2-space indentation.
 * Focuses on proper indentation without breaking code structure.
 */

const INDENT_SIZE = 2;
const INDENT = " ".repeat(INDENT_SIZE);

/**
 * Format JavaScript code with professional 2-space indentation
 *
 * @param code - JavaScript code to format
 * @returns Formatted JavaScript code
 */
export function formatJavaScript(code: string): string {
  if (!code || code.trim().length === 0) {
    return code;
  }

  try {
    // Normalize line endings (optimized single pass)
    const normalized = code.replace(/\r\n?/g, "\n");

    // Split into lines
    const lines = normalized.split("\n");
    const formattedLines: string[] = [];
    let indentLevel = 0;
    let inMultiLineString = false;
    let inMultiLineComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle empty lines
      if (!trimmed) {
        formattedLines.push("");
        continue;
      }

      // Track string and comment states (simplified)
      let lineInString = false;
      let lineStringChar = "";
      let lineInComment = false;
      let escapeNext = false;

      // Parse string and comment states (optimized single pass)
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = j < line.length - 1 ? line[j + 1] : null;

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        // Handle strings (only if not in comment)
        if (!inMultiLineComment && !lineInComment) {
          if (char === '"' || char === "'" || char === "`") {
            if (!lineInString) {
              lineInString = true;
              lineStringChar = char;
              if (char === "`") {
                inMultiLineString = true;
              }
            } else if (char === lineStringChar) {
              lineInString = false;
              lineStringChar = "";
              if (char === "`") {
                inMultiLineString = false;
              }
            }
          }
        }

        // Handle comments (only if not in string)
        if (!lineInString && !inMultiLineString) {
          if (char === "/" && nextChar === "/" && !inMultiLineComment) {
            lineInComment = true;
            break; // Rest of line is comment
          }
          if (char === "/" && nextChar === "*" && !inMultiLineComment) {
            inMultiLineComment = true;
            lineInComment = true;
            j++; // Skip next char
          } else if (char === "*" && nextChar === "/" && inMultiLineComment) {
            inMultiLineComment = false;
            lineInComment = false;
            j++; // Skip next char
          }
        }
      }

      // Calculate indent for this line
      let lineIndent = indentLevel;

      // Decrease indent for closing braces/brackets/parens
      if (
        trimmed.startsWith("}") || trimmed.startsWith("]") ||
        trimmed.startsWith(")")
      ) {
        lineIndent = Math.max(0, indentLevel - 1);
      }

      // Handle else, catch, finally, case, default - align with opening brace
      if (/^\s*(else|catch|finally|case|default)\b/.test(trimmed)) {
        lineIndent = Math.max(0, indentLevel - 1);
      }
      
      // Handle else if - same indent as else
      if (/^\s*else\s+if\b/.test(trimmed)) {
        lineIndent = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const indent = INDENT.repeat(lineIndent);
      formattedLines.push(indent + trimmed);

      // Update indent level for next line
      // Count braces, brackets, parens in the trimmed line (ignoring strings/comments)
      let netBraces = 0;
      let netBrackets = 0;
      let netParens = 0;

      // Count brackets/braces/parens (only outside strings and comments)
      if (!lineInString && !lineInComment && !inMultiLineString && !inMultiLineComment) {
        for (let j = 0; j < trimmed.length; j++) {
          const char = trimmed[j];
          if (char === "{") netBraces++;
          else if (char === "}") netBraces--;
          else if (char === "[") netBrackets++;
          else if (char === "]") netBrackets--;
          else if (char === "(") netParens++;
          else if (char === ")") netParens--;
        }
      }

      // Update indent level based on bracket changes
      indentLevel += netBraces + netBrackets + netParens;

      // Ensure indent level doesn't go negative
      indentLevel = Math.max(0, indentLevel);
    }

    return formattedLines.join("\n");
  } catch (error) {
    // If formatting fails, return original code
    // Log error in development for debugging
    if (import.meta.env.DEV) {
      console.warn("Formatter error:", error);
    }
    return code;
  }
}
