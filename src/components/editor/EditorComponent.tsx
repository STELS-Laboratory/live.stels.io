import MonacoEditor from "@monaco-editor/react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { useThemeStore } from "@/stores";
import { setupWorkerMonacoEditor } from "./monaco/autocomplete.ts";

interface EditorComponentProps {
	script: string | undefined;
	handleEditorChange: (value: string | undefined) => void;
}

export default function EditorComponent(
	{ script, handleEditorChange }: EditorComponentProps,
): ReactElement {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
	const disposablesRef = useRef<monaco.IDisposable[]>([]);
	const { resolvedTheme } = useThemeStore();

	const handleEditorDidMount = useCallback((
		editor: monaco.editor.IStandaloneCodeEditor,
		monacoInstance: typeof import("monaco-editor"),
	) => {
		editorRef.current = editor;
		monacoRef.current = monacoInstance;

		// Setup Worker SDK autocomplete and types
		const { disposables } = setupWorkerMonacoEditor(monacoInstance, {
			theme: resolvedTheme === "light" ? "vs-light" : "vs-dark",
			fontSize: 14,
			minimap: true,
		});

		disposablesRef.current = disposables;

		// Define Molokai Dark theme
		monacoInstance.editor.defineTheme("molokai-dark", {
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

		// Define Molokai Light theme
		monacoInstance.editor.defineTheme("molokai-light", {
			base: "vs",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "75715e", fontStyle: "italic" },
				{ token: "keyword", foreground: "c7254e", fontStyle: "bold" },
				{ token: "string", foreground: "c5941f" },
				{ token: "number", foreground: "7c3aed" },
				{ token: "regexp", foreground: "c5941f" },
				{ token: "operator", foreground: "c7254e" },
				{ token: "namespace", foreground: "18181b" },
				{ token: "type", foreground: "2563eb", fontStyle: "italic" },
				{ token: "struct", foreground: "16a34a" },
				{ token: "class", foreground: "16a34a" },
				{ token: "interface", foreground: "16a34a" },
				{ token: "parameter", foreground: "ea580c", fontStyle: "italic" },
				{ token: "variable", foreground: "18181b" },
				{ token: "function", foreground: "16a34a" },
				{ token: "member", foreground: "18181b" },
			],
			colors: {
				"editor.background": "#ffffff",
				"editor.foreground": "#18181b",
				"editor.lineHighlightBackground": "#f4f4f5",
				"editor.selectionBackground": "#e4e4e7",
				"editor.inactiveSelectionBackground": "#f4f4f5",
				"editor.selectionHighlightBackground": "#e4e4e7",
				"editorCursor.foreground": "#18181b",
				"editorWhitespace.foreground": "#a1a1aa",
				"editorIndentGuide.background": "#e4e4e7",
				"editorIndentGuide.activeBackground": "#71717a",
				"editorGroupHeader.tabsBackground": "#fafafa",
				"editorGroup.border": "#e4e4e7",
				"tab.activeBackground": "#e4e4e7",
				"tab.activeForeground": "#18181b",
				"tab.border": "#e4e4e7",
				"tab.inactiveBackground": "#fafafa",
				"tab.inactiveForeground": "#52525b",
				"scrollbarSlider.background": "#d4d4d8",
				"scrollbarSlider.activeBackground": "#a1a1aa",
				"scrollbarSlider.hoverBackground": "#a1a1aa",
			},
		});

		// Set theme based on current app theme
		const currentTheme = document.documentElement.classList.contains("light")
			? "molokai-light"
			: "molokai-dark";
		monacoInstance.editor.setTheme(currentTheme);

		// Format on paste
		editor.onDidPaste(() => {
			editor.getAction("editor.action.formatDocument")?.run();
		});

		// Configure Editor shortcuts
		editor.addCommand(
			monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
			() => {
				// Trigger save action (can be connected to parent component)
				console.log("Save shortcut triggered (Cmd/Ctrl+S)");
			},
		);

		editor.addCommand(
			monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
			() => {
				// Trigger run action (can be connected to parent component)
				console.log("Run shortcut triggered (Cmd/Ctrl+Enter)");
			},
		);

		// Cleanup disposables on unmount
		editor.onDidDispose(() => {
			disposablesRef.current.forEach((d) => d.dispose());
		});
	}, [resolvedTheme]);

	// Update Monaco theme when app theme changes
	useEffect(() => {
		if (!editorRef.current || !monacoRef.current) return;

		const themeName = resolvedTheme === "light"
			? "molokai-light"
			: "molokai-dark";
		monacoRef.current.editor.setTheme(themeName);
		console.log("[Monaco] Theme changed to:", themeName);
	}, [resolvedTheme]);

	return (
		<MonacoEditor
			width="100%"
			height="100%"
			language="javascript"
			theme={resolvedTheme === "light" ? "molokai-light" : "molokai-dark"}
			value={script}
			onChange={handleEditorChange}
			onMount={handleEditorDidMount}
			options={{
				// Appearance
				minimap: { enabled: true, scale: 1 },
				fontSize: 18,
				fontFamily: "Saira, monospace",
				fontLigatures: true,
				lineHeight: 1.4,
				letterSpacing: 0.6,

				// Padding and spacing
				padding: { top: 32, bottom: 32 },
				lineNumbers: "on",
				lineNumbersMinChars: 0,
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

				// IntelliSense - Professional autocomplete
				quickSuggestions: {
					other: true,
					comments: false,
					strings: true, // Enable in strings for better DX
				},
				suggestOnTriggerCharacters: true,
				acceptSuggestionOnEnter: "on",
				acceptSuggestionOnCommitCharacter: true,
				tabCompletion: "on",
				wordBasedSuggestions: "currentDocument",
				snippetSuggestions: "inline",
				suggest: {
					showWords: true,
					showFunctions: true,
					showVariables: true,
					showModules: true,
					showKeywords: true,
					showSnippets: true,
					showProperties: true,
					showMethods: true,
					showConstants: true,
					showClasses: true,
					showInterfaces: true,
					insertMode: "replace",
					filterGraceful: true,
					localityBonus: true,
				},
				parameterHints: {
					enabled: true,
					cycle: true,
				},

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

				// Auto-closing
				autoClosingBrackets: "always",
				autoClosingQuotes: "always",
				autoSurround: "languageDefined",

				// Code actions and refactoring
				codeLens: true,
				definitionLinkOpensInPeek: false,

				// Hover and links
				hover: {
					enabled: true,
					delay: 300,
					sticky: true,
				},
				links: true,
				colorDecorators: true,

				// Comments
				comments: {
					insertSpace: true,
					ignoreEmptyLines: true,
				},
			}}
		/>
	);
}
