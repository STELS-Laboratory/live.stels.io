/**
 * Monaco Editor Configuration for Vite
 * Minimal build: JavaScript + JSON only with custom theme
 */

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Configure Monaco Editor workers for Vite
// Only basic editor worker - no TypeScript analysis
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  getWorker(): Worker {
    return new editorWorker();
  }
};

// Minimal Monaco configuration - only JavaScript and JSON
import('monaco-editor').then((monaco) => {
  // JavaScript: lightweight mode
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: false,
    noLib: true,
  });

  // JSON: basic validation only
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemas: [],
  });
});

export {};

