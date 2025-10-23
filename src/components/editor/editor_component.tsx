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

export default function EditorComponent({
	script,
	handleEditorChange,
}: EditorComponentProps): ReactElement {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
	const disposablesRef = useRef<monaco.IDisposable[]>([]);
	const { resolvedTheme } = useThemeStore();

	// Add global styles for function call highlighting (once on mount)
	useEffect(() => {
		// Check if styles are already injected
		if (!document.head.querySelector("style[data-monaco-functions]")) {
			const style = document.createElement("style");
			style.textContent = `
				.monaco-function-call-dark {
					color: #56a8f5 !important;
				}
				.monaco-function-call-light {
					color: #0066cc !important;
				}
			`;
			style.setAttribute("data-monaco-functions", "true");
			document.head.appendChild(style);

			// Cleanup function to remove styles on unmount
			return () => {
				const existingStyle = document.head.querySelector(
					"style[data-monaco-functions]",
				);
				if (existingStyle) {
					existingStyle.remove();
				}
			};
		}
	}, []); // Empty array means this runs once on mount

	const handleEditorDidMount = useCallback(
		(
			editor: monaco.editor.IStandaloneCodeEditor,
			monacoInstance: typeof import("monaco-editor"),
		) => {
			try {
				editorRef.current = editor;
				monacoRef.current = monacoInstance;

				// Setup Worker SDK autocomplete and types (only once)
				const { disposables } = setupWorkerMonacoEditor(monacoInstance, {
					theme: document.documentElement.classList.contains("light")
						? "vs-light"
						: "vs-dark",
					fontSize: 14,
					minimap: true,
				});

				disposablesRef.current = disposables;

				// Store decorations collection to update it instead of creating new one
				let decorationsCollection:
					| monaco.editor.IEditorDecorationsCollection
					| null = null;

				// Helper function to highlight function calls with decorations
				const highlightFunctionCalls = (): void => {
					try {
						const model = editor.getModel();
						if (!model) return;

						const decorations: monaco.editor.IModelDeltaDecoration[] = [];
						const text = model.getValue();
						const lines = text.split("\n");
						const isDark = document.documentElement.classList.contains("dark");

						lines.forEach((line, lineIndex) => {
							// Match function calls: identifier followed by (
							const functionCallRegex = /\b([a-zA-Z_$][\w$]*)\s*\(/g;
							let match;

							while ((match = functionCallRegex.exec(line)) !== null) {
								const functionName = match[1];

								// Skip keywords
								const keywords = [
									"if",
									"for",
									"while",
									"switch",
									"catch",
									"function",
									"return",
								];
								if (keywords.includes(functionName)) continue;

								const startColumn = match.index + 1;
								const endColumn = startColumn + functionName.length;

								decorations.push({
									range: new monacoInstance.Range(
										lineIndex + 1,
										startColumn,
										lineIndex + 1,
										endColumn,
									),
									options: {
										inlineClassName: isDark
											? "monaco-function-call-dark"
											: "monaco-function-call-light",
									},
								});
							}
						});

						// Update existing collection or create new one
						if (decorationsCollection) {
							decorationsCollection.set(decorations);
						} else {
							decorationsCollection = editor.createDecorationsCollection(
								decorations,
							);
						}
					} catch (error) {
						// Silently catch errors to prevent page reload
						console.warn("Failed to highlight function calls:", error);
					}
				};

				// Highlight function calls on content change
				const model = editor.getModel();
				if (model) {
					const contentChangeDisposable = model.onDidChangeContent(() => {
						highlightFunctionCalls();
					});
					disposablesRef.current.push(contentChangeDisposable);

					// Initial highlighting (with a small delay to ensure editor is ready)
					setTimeout(() => {
						highlightFunctionCalls();
					}, 100);
				}

				// Define IntelliJ IDEA Dark theme - Based on Dark.icls
				//
				// Color Convention (IntelliJ IDEA Dark):
				// 🟧 Orange (#cf8e6d) - Keywords
				// 💚 Green (#6aab73) - Strings
				// 🔷 Cyan (#2aacb8) - Numbers
				// 🔵 Blue (#56a8f5, #57aaf7) - Functions, Methods
				// 💜 Purple (#c77dbb) - Constants, Fields, Properties
				// 💙 Light Blue (#16baac) - Types, Classes
				// ⚪ Light Gray (#bcbec4) - Variables, Text
				// 🌫️ Gray (#7a7e85) - Comments
				//
				monacoInstance.editor.defineTheme("molokai-dark", {
					base: "vs-dark",
					inherit: true,
					rules: [
						// Comments - gray italic (IntelliJ style)
						{ token: "comment", foreground: "7a7e85", fontStyle: "italic" },
						{
							token: "comment.line",
							foreground: "7a7e85",
							fontStyle: "italic",
						},
						{
							token: "comment.block",
							foreground: "7a7e85",
							fontStyle: "italic",
						},
						{ token: "comment.doc", foreground: "5f826b", fontStyle: "italic" },

						// Keywords - orange (IntelliJ signature color)
						{ token: "keyword", foreground: "cf8e6d" },
						{ token: "keyword.control", foreground: "cf8e6d" },
						{ token: "keyword.operator", foreground: "bcbec4" },
						{ token: "storage", foreground: "cf8e6d" },
						{ token: "storage.type", foreground: "cf8e6d" },

						// Strings - green (IntelliJ classic)
						{ token: "string", foreground: "6aab73" },
						{ token: "string.quoted", foreground: "6aab73" },
						{ token: "string.template", foreground: "6aab73" },

						// Numbers - cyan
						{ token: "number", foreground: "2aacb8" },
						{ token: "constant.numeric", foreground: "2aacb8" },

						// Functions - blue (IntelliJ blue for all functions)
						{ token: "function", foreground: "56a8f5" },
						{ token: "entity.name.function", foreground: "56a8f5" },
						{ token: "support.function", foreground: "56a8f5" },
						{ token: "meta.function-call", foreground: "56a8f5" },
						{ token: "entity.name.function-call", foreground: "56a8f5" },
						// JavaScript/TypeScript specific - function calls
						{ token: "variable.function", foreground: "56a8f5" },
						{ token: "support.function.js", foreground: "56a8f5" },
						{ token: "support.function.ts", foreground: "56a8f5" },
						{ token: "support.function.dom", foreground: "56a8f5" },
						{ token: "entity.name.method.js", foreground: "56a8f5" },
						{ token: "entity.name.method.ts", foreground: "56a8f5" },
						{ token: "meta.function-call.generic", foreground: "56a8f5" },
						{ token: "support.function.any-method", foreground: "56a8f5" },

						// Classes/Types - light teal (IntelliJ type color)
						{ token: "class", foreground: "16baac" },
						{ token: "entity.name.class", foreground: "16baac" },
						{ token: "entity.name.type", foreground: "16baac" },
						{ token: "interface", foreground: "16baac" },
						{ token: "type", foreground: "16baac" },
						{ token: "support.class", foreground: "16baac" },
						{ token: "support.type", foreground: "16baac" },

						// Variables - light gray (default text color)
						{ token: "variable", foreground: "bcbec4" },
						{ token: "variable.other", foreground: "bcbec4" },
						{ token: "variable.language", foreground: "cf8e6d" }, // this, self

						// Parameters - light gray
						{ token: "variable.parameter", foreground: "bcbec4" },
						{ token: "parameter", foreground: "bcbec4" },

						// Properties/Fields - purple (IntelliJ instance fields)
						{ token: "member", foreground: "c77dbb" },
						{ token: "property", foreground: "c77dbb" },
						{ token: "variable.property", foreground: "c77dbb" },
						{ token: "variable.other.property", foreground: "c77dbb" },
						{ token: "entity.name.variable.property", foreground: "c77dbb" },

						// Methods - blue (IntelliJ instance methods - same as functions)
						{ token: "method", foreground: "56a8f5" },
						{ token: "function.method", foreground: "56a8f5" },
						{ token: "support.function.method", foreground: "56a8f5" },
						{ token: "entity.name.function.method", foreground: "56a8f5" },
						{ token: "meta.method-call", foreground: "56a8f5" },
						{ token: "entity.name.method", foreground: "56a8f5" },
						{ token: "support.type.object.module.js", foreground: "56a8f5" },

						// Objects/Instances - light gray
						{ token: "variable.other.object", foreground: "bcbec4" },
						{ token: "variable.other.constant.object", foreground: "bcbec4" },

						// Operators - light gray
						{ token: "operator", foreground: "bcbec4" },

						// Constants - purple (IntelliJ constants)
						{ token: "constant", foreground: "c77dbb", fontStyle: "italic" },
						{ token: "constant.language", foreground: "cf8e6d" }, // true, false, null
						{
							token: "constant.other",
							foreground: "c77dbb",
							fontStyle: "italic",
						},
						{
							token: "support.constant",
							foreground: "c77dbb",
							fontStyle: "italic",
						},
						{
							token: "variable.other.constant",
							foreground: "c77dbb",
							fontStyle: "italic",
						},

						// Annotations/Decorators - yellow
						{ token: "annotation", foreground: "b3ae60" },
						{ token: "decorator", foreground: "b3ae60" },
						{ token: "meta.decorator", foreground: "b3ae60" },
						{ token: "punctuation.decorator", foreground: "b3ae60" },

						// Regex - cyan
						{ token: "regexp", foreground: "42c3d4" },

						// String escapes - orange
						{ token: "constant.character.escape", foreground: "cf8e6d" },
						{ token: "string.escape", foreground: "cf8e6d" },
					],
					colors: {
						// Editor base - STELS zinc palette with IntelliJ colors
						"editor.background": "#09090b", // zinc-950
						"editor.foreground": "#bcbec4",

						// Current line - subtle highlight
						"editor.lineHighlightBackground": "#18181b", // zinc-900
						"editor.lineHighlightBorder": "#00000000",

						// Selection - IntelliJ style
						"editor.selectionBackground": "#2b5278",
						"editor.inactiveSelectionBackground": "#26364a",
						"editor.selectionHighlightBackground": "#26364a",

						// Cursor - light gray
						"editorCursor.foreground": "#ced0d6",

						// Line numbers - IntelliJ style
						"editorLineNumber.foreground": "#52525b", // zinc-600
						"editorLineNumber.activeForeground": "#a1a3ab",

						// Gutter
						"editorGutter.background": "#09090b", // zinc-950
						"editorGutter.addedBackground": "#54915960",
						"editorGutter.deletedBackground": "#868a9160",
						"editorGutter.modifiedBackground": "#375fad60",

						// Indentation guides - zinc palette
						"editorIndentGuide.background": "#27272a", // zinc-800
						"editorIndentGuide.activeBackground": "#71717a", // zinc-500

						// Whitespace
						"editorWhitespace.foreground": "#52525b", // zinc-600

						// Bracket matching - IntelliJ style
						"editorBracketMatch.background": "#43454a",
						"editorBracketMatch.border": "#43454a",

						// Overview ruler
						"editorOverviewRuler.border": "#27272a", // zinc-800
						"editorOverviewRuler.errorForeground": "#d64d5b",
						"editorOverviewRuler.warningForeground": "#c29e4a",

						// Scrollbar - zinc palette
						"scrollbar.shadow": "#00000000",
						"scrollbarSlider.background": "#3f3f4640", // zinc-700 transparent
						"scrollbarSlider.activeBackground": "#52525b60", // zinc-600 transparent
						"scrollbarSlider.hoverBackground": "#52525b60",

						// Widgets (autocomplete, hover, etc.) - zinc palette
						"editorWidget.background": "#18181b", // zinc-900
						"editorWidget.border": "#3f3f46", // zinc-700
						"editorSuggestWidget.background": "#18181b",
						"editorSuggestWidget.border": "#3f3f46",
						"editorSuggestWidget.selectedBackground": "#27272a", // zinc-800
						"editorSuggestWidget.highlightForeground": "#548af7",
						"editorHoverWidget.background": "#18181b",
						"editorHoverWidget.border": "#3f3f46",

						// Find/Replace
						"editorWidget.resizeBorder": "#548af7",
						"inputOption.activeBorder": "#548af7",

						// Peek view - zinc palette
						"peekView.border": "#548af7",
						"peekViewEditor.background": "#18181b", // zinc-900
						"peekViewResult.background": "#18181b",
						"peekViewTitle.background": "#27272a", // zinc-800

						// Error and warning
						"editorError.foreground": "#fa6675",
						"editorWarning.foreground": "#f2c55c",
						"editorInfo.foreground": "#548af7",
					},
				});

				// Define IntelliJ IDEA Light theme - Professional light scheme
				//
				// Color Convention (IntelliJ IDEA Light):
				// 🟧 Orange/Brown - Keywords
				// 💚 Green - Strings
				// 🔵 Blue - Numbers, Types
				// 🟣 Purple - Constants, Fields
				// ⚫ Black - Variables, Text
				//
				monacoInstance.editor.defineTheme("molokai-light", {
					base: "vs",
					inherit: true,
					rules: [
						// Comments - gray italic
						{ token: "comment", foreground: "8c8c8c", fontStyle: "italic" },
						{
							token: "comment.line",
							foreground: "8c8c8c",
							fontStyle: "italic",
						},
						{
							token: "comment.block",
							foreground: "8c8c8c",
							fontStyle: "italic",
						},
						{ token: "comment.doc", foreground: "629755", fontStyle: "italic" },

						// Keywords - orange/brown (IntelliJ signature)
						{ token: "keyword", foreground: "0033b3", fontStyle: "bold" },
						{
							token: "keyword.control",
							foreground: "0033b3",
							fontStyle: "bold",
						},
						{ token: "keyword.operator", foreground: "000000" },
						{ token: "storage", foreground: "0033b3", fontStyle: "bold" },
						{ token: "storage.type", foreground: "0033b3", fontStyle: "bold" },

						// Strings - green
						{ token: "string", foreground: "067d17" },
						{ token: "string.quoted", foreground: "067d17" },
						{ token: "string.template", foreground: "067d17" },

						// Numbers - blue
						{ token: "number", foreground: "1750eb" },
						{ token: "constant.numeric", foreground: "1750eb" },

						// Functions - blue (IntelliJ blue for all functions)
						{ token: "function", foreground: "0066cc" },
						{ token: "entity.name.function", foreground: "0066cc" },
						{ token: "support.function", foreground: "0066cc" },
						{ token: "meta.function-call", foreground: "0066cc" },
						{ token: "entity.name.function-call", foreground: "0066cc" },
						// JavaScript/TypeScript specific - function calls
						{ token: "variable.function", foreground: "0066cc" },
						{ token: "support.function.js", foreground: "0066cc" },
						{ token: "support.function.ts", foreground: "0066cc" },
						{ token: "support.function.dom", foreground: "0066cc" },
						{ token: "entity.name.method.js", foreground: "0066cc" },
						{ token: "entity.name.method.ts", foreground: "0066cc" },
						{ token: "meta.function-call.generic", foreground: "0066cc" },
						{ token: "support.function.any-method", foreground: "0066cc" },

						// Classes/Types - black/dark
						{ token: "class", foreground: "000000" },
						{ token: "entity.name.class", foreground: "000000" },
						{ token: "entity.name.type", foreground: "000000" },
						{ token: "interface", foreground: "000000" },
						{ token: "type", foreground: "000000" },
						{ token: "support.class", foreground: "000000" },
						{ token: "support.type", foreground: "000000" },

						// Variables - black (default text)
						{ token: "variable", foreground: "000000" },
						{ token: "variable.other", foreground: "000000" },
						{
							token: "variable.language",
							foreground: "0033b3",
							fontStyle: "bold",
						},

						// Parameters - dark gray
						{ token: "variable.parameter", foreground: "000000" },
						{ token: "parameter", foreground: "000000" },

						// Properties/Fields - purple (IntelliJ instance fields)
						{ token: "member", foreground: "871094" },
						{ token: "property", foreground: "871094" },
						{ token: "variable.property", foreground: "871094" },
						{ token: "variable.other.property", foreground: "871094" },
						{ token: "entity.name.variable.property", foreground: "871094" },

						// Methods - blue (IntelliJ instance methods - same as functions)
						{ token: "method", foreground: "0066cc" },
						{ token: "function.method", foreground: "0066cc" },
						{ token: "support.function.method", foreground: "0066cc" },
						{ token: "entity.name.function.method", foreground: "0066cc" },
						{ token: "meta.method-call", foreground: "0066cc" },
						{ token: "entity.name.method", foreground: "0066cc" },
						{ token: "support.type.object.module.js", foreground: "0066cc" },

						// Objects/Instances - black
						{ token: "variable.other.object", foreground: "000000" },
						{ token: "variable.other.constant.object", foreground: "000000" },

						// Operators - black
						{ token: "operator", foreground: "000000" },

						// Constants - purple (IntelliJ constants)
						{ token: "constant", foreground: "871094", fontStyle: "italic" },
						{
							token: "constant.language",
							foreground: "0033b3",
							fontStyle: "bold",
						},
						{
							token: "constant.other",
							foreground: "871094",
							fontStyle: "italic",
						},
						{
							token: "support.constant",
							foreground: "871094",
							fontStyle: "italic",
						},
						{
							token: "variable.other.constant",
							foreground: "871094",
							fontStyle: "italic",
						},

						// Annotations/Decorators - yellow
						{ token: "annotation", foreground: "bbb529" },
						{ token: "decorator", foreground: "bbb529" },
						{ token: "meta.decorator", foreground: "bbb529" },
						{ token: "punctuation.decorator", foreground: "bbb529" },

						// Regex - blue
						{ token: "regexp", foreground: "0037a6" },

						// String escapes - blue
						{ token: "constant.character.escape", foreground: "0037a6" },
						{ token: "string.escape", foreground: "0037a6" },
					],
					colors: {
						// Editor base - STELS zinc palette with IntelliJ colors
						"editor.background": "#ffffff", // white
						"editor.foreground": "#18181b", // zinc-900

						// Current line - subtle zinc highlight
						"editor.lineHighlightBackground": "#fafafa", // zinc-50
						"editor.lineHighlightBorder": "#00000000",

						// Selection - IntelliJ blue
						"editor.selectionBackground": "#a6d2ff",
						"editor.inactiveSelectionBackground": "#d4d4d4",
						"editor.selectionHighlightBackground": "#d4d4d480",

						// Cursor - black
						"editorCursor.foreground": "#000000",

						// Line numbers - zinc palette
						"editorLineNumber.foreground": "#a1a1aa", // zinc-400
						"editorLineNumber.activeForeground": "#18181b", // zinc-900

						// Gutter - zinc palette
						"editorGutter.background": "#ffffff",
						"editorGutter.addedBackground": "#37844d60",
						"editorGutter.deletedBackground": "#656e7660",
						"editorGutter.modifiedBackground": "#4f9fe660",

						// Indentation guides - zinc palette
						"editorIndentGuide.background": "#f4f4f5", // zinc-100
						"editorIndentGuide.activeBackground": "#a1a1aa", // zinc-400

						// Whitespace - zinc palette
						"editorWhitespace.foreground": "#e4e4e7", // zinc-200

						// Bracket matching - IntelliJ style
						"editorBracketMatch.background": "#e7f4ff",
						"editorBracketMatch.border": "#3399ff",

						// Overview ruler
						"editorOverviewRuler.border": "#e3e4e6",
						"editorOverviewRuler.errorForeground": "#bc3f3c",
						"editorOverviewRuler.warningForeground": "#be9117",

						// Scrollbar - zinc palette
						"scrollbar.shadow": "#00000000",
						"scrollbarSlider.background": "#d4d4d840", // zinc-300 transparent
						"scrollbarSlider.activeBackground": "#a1a1aa60", // zinc-400 transparent
						"scrollbarSlider.hoverBackground": "#a1a1aa60",

						// Widgets - zinc palette
						"editorWidget.background": "#fafafa", // zinc-50
						"editorWidget.border": "#e4e4e7", // zinc-200
						"editorSuggestWidget.background": "#fafafa",
						"editorSuggestWidget.border": "#e4e4e7",
						"editorSuggestWidget.selectedBackground": "#f4f4f5", // zinc-100
						"editorSuggestWidget.highlightForeground": "#0000ff",
						"editorHoverWidget.background": "#fafafa",
						"editorHoverWidget.border": "#e4e4e7",

						// Find/Replace
						"editorWidget.resizeBorder": "#0000ff",
						"inputOption.activeBorder": "#0000ff",

						// Peek view - zinc palette
						"peekView.border": "#0000ff",
						"peekViewEditor.background": "#fafafa", // zinc-50
						"peekViewResult.background": "#ffffff",
						"peekViewTitle.background": "#f4f4f5", // zinc-100

						// Error and warning
						"editorError.foreground": "#bc3f3c",
						"editorWarning.foreground": "#be9117",
						"editorInfo.foreground": "#0000ff",
					},
				});

				// Set theme based on current app theme
				const currentTheme = document.documentElement.classList.contains(
						"light",
					)
					? "molokai-light"
					: "molokai-dark";
				monacoInstance.editor.setTheme(currentTheme);

				// Format on paste
				editor.onDidPaste(() => {
					editor.getAction("editor.action.formatDocument")?.run();
				});

				// Prevent default browser shortcuts that could reload the page
				editor.onKeyDown((e) => {
					const { keyCode, ctrlKey, metaKey, shiftKey } = e;

					// Prevent Ctrl+R / Cmd+R (reload)
					if ((ctrlKey || metaKey) && keyCode === monacoInstance.KeyCode.KeyR) {
						e.preventDefault();
						e.stopPropagation();
					}

					// Prevent F5 (reload)
					if (keyCode === monacoInstance.KeyCode.F5) {
						e.preventDefault();
						e.stopPropagation();
					}

					// Prevent Ctrl+Shift+R / Cmd+Shift+R (hard reload)
					if (
						(ctrlKey || metaKey) &&
						shiftKey &&
						keyCode === monacoInstance.KeyCode.KeyR
					) {
						e.preventDefault();
						e.stopPropagation();
					}

					// Prevent Ctrl+W / Cmd+W (close tab) - optional
					if ((ctrlKey || metaKey) && keyCode === monacoInstance.KeyCode.KeyW) {
						e.preventDefault();
						e.stopPropagation();
					}
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
			} catch (error) {
				console.error("[Monaco] Failed to mount editor:", error);
				// Prevent page reload on error
			}
		},
		[],
	); // Empty dependency array - only mount once

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
				// Appearance - Xcode-inspired professional look
				minimap: { enabled: true, scale: 1 },
				fontSize: 13,
				fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
				fontLigatures: true,
				lineHeight: 1.6,
				letterSpacing: 0.2,

				// Enable semantic highlighting for function coloring
				"semanticHighlighting.enabled": "configuredByTheme",

				// Padding and spacing
				padding: { top: 2, bottom: 2 },
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
					delay: 200,
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
