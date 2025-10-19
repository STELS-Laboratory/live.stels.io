/**
 * Schema Editor Component
 * JSON editor for UINode schemas with Monaco Editor
 */

import MonacoEditor from "@monaco-editor/react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { useThemeStore } from "@/stores";

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidation: (isValid: boolean, errors: string[]) => void;
}

/**
 * Monaco-based JSON editor for UI schemas
 * Features syntax highlighting, validation, and auto-completion
 */
export default function SchemaEditor({
  value,
  onChange,
  onValidation,
}: SchemaEditorProps): ReactElement {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const { resolvedTheme } = useThemeStore();

  const handleEditorDidMount = useCallback(
    (
      editor: monaco.editor.IStandaloneCodeEditor,
      monacoInstance: typeof import("monaco-editor"),
    ) => {
      editorRef.current = editor;
      monacoRef.current = monacoInstance;

      // Define custom theme
      monacoInstance.editor.defineTheme("schema-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "string.key.json", foreground: "f59e0b", fontStyle: "bold" },
          { token: "string.value.json", foreground: "a6e22e" },
          { token: "number", foreground: "ae81ff" },
          { token: "keyword.json", foreground: "66d9ef" },
        ],
        colors: {
          "editor.background": "#18181b",
          "editor.foreground": "#fafafa",
          "editor.lineHighlightBackground": "#27272a",
          "editor.selectionBackground": "#3f3f46",
        },
      });

      monacoInstance.editor.setTheme(
        resolvedTheme === "light" ? "vs" : "schema-dark",
      );

      // Format on paste
      editor.onDidPaste(() => {
        editor.getAction("editor.action.formatDocument")?.run();
      });

      // Validation on change
      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (!model) return;

        const markers = monacoInstance.editor.getModelMarkers({
          resource: model.uri,
        });

        const errors = markers
          .filter((m) => m.severity === monacoInstance.MarkerSeverity.Error)
          .map((m) => m.message);

        onValidation(errors.length === 0, errors);
      });
    },
    [resolvedTheme, onValidation],
  );

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const themeName = resolvedTheme === "light" ? "vs" : "schema-dark";
    monacoRef.current.editor.setTheme(themeName);
  }, [resolvedTheme]);

  return (
    <MonacoEditor
      width="100%"
      height="100%"
      language="json"
      theme={resolvedTheme === "light" ? "vs" : "schema-dark"}
      value={value}
      onChange={(val) => onChange(val || "")}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: "monospace",
        lineNumbers: "on",
        wordWrap: "on",
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: "full",
        tabSize: 2,
        insertSpaces: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        matchBrackets: "always",
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        suggest: {
          showWords: true,
          showProperties: true,
          insertMode: "replace",
        },
      }}
    />
  );
}
