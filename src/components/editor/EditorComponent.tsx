import MonacoEditor from "@monaco-editor/react";
import { useRef } from "react";
import type * as monaco from "monaco-editor";

export default function EditorComponent({ script, handleEditorChange }: {
	script: string | undefined;
	handleEditorChange: (value: string | undefined) => void;
}) {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const handleEditorDidMount = (
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: typeof import("monaco-editor"),
	) => {
		editorRef.current = editor;

		// Define Molokai theme
		monaco.editor.defineTheme("molokai", {
			base: "vs-dark",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "75715e", fontStyle: "italic" },
				{ token: "keyword", foreground: "f92672", fontStyle: "bold" },
				{ token: "string", foreground: "e6db74" },
				{ token: "number", foreground: "ae81ff" },
				{ token: "regexp", foreground: "e6db74" },
				{ token: "operator", foreground: "f92672" },
				{ token: "namespace", foreground: "f8f8f2" },
				{ token: "type", foreground: "66d9ef", fontStyle: "italic" },
				{ token: "struct", foreground: "a6e22e" },
				{ token: "class", foreground: "a6e22e" },
				{ token: "interface", foreground: "a6e22e" },
				{ token: "parameter", foreground: "fd971f", fontStyle: "italic" },
				{ token: "variable", foreground: "f8f8f2" },
				{ token: "function", foreground: "a6e22e" },
				{ token: "member", foreground: "f8f8f2" },
			],
			colors: {
				"editor.background": "#0e0e10", // zinc-900
				"editor.foreground": "#f4f4f5", // zinc-100
				"editor.lineHighlightBackground": "#27272a", // zinc-800
				"editor.selectionBackground": "#3f3f46", // zinc-700
				"editor.inactiveSelectionBackground": "#52525b", // zinc-600
				"editor.selectionHighlightBackground": "#3f3f46", // zinc-700
				"editorCursor.foreground": "#fafafa", // zinc-50
				"editorWhitespace.foreground": "#71717a", // zinc-500
				"editorIndentGuide.background": "#52525b", // zinc-600
				"editorIndentGuide.activeBackground": "#a1a1aa", // zinc-400
				"editorGroupHeader.tabsBackground": "#18181b", // zinc-900
				"editorGroup.border": "#27272a", // zinc-800
				"tab.activeBackground": "#27272a", // zinc-800
				"tab.activeForeground": "#fafafa", // zinc-50
				"tab.border": "#27272a", // zinc-800
				"tab.inactiveBackground": "#18181b", // zinc-900
				"tab.inactiveForeground": "#d4d4d8", // zinc-300
				"scrollbarSlider.background": "#3f3f46", // zinc-700
				"scrollbarSlider.activeBackground": "#71717a", // zinc-500
				"scrollbarSlider.hoverBackground": "#71717a", // zinc-500
			},
		});

		// Set Molokai theme
		monaco.editor.setTheme("molokai");

		// Configure JavaScript/TypeScript language features
		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES2020,
			allowNonTsExtensions: true,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			jsx: monaco.languages.typescript.JsxEmit.React,
			reactNamespace: "React",
			allowJs: true,
			typeRoots: ["node_modules/@types"],
		});

		// Add Stels SDK type definitions
		const stelsSdkTypes = `
      declare global {
        const Stels: {
          nid: string;
          sid: string;
          version: string;
          timestamp: number;
          log: (message: any, ...args: any[]) => void;
          error: (message: any, ...args: any[]) => void;
          warn: (message: any, ...args: any[]) => void;
          info: (message: any, ...args: any[]) => void;
          debug: (message: any, ...args: any[]) => void;
          fetch: (url: string, options?: RequestInit) => Promise<Response>;
          storage: {
            get: (key: string) => Promise<any>;
            set: (key: string, value: any) => Promise<void>;
            delete: (key: string) => Promise<void>;
            clear: () => Promise<void>;
          };
          crypto: {
            hash: (data: string, algorithm?: string) => Promise<string>;
            encrypt: (data: string, key: string) => Promise<string>;
            decrypt: (data: string, key: string) => Promise<string>;
          };
          utils: {
            delay: (ms: number) => Promise<void>;
            uuid: () => string;
            timestamp: () => number;
            formatDate: (date: Date, format?: string) => string;
          };
        };
        
        const console: {
          log: (message?: any, ...optionalParams: any[]) => void;
          error: (message?: any, ...optionalParams: any[]) => void;
          warn: (message?: any, ...optionalParams: any[]) => void;
          info: (message?: any, ...optionalParams: any[]) => void;
          debug: (message?: any, ...optionalParams: any[]) => void;
        };
      }
    `;

		monaco.languages.typescript.javascriptDefaults.addExtraLib(
			stelsSdkTypes,
			"stels-sdk.d.ts",
		);

		// Add custom completion provider for Stels SDK
		monaco.languages.registerCompletionItemProvider("javascript", {
			provideCompletionItems: (model, position) => {
				const word = model.getWordUntilPosition(position);
				const range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn,
				};

				const suggestions = [
					{
						label: "Stels.nid",
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: "Stels.nid",
						range: range,
						documentation: "Node ID",
					},
					{
						label: "Stels.sid",
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: "Stels.sid",
						range: range,
						documentation: "Session ID",
					},
				];

				return { suggestions };
			},
		});

		// Configure editor shortcuts
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
			// Trigger save action
			console.log("Save shortcut triggered");
		});

		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			// Trigger run action
			console.log("Run shortcut triggered");
		});
	};

	// @ts-ignore
	return (
		<MonacoEditor
			width="100%"
			height="100%"
			language="javascript"
			theme="molokai"
			value={script}
			onChange={handleEditorChange}
			onMount={handleEditorDidMount}
			options={{
				// Appearance
				minimap: { enabled: true, scale: 1 },
				fontSize: 14,
				fontFamily: "Saira, monospace",
				fontLigatures: true,
				lineHeight: 1.6,
				letterSpacing: 0.5,

				// Padding and spacing
				padding: { top: 16, bottom: 16 },
				lineNumbers: "on",
				lineNumbersMinChars: 4,
				glyphMargin: true,
				folding: true,
				foldingStrategy: "indentation",

				// Editing behavior
				wordWrap: "bounded",
				wordWrapColumn: 120,
				wrappingIndent: "indent",
				autoIndent: "full",
				formatOnPaste: true,
				formatOnType: true,

				// Selection and cursor
				cursorBlinking: "smooth",
				cursorSmoothCaretAnimation: "on",
				cursorWidth: 2,
				selectOnLineNumbers: true,
				selectionHighlight: true,
				occurrencesHighlight: "singleFile",

				// Scrolling
				smoothScrolling: true,
				mouseWheelZoom: true,
				scrollBeyondLastLine: false,
				scrollbar: {
					vertical: "auto",
					horizontal: "auto",
					verticalScrollbarSize: 12,
					horizontalScrollbarSize: 12,
				},

				// IntelliSense
				quickSuggestions: {
					other: true,
					comments: false,
					strings: false,
				},
				suggestOnTriggerCharacters: true,
				acceptSuggestionOnEnter: "on",
				tabCompletion: "on",
				wordBasedSuggestions: "matchingDocuments",

				// Validation and diagnostics
				showUnused: true,
				showDeprecated: true,

				// Accessibility
				accessibilitySupport: "auto",

				// Performance
				renderWhitespace: "selection",
				renderControlCharacters: false,

				// Bracket matching
				matchBrackets: "always",
				bracketPairColorization: { enabled: true },

				// Comments and strings
				comments: {
					insertSpace: true,
					ignoreEmptyLines: true,
				},
			}}
		/>
	);
}
