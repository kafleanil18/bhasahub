import { createContext, useContext, useId, useLayoutEffect, useRef } from 'react';

// Lets a page hold the shared ink loader until its first data has arrived.
export const PageLoadContext = createContext(null);

/*
 * Call in any component whose first render waits on the server:
 *   useInitialLoad(loading, 'Loading your tone practice…');
 * While `loading` is true on the first load, the surrounding PageLoadGate shows the ink loader and
 * keeps the page rendered but hidden, so every request on the page runs at the same time.
 * Only the first load counts: a later refresh or retry updates the page in place.
 * `maxWait` (ms) releases the gate even if loading never finishes, so a page is never stuck hidden.
 * Components with no data to wait for simply don't call this, and render instantly.
 */
export function useInitialLoad(loading, message = '', { maxWait = 12000 } = {}) {
  const gate = useContext(PageLoadContext);
  const id = useId();
  const done = useRef(false);
  // Layout effect: the gate updates before the browser paints, so a page never flashes half-loaded.
  useLayoutEffect(() => {
    if (!gate || done.current) return undefined;
    if (!loading) { done.current = true; return undefined; }
    // The gate ignores loads that start after the page was shown (tabs, dialogs, retries).
    if (!gate.add(id, message)) { done.current = true; return undefined; }
    const timer = window.setTimeout(() => { done.current = true; gate.remove(id); }, maxWait);
    return () => { window.clearTimeout(timer); gate.remove(id); };
  }, [gate, id, loading, message, maxWait]);
}
