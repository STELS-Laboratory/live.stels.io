/**
 * STELS Custom Theme for CodeMirror 6
 * 
 * Color Palette (zinc/amber):
 * - Primary: #f59e0b (amber-500)
 * - Dark Background: #18161a
 * - Dark Foreground: #f0eeec
 * - Light Background: #fafaf8
 * - Light Foreground: #1a1817
 * - Border: #33312f (dark), #e5e3df (light)
 * - Muted: #2a282c (dark), #f5f3f0 (light)
 */

import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * STELS Dark Theme
 * Based on project's zinc/amber palette with no shadows
 */
export const stelsDarkTheme = EditorView.theme({
  "&": {
    backgroundColor: "#18161a",
    color: "#f0eeec",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#f59e0b",
    fontFamily: "'Saira', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#f59e0b",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "#2a282c !important",
  },
  ".cm-activeLine": {
    backgroundColor: "#1f1d21",
  },
  ".cm-gutters": {
    backgroundColor: "#18161a",
    color: "#6b6866",
    border: "none",
    fontFamily: "'Saira', monospace",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#1f1d21",
    color: "#f59e0b",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px",
    minWidth: "40px",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "#2a282c",
    border: "none",
    color: "#6b6866",
  },
  ".cm-tooltip": {
    backgroundColor: "#1f1d21",
    border: "1px solid #33312f",
    borderRadius: "6px",
    color: "#f0eeec",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "'Saira', monospace",
      maxHeight: "400px",
    },
    "& > ul > li": {
      padding: "4px 8px",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "#2a282c",
      color: "#f59e0b",
    },
  },
  ".cm-completionIcon": {
    width: "16px",
    marginRight: "8px",
  },
  ".cm-completionLabel": {
    fontFamily: "'Saira', monospace",
  },
  ".cm-completionDetail": {
    fontStyle: "normal",
    color: "#6b6866",
    marginLeft: "8px",
  },
  ".cm-panels": {
    backgroundColor: "#18161a",
    color: "#f0eeec",
    border: "1px solid #33312f",
  },
  ".cm-panels.cm-panels-top": {
    borderBottom: "1px solid #33312f",
  },
  ".cm-panels.cm-panels-bottom": {
    borderTop: "1px solid #33312f",
  },
  ".cm-search": {
    padding: "8px",
    "& input, & button": {
      fontFamily: "'Saira', sans-serif",
      fontSize: "14px",
    },
    "& input": {
      backgroundColor: "#1f1d21",
      border: "1px solid #33312f",
      borderRadius: "4px",
      color: "#f0eeec",
      padding: "4px 8px",
    },
    "& button": {
      backgroundColor: "#2a282c",
      border: "1px solid #33312f",
      borderRadius: "4px",
      color: "#f0eeec",
      padding: "4px 12px",
      cursor: "pointer",
    },
    "& button:hover": {
      backgroundColor: "#33312f",
    },
  },
  ".cm-searchMatch": {
    backgroundColor: "#f59e0b33",
    outline: "1px solid #f59e0b",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#f59e0b66",
  },
  ".cm-scroller": {
    fontFamily: "'Saira', monospace",
    lineHeight: "1.6",
  },
}, { dark: true });

/**
 * STELS Light Theme
 * Based on project's zinc/amber palette with no shadows
 */
export const stelsLightTheme = EditorView.theme({
  "&": {
    backgroundColor: "#fafaf8",
    color: "#1a1817",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#f59e0b",
    fontFamily: "'Saira', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#f59e0b",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "#f5f3f0 !important",
  },
  ".cm-activeLine": {
    backgroundColor: "#ffffff",
  },
  ".cm-gutters": {
    backgroundColor: "#fafaf8",
    color: "#78716c",
    border: "none",
    fontFamily: "'Saira', monospace",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#ffffff",
    color: "#f59e0b",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px",
    minWidth: "40px",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "#f5f3f0",
    border: "none",
    color: "#78716c",
  },
  ".cm-tooltip": {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e3df",
    borderRadius: "6px",
    color: "#1a1817",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "'Saira', monospace",
      maxHeight: "400px",
    },
    "& > ul > li": {
      padding: "4px 8px",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "#f5f3f0",
      color: "#f59e0b",
    },
  },
  ".cm-completionIcon": {
    width: "16px",
    marginRight: "8px",
  },
  ".cm-completionLabel": {
    fontFamily: "'Saira', monospace",
  },
  ".cm-completionDetail": {
    fontStyle: "normal",
    color: "#78716c",
    marginLeft: "8px",
  },
  ".cm-panels": {
    backgroundColor: "#fafaf8",
    color: "#1a1817",
    border: "1px solid #e5e3df",
  },
  ".cm-panels.cm-panels-top": {
    borderBottom: "1px solid #e5e3df",
  },
  ".cm-panels.cm-panels-bottom": {
    borderTop: "1px solid #e5e3df",
  },
  ".cm-search": {
    padding: "8px",
    "& input, & button": {
      fontFamily: "'Saira', sans-serif",
      fontSize: "14px",
    },
    "& input": {
      backgroundColor: "#ffffff",
      border: "1px solid #e5e3df",
      borderRadius: "4px",
      color: "#1a1817",
      padding: "4px 8px",
    },
    "& button": {
      backgroundColor: "#f5f3f0",
      border: "1px solid #e5e3df",
      borderRadius: "4px",
      color: "#1a1817",
      padding: "4px 12px",
      cursor: "pointer",
    },
    "& button:hover": {
      backgroundColor: "#e5e3df",
    },
  },
  ".cm-searchMatch": {
    backgroundColor: "#f59e0b33",
    outline: "1px solid #f59e0b",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "#f59e0b66",
  },
  ".cm-scroller": {
    fontFamily: "'Saira', monospace",
    lineHeight: "1.6",
  },
}, { dark: false });

/**
 * Syntax Highlighting for Dark Theme
 */
const stelsDarkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#f59e0b", fontWeight: "500" },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "#f0eeec" },
  { tag: [t.function(t.variableName), t.labelName], color: "#56a8f5" },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "#d4a574" },
  { tag: [t.definition(t.name), t.separator], color: "#f0eeec" },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "#d4a574" },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "#f59e0b" },
  { tag: [t.meta, t.comment], color: "#6b6866", fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "#56a8f5", textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: "#f59e0b" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#d4a574" },
  { tag: [t.processingInstruction, t.string, t.inserted], color: "#a3be8c" },
  { tag: t.invalid, color: "#bf616a" },
]);

/**
 * Syntax Highlighting for Light Theme
 */
const stelsLightHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#d97706", fontWeight: "500" },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "#1a1817" },
  { tag: [t.function(t.variableName), t.labelName], color: "#0066cc" },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "#92400e" },
  { tag: [t.definition(t.name), t.separator], color: "#1a1817" },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "#92400e" },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "#d97706" },
  { tag: [t.meta, t.comment], color: "#78716c", fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "#0066cc", textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: "#d97706" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#92400e" },
  { tag: [t.processingInstruction, t.string, t.inserted], color: "#047857" },
  { tag: t.invalid, color: "#dc2626" },
]);

// Export themes with syntax highlighting
export const stelsDarkThemeWithHighlight = [
  stelsDarkTheme,
  syntaxHighlighting(stelsDarkHighlight),
];

export const stelsLightThemeWithHighlight = [
  stelsLightTheme,
  syntaxHighlighting(stelsLightHighlight),
];

