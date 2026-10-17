import { useCallback, useEffect, useState } from "react";

export type GameView = "home" | "online";

function readViewFromUrl(): GameView {
  if (typeof window === "undefined") return "home";
  return new URLSearchParams(window.location.search).get("view") === "online" ? "online" : "home";
}

/** Keeps the SPA view synchronized with the URL and browser history. */
export function useGameNavigation() {
  const [activeView, setActiveView] = useState<GameView>(readViewFromUrl);

  useEffect(() => {
    const syncViewFromUrl = () => setActiveView(readViewFromUrl());
    window.addEventListener("popstate", syncViewFromUrl);
    return () => window.removeEventListener("popstate", syncViewFromUrl);
  }, []);

  const navigateView = useCallback((view: GameView) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    if (view === "online") url.searchParams.set("view", "online");
    else url.searchParams.delete("view");
    window.history.pushState({}, "", url);
  }, []);

  return { activeView, navigateView };
}
