"use client";

import { useEffect } from "react";
import { closeWig, syncFromLocation, wigFromLocation } from "@/lib/navigation";
import { useShop } from "@/store/shop";

/** Keeps the open wig in step with the URL, history and the Escape key. */
export function RouteSync() {
  useEffect(() => {
    // We choreograph scrolling ourselves when views switch.
    window.history.scrollRestoration = "manual";

    // A refresh or shared link: open straight into the configurator.
    const slug = wigFromLocation();
    if (slug) useShop.getState().open(slug, "collection-instant");

    const onPop = () => syncFromLocation();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const { activeId, cartOpen, demo } = useShop.getState();
      // Escape closes the innermost layer only: drawer first, then the configurator.
      if (activeId && !cartOpen && !demo) closeWig();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
