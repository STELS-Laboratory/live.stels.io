import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            "top-full mt-1",
            alignmentClasses[align],
            className,
          )}
        >
          {children}
        </div>
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
