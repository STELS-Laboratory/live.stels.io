/**
 * Monaco Editor Configuration for Vite
 * Fixes the "Cannot assign to read only property" error
 */

// This is a workaround for Monaco Editor + Vite compatibility issues
// Monaco Editor tries to modify frozen objects in dev mode

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  getWorker(_: string, label: string): Worker {
    // Use dynamic imports for workers to avoid Vite freezing issues
    if (label === 'json') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'typescript' || label === 'javascript') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url),
        { type: 'module' }
      );
    }
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
      { type: 'module' }
    );
  }
};

export {};

