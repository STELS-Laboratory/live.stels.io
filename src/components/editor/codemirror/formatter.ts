/**
 * Professional JavaScript Code Formatter for CodeMirror 6
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
    // Normalize line endings
    let normalized = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    
    // Split into lines
    const lines = normalized.split("\n");
    const formattedLines: string[] = [];
    let indentLevel = 0;
    let inMultiLineString = false;
    let stringChar = "";
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

      // Simple string detection (for single line)
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const prevChar = j > 0 ? line[j - 1] : "";

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        // Handle strings
        if ((char === '"' || char === "'" || char === "`")) {
          if (!lineInString && !inMultiLineComment) {
            lineInString = true;
            lineStringChar = char;
            if (char === "`") {
              inMultiLineString = true;
            }
          } else if (lineInString && char === lineStringChar) {
            lineInString = false;
            lineStringChar = "";
            if (char === "`") {
              inMultiLineString = false;
            }
          }
        }

        // Handle comments (only if not in string)
        if (!lineInString && !inMultiLineString) {
          if (char === "/" && j < line.length - 1) {
            const nextChar = line[j + 1];
            if (nextChar === "/" && !inMultiLineComment) {
              lineInComment = true;
              break; // Rest of line is comment
            }
            if (nextChar === "*" && !inMultiLineComment) {
              inMultiLineComment = true;
              lineInComment = true;
            }
          }
          if (char === "*" && j < line.length - 1 && line[j + 1] === "/" && inMultiLineComment) {
            inMultiLineComment = false;
            lineInComment = false;
          }
        }
      }

      // Calculate indent for this line
      let lineIndent = indentLevel;

      // Decrease indent for closing braces/brackets/parens
      if (trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith(")")) {
        lineIndent = Math.max(0, indentLevel - 1);
      }

      // Handle else, catch, finally - align with opening brace
      if (/^\s*(else|catch|finally)\b/.test(trimmed)) {
        lineIndent = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const indent = INDENT.repeat(lineIndent);
      formattedLines.push(indent + trimmed);

      // Update indent level for next line
      // Count braces, brackets, parens in the trimmed line
      let netBraces = 0;
      let netBrackets = 0;
      let netParens = 0;

      // Simple counting (ignoring strings and comments for simplicity)
      if (!lineInString && !lineInComment) {
        for (let j = 0; j < trimmed.length; j++) {
          const char = trimmed[j];
          if (char === "{") netBraces++;
          if (char === "}") netBraces--;
          if (char === "[") netBrackets++;
          if (char === "]") netBrackets--;
          if (char === "(") netParens++;
          if (char === ")") netParens--;
        }
      }

      // Update indent level
      indentLevel += netBraces + netBrackets + netParens;

      // Special handling for lines ending with opening braces/brackets/parens
      if (trimmed.endsWith("{") || trimmed.endsWith("[") || trimmed.endsWith("(")) {
        indentLevel++;
      }

      // Ensure indent level doesn't go negative
      indentLevel = Math.max(0, indentLevel);
    }

    return formattedLines.join("\n");
  } catch (error) {
    // If formatting fails, return original code
    console.warn("[CodeMirror Formatter] Failed to format code:", error);
    return code;
  }
}
