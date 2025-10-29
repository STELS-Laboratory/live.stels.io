/**
 * Monaco Editor Configuration for Vite
 * Optimized: JavaScript only (no TypeScript worker)
 */

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Configure Monaco Editor workers for Vite
// Only load editor worker - JavaScript doesn't need TypeScript worker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  getWorker(): Worker {
    // For JavaScript, use basic editor worker (no heavy TS analysis)
    return new editorWorker();
  }
};

// Import monaco dynamically to configure it for JavaScript only
import('monaco-editor').then((monaco) => {
  // Lightweight JavaScript configuration
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true, // Disable for performance
    noSyntaxValidation: false,  // Keep basic syntax check
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: false,
    noLib: true, // Don't load TypeScript libs
  });
});

export {};

