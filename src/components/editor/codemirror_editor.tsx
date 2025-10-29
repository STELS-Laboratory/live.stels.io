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
  const { resolvedTheme } = useThemeStore();

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

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: formatted,
        },
      });

      // Reset formatting flag after a delay
      setTimeout(() => {
        isFormattingRef.current = false;
      }, 200);
    }
  }, []);

  /**
   * Create editor instance
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
            handleEditorChange(newValue);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    // Notify parent that editor is ready
    if (onEditorReady) {
      onEditorReady(formatCode);
    }

    // Auto-format minified code
    const code = script || "";
    if (isMinified(code)) {
      setTimeout(() => {
        formatCode();
      }, 100);
    }

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []); // Only create once on mount

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
   */
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    const newContent = script || "";

    if (currentContent !== newContent) {
      isFormattingRef.current = true;

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newContent,
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
    }
  }, [script, formatCode]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ fontSize: "14px" }}
    />
  );
}
