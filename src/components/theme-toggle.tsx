"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("nexo-theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      type="button"
    >
      {theme === "dark" ? (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
          <path
            d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      )}
    </button>
  );
}
