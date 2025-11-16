import { type ReactElement, useCallback, useEffect, useRef } from "react";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { autocompletion } from "@codemirror/autocomplete";
import { lintGutter } from "@codemirror/lint";
import { search } from "@codemirror/search";
import { keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";
import { useThemeStore } from "@/stores";
import { isMinified } from "@/lib/code-formatter";
import {
  stelsDarkThemeWithHighlight,
  stelsLightThemeWithHighlight,
} from "./codemirror/theme";
import { workerCompletions } from "./codemirror/completions";
import { formatJavaScript } from "./codemirror/formatter";

interface CodeMirrorEditorProps {
  script: string | undefined;
  handleEditorChange: (value: string | undefined) => void;
  onEditorReady?: (formatCode: () => void) => void;
}

/**
 * CodeMirror 6 Editor Component for AMI Workers
 *
 * Professional code editor with:
 * - Custom STELS theme (zinc/amber palette)
 * - JavaScript/JSON support
 * - Auto-formatting for minified code
 * - Worker SDK autocomplete
 * - Dark/Light theme support
 */
export default function CodeMirrorEditor({
  script,
  handleEditorChange,
  onEditorReady,
}: CodeMirrorEditorProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const isFormattingRef = useRef<boolean>(false);
  const isUserEditingRef = useRef<boolean>(false);
  const lastScriptRef = useRef<string | undefined>(script);
  const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleEditorChangeRef = useRef(handleEditorChange);
  const onEditorReadyRef = useRef(onEditorReady);
  const { resolvedTheme } = useThemeStore();

  // Keep refs in sync with props
  useEffect(() => {
    handleEditorChangeRef.current = handleEditorChange;
  }, [handleEditorChange]);

  useEffect(() => {
    onEditorReadyRef.current = onEditorReady;
  }, [onEditorReady]);

  // Compartments for dynamic reconfiguration
  const themeCompartment = useRef(new Compartment());
  const languageCompartment = useRef(new Compartment());

  /**
   * Format code programmatically
   */
  const formatCode = useCallback((): void => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentCode = view.state.doc.toString();
    const formatted = formatJavaScript(currentCode);

    if (formatted !== currentCode) {
      isFormattingRef.current = true;

      // Save cursor position
      const selection = view.state.selection.main;
      const cursorPos = selection.head;

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: formatted,
        },
        selection: {
          anchor: Math.min(cursorPos, formatted.length),
          head: Math.min(cursorPos, formatted.length),
        },
      });

      // Reset formatting flag after a delay
      setTimeout(() => {
        isFormattingRef.current = false;
      }, 200);
    }
  }, []);

  /**
   * Create editor instance (only once on mount)
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const currentTheme = resolvedTheme === "light"
      ? stelsLightThemeWithHighlight
      : stelsDarkThemeWithHighlight;

    // Detect language from script content
    const detectLanguage = (code: string): "javascript" | "json" => {
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
    };

    const lang = detectLanguage(script || "");
    const languageExt = lang === "json" ? json() : javascript();

    const startState = EditorState.create({
      doc: script || "",
      extensions: [
        // Configure 2-space indentation
        EditorState.tabSize.of(2),

        // Basic editor features
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        history(),

        // Keymaps
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...searchKeymap,
        ]),

        // Themes and languages
        themeCompartment.current.of(currentTheme),
        languageCompartment.current.of(languageExt),

        // Search
        search({
          top: true,
        }),
        highlightSelectionMatches(),

        // Linting
        lintGutter(),

        // Autocomplete
        autocompletion({
          override: [workerCompletions],
          activateOnTyping: true,
        }),

        // Editor settings
        EditorView.lineWrapping,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged && !isFormattingRef.current) {
            const newValue = update.state.doc.toString();
            isUserEditingRef.current = true;
            handleEditorChangeRef.current(newValue);

            // Clear existing timeout
            if (formatTimeoutRef.current) {
              clearTimeout(formatTimeoutRef.current);
            }

            // Don't auto-format while typing - only on blur
            // This prevents formatting issues during editing
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;
    lastScriptRef.current = script;

    // Focus editor to show cursor
    setTimeout(() => {
      view.focus();
    }, 0);

    // Add blur event handler for auto-formatting
    const handleBlur = (): void => {
      if (isUserEditingRef.current) {
        formatCode();
        isUserEditingRef.current = false;
      }
      if (formatTimeoutRef.current) {
        clearTimeout(formatTimeoutRef.current);
        formatTimeoutRef.current = null;
      }
    };

    const editorElement = view.dom;
    editorElement.addEventListener("blur", handleBlur);

    // Notify parent that editor is ready
    if (onEditorReadyRef.current) {
      onEditorReadyRef.current(formatCode);
    }

    // Auto-format minified code on initial load
    const code = script || "";
    if (isMinified(code)) {
      setTimeout(() => {
        formatCode();
      }, 100);
    }

    return () => {
      editorElement.removeEventListener("blur", handleBlur);
      if (formatTimeoutRef.current) {
        clearTimeout(formatTimeoutRef.current);
      }
      view.destroy();
      editorViewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, formatCode]); // Only create editor once, don't depend on script

  /**
   * Update theme when resolvedTheme changes
   */
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const newTheme = resolvedTheme === "light"
      ? stelsLightThemeWithHighlight
      : stelsDarkThemeWithHighlight;

    view.dispatch({
      effects: themeCompartment.current.reconfigure(newTheme),
    });
  }, [resolvedTheme]);

  /**
   * Update content when script prop changes (from server or tab switch)
   * Always update when script prop changes, regardless of editing state
   */
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    const newContent = script || "";

    // Always update if script prop changed (worker switch or server update)
    // Check if the prop actually changed, not just the editor content
    if (script !== lastScriptRef.current) {
      // Reset editing flag when switching workers
      isUserEditingRef.current = false;
      isFormattingRef.current = true;
      lastScriptRef.current = script;

      // Only update if content is different
      if (currentContent !== newContent) {
        // Save cursor position if possible
        const selection = view.state.selection.main;
        const cursorPos = selection.head;

        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: newContent,
          },
          selection: {
            anchor: Math.min(cursorPos, newContent.length),
            head: Math.min(cursorPos, newContent.length),
          },
        });

        // Auto-format if minified
        if (isMinified(newContent)) {
          setTimeout(() => {
            formatCode();
          }, 100);
        } else {
          setTimeout(() => {
            isFormattingRef.current = false;
          }, 200);
        }
      } else {
        // Content is the same, just reset flags
        setTimeout(() => {
          isFormattingRef.current = false;
        }, 100);
      }
    }
  }, [script, formatCode]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ fontSize: "16px" }}
    />
  );
}
