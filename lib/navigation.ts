/**
 * The URL is the source of truth for which wig is open: `/?wig=<slug>`.
 *
 * Opening a wig pushes a history entry, so the browser's Back button, our
 * "Back to collection" button, Escape, the nav and the logo all travel the same
 * road: `closeWig()` steps back through history when we created the entry, and
 * a single popstate listener (see <RouteSync>) updates the store.
 */
import { getProduct } from "@/data/products";
import { useShop, type ScrollIntent } from "@/store/shop";

const ENTRY = "orikiWig";

export function wigFromLocation(): string | null {
  const slug = new URLSearchParams(window.location.search).get("wig");
  return slug && getProduct(slug) ? slug : null;
}

function urlFor(slug: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (slug) params.set("wig", slug);
  else params.delete("wig");
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}`;
}

/** Opens a wig in the configurator. `replace` avoids piling up history (demo mode). */
export function openWig(slug: string, { replace = false } = {}) {
  if (!getProduct(slug)) return;
  const state = { ...(window.history.state ?? {}) };
  if (replace) {
    // Only entries we pushed are marked — closing must never step off the site.
    delete state[ENTRY];
    window.history.replaceState(state, "", urlFor(slug));
  } else {
    window.history.pushState({ ...state, [ENTRY]: slug }, "", urlFor(slug));
  }
  useShop.getState().open(slug);
}

/** Closes the configurator from any control and lets the wig fly home. */
export function closeWig(scroll: ScrollIntent = "collection") {
  const { activeId, close } = useShop.getState();
  if (!activeId) return;
  close(scroll);
  if (window.history.state?.[ENTRY]) {
    // We pushed this entry: step back so Back/Forward stay symmetrical. The
    // store is already closed, so the resulting popstate is a no-op.
    window.history.back();
  } else {
    // Arrived by refresh or a shared link — there is nothing of ours to go back to.
    const state = { ...(window.history.state ?? {}) };
    delete state[ENTRY];
    window.history.replaceState(state, "", urlFor(null));
  }
}

/** Brings the store in line with the URL after the browser's Back/Forward. */
export function syncFromLocation() {
  const slug = wigFromLocation();
  const { activeId, open, close } = useShop.getState();
  if (slug && slug !== activeId) open(slug);
  else if (!slug && activeId) close("collection");
}
