/**
 * UI components type definitions
 */

/**
 * Simple dropdown types
 */
export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropdownSeparatorProps {
  className?: string;
}
