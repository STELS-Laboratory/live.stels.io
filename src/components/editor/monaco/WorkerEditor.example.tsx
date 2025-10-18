/**
 * Example React Component using Monaco Editor with Worker SDK autocomplete
 *
 * Installation:
 * npm install monaco-editor @monaco-editor/react
 *
 * Usage:
 * import WorkerEditor from './monaco/WorkerEditor.example';
 *
 * <WorkerEditor
 *   value={workerScript}
 *   onChange={(code) => setWorkerScript(code)}
 *   theme="vs-dark"
 * />
 */

import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useRef, useState } from "react";
import { setupWorkerMonacoEditor, WORKER_TEMPLATES } from "./autocomplete.ts";

interface WorkerEditorProps {
  /** Initial code value */
  value?: string;

  /** On code change callback */
  onChange?: (code: string) => void;

  /** Editor theme */
  theme?: "vs-dark" | "vs-light";

  /** Editor height */
  height?: string;

  /** Show template selector */
  showTemplates?: boolean;

  /** Read-only mode */
  readOnly?: boolean;
}

export default function WorkerEditor({
  value = WORKER_TEMPLATES.simple,
  onChange,
  theme = "vs-dark",
  height = "600px",
  showTemplates = true,
  readOnly = false,
}: WorkerEditorProps) {
  const [code, setCode] = useState(value);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("simple");
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<Monaco.IDisposable[]>([]);

  function handleEditorDidMount(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco,
  ) {
    editorRef.current = editor;

    // Setup Worker SDK autocomplete and types
    const { disposables } = setupWorkerMonacoEditor(monaco, {
      theme,
      fontSize: 14,
      minimap: true,
    });

    disposablesRef.current = disposables;

    // Format on paste
    editor.onDidPaste(() => {
      editor.getAction("editor.action.formatDocument")?.run();
    });

    // Auto-save on Ctrl+S / Cmd+S
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        const currentCode = editor.getValue();
        if (onChange) {
          onChange(currentCode);
        }
        console.log("Worker script saved");
      },
    );

    // Cleanup on unmount
    editor.onDidDispose(() => {
      disposablesRef.current.forEach((d) => d.dispose());
    });
  }

  function handleCodeChange(newCode: string | undefined) {
    const codeValue = newCode || "";
    setCode(codeValue);
    if (onChange) {
      onChange(codeValue);
    }
  }

  function loadTemplate(templateKey: keyof typeof WORKER_TEMPLATES) {
    const templateCode = WORKER_TEMPLATES[templateKey];
    setCode(templateCode);
    setSelectedTemplate(templateKey);
    if (onChange) {
      onChange(templateCode);
    }

    // Update editor value
    if (editorRef.current) {
      editorRef.current.setValue(templateCode);
    }
  }

  function formatCode() {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  }

  function clearEditor() {
    setCode("");
    if (editorRef.current) {
      editorRef.current.setValue("");
    }
    if (onChange) {
      onChange("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      {showTemplates && (
        <div
          style={{
            padding: "10px",
            borderBottom: "1px solid #333",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            background: theme === "vs-dark" ? "#1e1e1e" : "#f3f3f3",
          }}
        >
          <label style={{ color: theme === "vs-dark" ? "#ccc" : "#333" }}>
            Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) =>
              loadTemplate(e.target.value as keyof typeof WORKER_TEMPLATES)}
            style={{
              padding: "5px 10px",
              borderRadius: "4px",
              border: "1px solid #555",
              background: theme === "vs-dark" ? "#2d2d2d" : "#fff",
              color: theme === "vs-dark" ? "#ccc" : "#333",
            }}
          >
            <option value="simple">Simple</option>
            <option value="gracefulShutdown">Graceful Shutdown</option>
            <option value="exchangeFetcher">Exchange Fetcher</option>
            <option value="balanceChecker">Balance Checker</option>
            <option value="orderBookWatcher">Order Book Watcher</option>
            <option value="advanced">Advanced</option>
            <option value="blockchainWallet">Blockchain Wallet</option>
            <option value="smartTransaction">Smart Transaction</option>
            <option value="tradingBot">Trading Bot</option>
            <option value="marketMaker">Market Maker</option>
          </select>

          <button
            onClick={formatCode}
            style={{
              padding: "5px 15px",
              borderRadius: "4px",
              border: "1px solid #555",
              background: theme === "vs-dark" ? "#2d2d2d" : "#fff",
              color: theme === "vs-dark" ? "#ccc" : "#333",
              cursor: "pointer",
            }}
          >
            Format Code
          </button>

          <button
            onClick={clearEditor}
            style={{
              padding: "5px 15px",
              borderRadius: "4px",
              border: "1px solid #d33",
              background: theme === "vs-dark" ? "#2d2d2d" : "#fff",
              color: "#d33",
              cursor: "pointer",
            }}
          >
            Clear
          </button>

          <span
            style={{
              marginLeft: "auto",
              color: theme === "vs-dark" ? "#888" : "#666",
              fontSize: "12px",
            }}
          >
            Lines: {code.split("\n").length} | Chars: {code.length}
          </span>
        </div>
      )}

      {/* Monaco Editor */}
      <div style={{ flexGrow: 1 }}>
        <Editor
          height={height}
          language="javascript"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            readOnly,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Standalone usage (without template selector)
 */
export function SimpleWorkerEditor({
  value,
  onChange,
  theme = "vs-dark",
}: {
  value: string;
  onChange: (code: string) => void;
  theme?: "vs-dark" | "vs-light";
}) {
  function handleEditorDidMount(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco,
  ) {
    setupWorkerMonacoEditor(monaco, { theme });

    editor.onDidPaste(() => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  }

  return (
    <Editor
      height="400px"
      language="javascript"
      value={value}
      onChange={(val) => onChange(val || "")}
      onMount={handleEditorDidMount}
      theme={theme}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
  );
}
