/**
 * JavaScript Code Formatter for CodeMirror 6
 * 
 * Simple but effective formatter for JavaScript code.
 * Uses basic rules for consistent indentation and spacing.
 */

/**
 * Format JavaScript code
 * 
 * @param code - JavaScript code to format
 * @returns Formatted JavaScript code
 */
export function formatJavaScript(code: string): string {
  if (!code || code.trim().length === 0) {
    return code;
  }

  try {
    // Remove excessive whitespace
    let formatted = code.replace(/\s+$/gm, ''); // Trim trailing whitespace
    
    // Basic indentation
    let indentLevel = 0;
    const indentSize = 2;
    const lines = formatted.split('\n');
    const formattedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        formattedLines.push('');
        continue;
      }

      // Decrease indent before closing braces
      if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add indentation
      const indent = ' '.repeat(indentLevel * indentSize);
      formattedLines.push(indent + line);

      // Increase indent after opening braces
      if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) {
        indentLevel++;
      }

      // Decrease indent after closing braces on same line
      if ((line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) && 
          (line.endsWith('{') || line.endsWith('[') || line.endsWith('('))) {
        // Don't change indent - it balances out
      } else if (line.includes('}') && !line.endsWith('}')) {
        // Closing brace in middle of line
        const openCount = (line.match(/{/g) || []).length;
        const closeCount = (line.match(/}/g) || []).length;
        if (closeCount > openCount) {
          indentLevel = Math.max(0, indentLevel - (closeCount - openCount));
        }
      }
    }

    formatted = formattedLines.join('\n');

    // Add spacing around operators
    formatted = formatted.replace(/([^\s])=([^\s=])/g, '$1 = $2');
    formatted = formatted.replace(/([^\s])\+([^\s+])/g, '$1 + $2');
    formatted = formatted.replace(/([^\s])-([^\s-])/g, '$1 - $2');
    formatted = formatted.replace(/([^\s])\*([^\s*])/g, '$1 * $2');
    formatted = formatted.replace(/([^\s])\/([^\s/])/g, '$1 / $2');

    // Add space after commas
    formatted = formatted.replace(/,([^\s])/g, ', $1');

    // Add space after keywords
    formatted = formatted.replace(/\b(if|for|while|switch|catch|function|return)\(/g, '$1 (');

    // Clean up excessive spacing
    formatted = formatted.replace(/ {2,}/g, ' ');

    return formatted;
  } catch (error) {
    // If formatting fails, return original code
    console.warn('[CodeMirror Formatter] Failed to format code:', error);
    return code;
  }
}

