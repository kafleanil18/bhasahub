import { useEffect, useId, useRef } from 'react';

export default function AccessDialog({ title, description, busy, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);
  return <dialog className="access-dialog" ref={ref} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="access-dialog-heading"><div><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div><button type="button" className="access-close" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button></div>
    {children}
  </dialog>;
}
