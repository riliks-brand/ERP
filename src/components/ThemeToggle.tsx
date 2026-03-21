"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="btn btn-outline"
      style={{
        padding: "0.4rem 0.8rem",
        fontSize: "0.8rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        justifyContent: "flex-start",
        marginTop: "1rem",
        border: "1px solid var(--color-border)",
      }}
      title="Toggle Light/Dark Mode"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
