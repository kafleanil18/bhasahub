import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import InkLoader from '../components/InkLoader';
import { PageLoadContext } from './pageLoad';

// While the page underneath is still loading its first data, it renders off-screen (laid out, so
// sizes and canvases are right, but invisible and inert) and the ink loader shows in its place.
const HIDDEN = { position: 'absolute', insetInline: 0, top: 0, height: 0, overflow: 'hidden', visibility: 'hidden' };

/*
 * One per layout. Pages report their first load with useInitialLoad().
 * The gate only listens while a page is opening: from a route change until the page is first
 * shown. Anything that starts loading after that (a tab, a dialog, a retry) keeps its own small
 * loading state instead of hiding the whole page again.
 */
export default function PageLoadGate({ children }) {
  const { pathname } = useLocation();
  const [pending, setPending] = useState(() => new Map());
  // The same loads as `pending`, but updated straight away rather than on the next render.
  const waiting = useRef(new Set());
  const listening = useRef(true);
  const lastPath = useRef(pathname);
  if (lastPath.current !== pathname) { lastPath.current = pathname; listening.current = true; }

  const add = useCallback((id, message) => {
    if (!listening.current) return false;
    waiting.current.add(id);
    setPending(previous => new Map(previous).set(id, message));
    return true;
  }, []);
  // A load can be removed twice (by its time limit, then by its cleanup); only the first counts.
  const remove = useCallback(id => {
    if (!waiting.current.delete(id)) return;
    setPending(previous => {
      const next = new Map(previous); next.delete(id); return next;
    });
  }, []);
  const api = useMemo(() => ({ add, remove }), [add, remove]);

  // Runs after the page's own layout effects, so a page that registered is already counted.
  // Once nothing is pending, the page is shown and the gate stops listening until the next route.
  useLayoutEffect(() => {
    if (waiting.current.size === 0) listening.current = false;
  }, [pathname, pending]);

  const loading = pending.size > 0;
  const message = [...pending.values()].find(Boolean) || '';
  return <PageLoadContext.Provider value={api}>
    {loading && <InkLoader message={message} />}
    <div className="page-load-gate" style={loading ? HIDDEN : { display: 'contents' }} inert={loading || undefined} aria-hidden={loading || undefined}>{children}</div>
  </PageLoadContext.Provider>;
}
