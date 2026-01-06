/**
 * Monaco Editor Component for AMI Workers
 *
 * Professional code editor with:
 * - Custom STELS theme (zinc/amber palette)
 * - JavaScript/JSON support
 * - Auto-formatting for minified code
 * - Worker SDK autocomplete
 * - Dark/Light theme support
 */

import MonacoEditorComponent from "@monaco-editor/react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef } from "react";
import type * as monaco from "monaco-editor";
import { useThemeStore } from "@/stores";
import { isMinified } from "@/lib/code-formatter";
import { formatJavaScript } from "./monaco/formatter";

// Editor configuration constants
const EDITOR_CONFIG = {
  SAVE_DEBOUNCE_MS: 1000, // Reduced from 1500ms for faster feedback
  FORMAT_DELAY_MS: 300,
  TAB_SIZE: 2,
} as const;

interface MonacoEditorProps {
  script: string | undefined;
  handleEditorChange: (value: string | undefined) => void;
  onEditorReady?: (formatCode: () => void) => void;
  onUndoRedoReady?: (undo: () => void, redo: () => void) => void;
}

/**
 * Monaco Editor Component for AMI Workers
 */
export default function MonacoEditor({
  script,
  handleEditorChange,
  onEditorReady,
  onUndoRedoReady,
}: MonacoEditorProps): ReactElement {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const { resolvedTheme } = useThemeStore();
  const isFormattingRef = useRef<boolean>(false);
  const isUserEditingRef = useRef<boolean>(false);
  const lastScriptRef = useRef<string | undefined>(script);
  const changeDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formattingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentValueRef = useRef<string | null>(null);
  const handleEditorChangeRef = useRef(handleEditorChange);
  const onEditorReadyRef = useRef(onEditorReady);
  const onUndoRedoReadyRef = useRef(onUndoRedoReady);

  // Keep refs in sync with props
  useEffect(() => {
    handleEditorChangeRef.current = handleEditorChange;
  }, [handleEditorChange]);

  useEffect(() => {
    onEditorReadyRef.current = onEditorReady;
  }, [onEditorReady]);

  useEffect(() => {
    onUndoRedoReadyRef.current = onUndoRedoReady;
  }, [onUndoRedoReady]);

  /**
   * Format code programmatically
   */
  const formatCode = useCallback((): void => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const currentCode = model.getValue();

    // Try Monaco's built-in formatter first (for JSON)
    if (model.getLanguageId() === "json") {
      editor.getAction("editor.action.formatDocument")?.run();
      return;
    }

    // For JavaScript, use our custom formatter
    const formatted = formatJavaScript(currentCode);

    if (formatted !== currentCode) {
      isFormattingRef.current = true;

      // Save cursor position
      const position = editor.getPosition();
      const offset = position ? model.getOffsetAt(position) : 0;

      // Apply formatting
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ],
        () => null,
      );

      // Restore cursor position
      if (position) {
        const newPosition = model.getPositionAt(
          Math.min(offset, formatted.length),
        );
        editor.setPosition(newPosition);
      }

      // Clear any existing formatting timeout
      if (formattingTimeoutRef.current) {
        clearTimeout(formattingTimeoutRef.current);
      }

      // Reset formatting flag after a delay
      formattingTimeoutRef.current = setTimeout(() => {
        isFormattingRef.current = false;
        formattingTimeoutRef.current = null;
      }, 200);
    }
  }, []);

  /**
   * Detect language from script content
   */
  const detectLanguage = useCallback((code: string): "javascript" | "json" => {
    const trimmed = code.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {
        return "javascript";
      }
    }
    return "javascript";
  }, []);

  /**
   * Handle editor mount
   */
  const handleEditorDidMount = useCallback(
    (
      editor: monaco.editor.IStandaloneCodeEditor,
      monacoInstance: typeof import("monaco-editor"),
    ) => {
      editorRef.current = editor;
      monacoRef.current = monacoInstance;

      // Define custom dark theme
      monacoInstance.editor.defineTheme("stels-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "f59e0b" },
          { token: "string", foreground: "a3be8c" },
          { token: "number", foreground: "d4a574" },
          { token: "comment", foreground: "6b6866", fontStyle: "italic" },
          { token: "type", foreground: "d4a574" },
          { token: "class", foreground: "d4a574" },
          { token: "function", foreground: "56a8f5" },
          { token: "variable", foreground: "f0eeec" },
          { token: "operator", foreground: "f59e0b" },
          { token: "invalid", foreground: "bf616a" },
        ],
        colors: {
          "editor.background": "#18161a",
          "editor.foreground": "#f0eeec",
          "editor.lineHighlightBackground": "#1f1d21",
          "editor.selectionBackground": "#2a282c",
          "editor.selectionHighlightBackground": "#2a282c",
          "editorCursor.foreground": "#f59e0b",
          "editorWhitespace.foreground": "#2a282c",
          "editorIndentGuide.activeBackground": "#33312f",
          "editorIndentGuide.background": "#2a282c",
          "editorLineNumber.foreground": "#6b6866",
          "editorLineNumber.activeForeground": "#f59e0b",
          "editorGutter.background": "#18161a",
          "editorGutter.modifiedBackground": "#f59e0b",
          "editorGutter.addedBackground": "#a3be8c",
          "editorGutter.deletedBackground": "#bf616a",
          "editorWidget.background": "#1f1d21",
          "editorWidget.border": "#33312f",
          "editorSuggestWidget.background": "#1f1d21",
          "editorSuggestWidget.border": "#33312f",
          "editorSuggestWidget.selectedBackground": "#2a282c",
          "editorSuggestWidget.highlightForeground": "#f59e0b",
          "editorHoverWidget.background": "#1f1d21",
          "editorHoverWidget.border": "#33312f",
        },
      });

      // Define custom light theme
      monacoInstance.editor.defineTheme("stels-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "d97706" },
          { token: "string", foreground: "047857" },
          { token: "number", foreground: "92400e" },
          { token: "comment", foreground: "78716c", fontStyle: "italic" },
          { token: "type", foreground: "92400e" },
          { token: "class", foreground: "92400e" },
          { token: "function", foreground: "0066cc" },
          { token: "variable", foreground: "1a1817" },
          { token: "operator", foreground: "d97706" },
          { token: "invalid", foreground: "dc2626" },
        ],
        colors: {
          "editor.background": "#fafaf8",
          "editor.foreground": "#1a1817",
          "editor.lineHighlightBackground": "#ffffff",
          "editor.selectionBackground": "#f5f3f0",
          "editor.selectionHighlightBackground": "#f5f3f0",
          "editorCursor.foreground": "#f59e0b",
          "editorWhitespace.foreground": "#e5e3df",
          "editorIndentGuide.activeBackground": "#d1cfcb",
          "editorIndentGuide.background": "#e5e3df",
          "editorLineNumber.foreground": "#78716c",
          "editorLineNumber.activeForeground": "#f59e0b",
          "editorGutter.background": "#fafaf8",
          "editorGutter.modifiedBackground": "#d97706",
          "editorGutter.addedBackground": "#047857",
          "editorGutter.deletedBackground": "#dc2626",
          "editorWidget.background": "#ffffff",
          "editorWidget.border": "#e5e3df",
          "editorSuggestWidget.background": "#ffffff",
          "editorSuggestWidget.border": "#e5e3df",
          "editorSuggestWidget.selectedBackground": "#f5f3f0",
          "editorSuggestWidget.highlightForeground": "#d97706",
          "editorHoverWidget.background": "#ffffff",
          "editorHoverWidget.border": "#e5e3df",
        },
      });

      // Set initial theme
      const currentTheme = resolvedTheme === "light"
        ? "stels-light"
        : "stels-dark";
      monacoInstance.editor.setTheme(currentTheme);

      // Worker SDK completions disabled
      // setupMonacoCompletions(monacoInstance);

      // Prevent default browser shortcuts
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

        // Prevent Ctrl+W / Cmd+W (close tab)
        if ((ctrlKey || metaKey) && keyCode === monacoInstance.KeyCode.KeyW) {
          e.preventDefault();
          e.stopPropagation();
        }
      });

      // Handle content changes with debounce
      const changeListener = editor.onDidChangeModelContent(() => {
        if (isFormattingRef.current) {
          return;
        }

        const model = editor.getModel();
        if (!model) return;

        isUserEditingRef.current = true;

        const currentValue = model.getValue();

        // Update UI immediately to show editing state (no delay)
        if (currentValue !== lastSentValueRef.current) {
          handleEditorChangeRef.current(currentValue);
        }

        // Clear existing debounce timeout for save operation
        if (changeDebounceTimeoutRef.current) {
          clearTimeout(changeDebounceTimeoutRef.current);
        }

        // Save with debounce (300ms after user stops typing)
        // This prevents excessive API calls while still providing immediate UI feedback
        changeDebounceTimeoutRef.current = setTimeout(() => {
          const currentEditor = editorRef.current;
          if (!currentEditor) {
            changeDebounceTimeoutRef.current = null;
            return;
          }

          const currentModel = currentEditor.getModel();
          if (!currentModel) {
            changeDebounceTimeoutRef.current = null;
            return;
          }

          const finalValue = currentModel.getValue();
          if (finalValue !== lastSentValueRef.current) {
            lastSentValueRef.current = finalValue;
            // Update again to ensure latest value is saved
            handleEditorChangeRef.current(finalValue);
          }
          changeDebounceTimeoutRef.current = null;
        }, 300); // Reduced to 300ms for faster save
      });

      // Handle blur - save immediately and format
      const blurListener = editor.onDidBlurEditorText(() => {
        const model = editor.getModel();
        if (!model) return;

        const currentValue = model.getValue();

        if (isUserEditingRef.current) {
          // Clear any pending debounced save
          if (changeDebounceTimeoutRef.current) {
            clearTimeout(changeDebounceTimeoutRef.current);
            changeDebounceTimeoutRef.current = null;
          }

          // Save immediately on blur
          if (currentValue !== lastSentValueRef.current) {
            lastSentValueRef.current = currentValue;
            handleEditorChangeRef.current(currentValue);
          }
          isUserEditingRef.current = false;

          // Auto-format on blur
          formatCode();
        }
      });

      // Expose undo/redo functions
      if (onUndoRedoReadyRef.current) {
        onUndoRedoReadyRef.current(
          () => {
            editor.trigger("keyboard", "undo", {});
          },
          () => {
            editor.trigger("keyboard", "redo", {});
          },
        );
      }

      // Notify parent that editor is ready
      if (onEditorReadyRef.current) {
        onEditorReadyRef.current(formatCode);
      }

      // Auto-format minified code on initial load
      const code = script || "";
      const formatTimeout = isMinified(code)
        ? setTimeout(() => {
          formatCode();
        }, 100)
        : null;

      // Focus editor to show cursor
      const focusTimeout = setTimeout(() => {
        editor.focus();
      }, 0);

      // Cleanup
      return () => {
        changeListener.dispose();
        blurListener.dispose();
        if (changeDebounceTimeoutRef.current) {
          clearTimeout(changeDebounceTimeoutRef.current);
          changeDebounceTimeoutRef.current = null;
        }
        if (formattingTimeoutRef.current) {
          clearTimeout(formattingTimeoutRef.current);
          formattingTimeoutRef.current = null;
        }
        if (formatTimeout) {
          clearTimeout(formatTimeout);
        }
        clearTimeout(focusTimeout);
      };
    },
    [resolvedTheme, formatCode, script],
  );

  /**
   * Update theme when resolvedTheme changes
   */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const themeName = resolvedTheme === "light" ? "stels-light" : "stels-dark";
    monacoRef.current.editor.setTheme(themeName);
  }, [resolvedTheme]);

  /**
   * Update content when script prop changes
   */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const currentContent = model.getValue();
    const newContent = script || "";

    // Only update if script prop changed AND user is not currently editing
    if (script !== lastScriptRef.current) {
      // Check if content is significantly different (likely worker switch)
      const contentDiff = Math.abs(currentContent.length - newContent.length);
      const prefixLength = 100;
      const firstCurrent = currentContent.substring(
        0,
        Math.min(prefixLength, currentContent.length),
      );
      const firstNew = newContent.substring(
        0,
        Math.min(prefixLength, newContent.length),
      );
      const isSignificantChange = contentDiff > 200 ||
        (firstCurrent !== firstNew &&
          !firstCurrent.includes(firstNew) &&
          !firstNew.includes(firstCurrent));

      // If user is actively editing, don't overwrite unless it's a significant change (worker switch)
      if (isUserEditingRef.current && !isSignificantChange) {
        // Check if this is from our own save
        if (
          newContent === lastSentValueRef.current ||
          newContent === currentContent
        ) {
          lastScriptRef.current = script;
          return;
        }
        // Not a significant change and user is editing - don't overwrite
        lastScriptRef.current = script;
        return;
      }

      // Reset editing flag and refs when switching workers or receiving server update
      isUserEditingRef.current = false;
      isFormattingRef.current = true;
      lastScriptRef.current = script;
      // Reset lastSentValueRef when switching workers to ensure proper change detection
      if (isSignificantChange) {
        lastSentValueRef.current = null;
      }

      // Only update if content is different
      if (currentContent !== newContent) {
        // Save cursor position
        const position = editor.getPosition();
        const offset = position ? model.getOffsetAt(position) : 0;

        // Update content
        model.setValue(newContent);

        // Restore cursor position
        if (position) {
          const newPosition = model.getPositionAt(
            Math.min(offset, newContent.length),
          );
          editor.setPosition(newPosition);
        }

        // Auto-format if minified
        if (isMinified(newContent)) {
          setTimeout(() => {
            formatCode();
            isFormattingRef.current = false;
          }, 100);
        } else {
          setTimeout(() => {
            isFormattingRef.current = false;
          }, EDITOR_CONFIG.FORMAT_DELAY_MS);
        }
      } else {
        setTimeout(() => {
          isFormattingRef.current = false;
        }, 100);
      }
    }
  }, [script, formatCode]);

  const language = detectLanguage(script || "");

  return (
    <MonacoEditorComponent
      width="100%"
      height="100%"
      language={language}
      theme={resolvedTheme === "light" ? "stels-light" : "stels-dark"}
      value={script || ""}
      onChange={() => {
        // onChange is handled by onDidChangeModelContent
        // This is just to satisfy the prop
      }}
      onMount={handleEditorDidMount}
      options={{
        // Performance optimizations
        minimap: { enabled: false }, // Disable minimap for better performance
        fontSize: 14,
        fontFamily: "'SF Mono', 'Monaco', 'Cascadia Code', monospace", // Optimized font stack
        fontLigatures: false, // Disable ligatures for better performance
        lineNumbers: "on",
        wordWrap: "on",
        
        // Formatting
        formatOnPaste: false,
        formatOnType: false,
        autoIndent: "full",
        tabSize: EDITOR_CONFIG.TAB_SIZE,
        insertSpaces: true,
        
        // Scrolling
        scrollBeyondLastLine: false,
        smoothScrolling: false, // Disable for better performance
        cursorBlinking: "solid", // Simpler blinking for better performance
        cursorSmoothCaretAnimation: "off", // Disable animation for better performance
        
        // Code features
        matchBrackets: "always",
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        
        // Autocomplete - disabled
        suggest: {
          showWords: false,
          showProperties: false,
          showFunctions: false,
          showVariables: false,
          showClasses: false,
          showKeywords: false,
          showSnippets: false,
          insertMode: "replace",
        },
        quickSuggestions: {
          other: false,
          comments: false,
          strings: false,
        },
        acceptSuggestionOnCommitCharacter: false,
        acceptSuggestionOnEnter: "off",
        snippetSuggestions: "none",
        
        // Hover and links
        hover: {
          enabled: true,
          delay: 300, // Add delay to reduce CPU usage
        },
        links: false, // Disable links for better performance
        
        // Decorations
        colorDecorators: false, // Disable for better performance
        
        // Folding
        folding: true,
        foldingStrategy: "auto",
        showFoldingControls: "mouseover", // Show only on hover
        unfoldOnClickAfterEndOfLine: false,
        
        // Rendering
        renderWhitespace: "selection",
        renderLineHighlight: "line", // Simpler highlight
        selectOnLineNumbers: true,
        glyphMargin: false, // Disable for better performance
        contextmenu: true,
        mouseWheelZoom: false,
        multiCursorModifier: "ctrlCmd",
        
        // Accessibility
        accessibilitySupport: "off", // Disable if not needed for better performance
        
        // Layout
        automaticLayout: true,
        
        // Additional performance optimizations
        disableLayerHinting: true, // Better performance
        renderIndentGuides: true,
        renderFinalNewline: "off",
        trimAutoWhitespace: true,
      }}
    />
  );
}
