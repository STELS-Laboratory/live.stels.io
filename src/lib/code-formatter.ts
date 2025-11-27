/**
 * Code formatting utilities
 * Detect minified code for Monaco Editor auto-formatting
 */

/**
 * Detect if code is minified
 * Checks for: long lines, few line breaks, semicolons per line ratio
 */
export function isMinified(code: string): boolean {
  if (!code) return false;

  const lines = code.split("\n");
  const lineCount = lines.length;
  
  // Quick checks for obvious minification
  
  // 1. Single line with significant code
  if (lineCount === 1 && code.length > 100) return true;
  
  // 2. Very few lines compared to code length
  if (lineCount < 10 && code.length > 1000) return true;
  
  // 3. Very long average line length
  const avgLineLength = code.length / lineCount;
  if (avgLineLength > 300) return true;
  
  // 4. Many semicolons per line (>3 per line on average)
  const semicolonCount = (code.match(/;/g) || []).length;
  if (semicolonCount > 0 && lineCount > 0) {
    const semicolonsPerLine = semicolonCount / lineCount;
    if (semicolonsPerLine > 3) return true;
  }
  
  // 5. Any single line over 500 characters
  if (lines.some(line => line.length > 500)) return true;
  
  return false;
}
