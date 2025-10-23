import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface DropdownSeparatorProps {
  className?: string;
}

/**
 * Simple dropdown menu component without external dependencies
 */
export function SimpleDropdown({
  children,
  trigger,
  align = "end",
  className,
}: DropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleToggle = (): void => {
    setIsOpen(!isOpen);
  };

  const getAlignmentStyle = (): React.CSSProperties => {
    if (align === "end") {
      return {
        right: `${window.innerWidth - position.left - position.width}px`,
      };
    } else if (align === "center") {
      return {
        left: `${position.left + position.width / 2}px`,
        transform: "translateX(-50%)",
      };
    }
    return { left: `${position.left}px` };
  };

  return (
    <div ref={triggerRef} className="relative">
      <div onClick={handleToggle}>
        {trigger}
      </div>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            className={cn(
              "fixed z-[9999] min-w-[8rem] overflow-hidden rounded border border-border bg-card/95 backdrop-blur-md p-1 text-popover-foreground",
              className,
            )}
            style={{
              top: `${position.top}px`,
              ...getAlignmentStyle(),
            }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

export function SimpleDropdownItem({
  children,
  onClick,
  className,
}: DropdownItemProps): React.ReactElement {
  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function SimpleDropdownSeparator(
  { className }: DropdownSeparatorProps,
): React.ReactElement {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
}
