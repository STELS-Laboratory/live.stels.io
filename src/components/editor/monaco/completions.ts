/**
 * Worker SDK Autocomplete for Monaco Editor
 *
 * Provides intelligent autocomplete for STELS Worker SDK APIs:
 * - Stels.* global APIs
 * - logger.* logging functions
 * - config.* configuration
 * - Common patterns and snippets
 */

import type * as monaco from "monaco-editor";

/**
 * Setup Monaco Editor completions for Worker SDK
 */
export function setupMonacoCompletions(
  monacoInstance: typeof import("monaco-editor"),
): void {
  // Register completion item provider for JavaScript
  monacoInstance.languages.registerCompletionItemProvider("javascript", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Get text before cursor
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const suggestions: monaco.languages.CompletionItem[] = [];

      // Stels.* API completions
      if (
        textUntilPosition.endsWith("Stels.") ||
        textUntilPosition.match(/Stels\.\w*$/)
      ) {
        suggestions.push(
          {
            label: "Stels.log",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log a message to the worker console",
            insertText: "Stels.log(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "Stels.error",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log an error message",
            insertText: "Stels.error(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "Stels.warn",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log a warning message",
            insertText: "Stels.warn(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "Stels.info",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log an info message",
            insertText: "Stels.info(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
        );
      }

      // logger.* completions
      if (
        textUntilPosition.endsWith("logger.") ||
        textUntilPosition.match(/logger\.\w*$/)
      ) {
        suggestions.push(
          {
            label: "logger.log",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log a message",
            insertText: "logger.log(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "logger.error",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log an error",
            insertText: "logger.error(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "logger.warn",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log a warning",
            insertText: "logger.warn(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "logger.info",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Log an info message",
            insertText: "logger.info(${1:message})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
        );
      }

      // config.* completions
      if (
        textUntilPosition.endsWith("config.") ||
        textUntilPosition.match(/config\.\w*$/)
      ) {
        suggestions.push(
          {
            label: "config.get",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Get a configuration value",
            insertText: "config.get(${1:key})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
          {
            label: "config.set",
            kind: monacoInstance.languages.CompletionItemKind.Function,
            documentation: "Set a configuration value",
            insertText: "config.set(${1:key}, ${2:value})",
            insertTextRules:
              monacoInstance.languages.CompletionItemInsertTextRule
                .InsertAsSnippet,
            range,
          },
        );
      }

      // Common snippets
      if (
        !textUntilPosition.includes("Stels.") &&
        !textUntilPosition.includes("logger.") &&
        !textUntilPosition.includes("config.")
      ) {
        suggestions.push(
          {
            label: "Stels",
            kind: monacoInstance.languages.CompletionItemKind.Variable,
            documentation: "STELS global API object",
            insertText: "Stels",
            range,
          },
          {
            label: "logger",
            kind: monacoInstance.languages.CompletionItemKind.Variable,
            documentation: "Logger instance",
            insertText: "logger",
            range,
          },
          {
            label: "config",
            kind: monacoInstance.languages.CompletionItemKind.Variable,
            documentation: "Configuration object",
            insertText: "config",
            range,
          },
        );
      }

      return {
        suggestions,
      };
    },
  });

  // Register completion item provider for JSON (if needed)
  monacoInstance.languages.registerCompletionItemProvider("json", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Basic JSON completions can be added here if needed
      return {
        suggestions: [],
      };
    },
  });
}
