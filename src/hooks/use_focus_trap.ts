import { useEffect, useRef } from "react";

/**
 * Focus Trap Hook
 * Traps focus within a container element and restores focus to the previous element on unmount
 * 
 * @param isActive - Whether the focus trap should be active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save current focus
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => {
        // Filter out elements that are not visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    const focusableElements = getFocusableElements();
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const currentFocus = document.activeElement as HTMLElement;

      if (!container.contains(currentFocus)) {
        // If focus is outside container, move to first element
        e.preventDefault();
        firstElement?.focus();
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab: move backwards
        if (currentFocus === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: move forwards
        if (currentFocus === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

