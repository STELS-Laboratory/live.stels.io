/**
 * Editor components type definitions
 */

/**
 * CodeMirror editor props
 */
export interface CodeMirrorEditorProps {
	value: string;
	onChange: (value: string) => void;
	language?: string;
	readOnly?: boolean;
	theme?: string;
	className?: string;
}

/**
 * CodeMirror completion interface
 */
export interface Completion {
	label: string;
	type: string;
	info?: string;
	apply?: string;
}

