import { useEffect, useState } from "react";

interface AriaLiveProps {
  message: string;
  priority?: "polite" | "assertive";
  className?: string;
}

/**
 * ARIA Live Region Component
 * Announces dynamic changes to screen readers
 */
export function AriaLive({
  message,
  priority = "polite",
  className,
}: AriaLiveProps) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // Clear after announcement to allow re-announcement of same message
      const timer = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={className}
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
    >
      {announcement}
    </div>
  );
}

