import Icon from './Icon';
import './RefreshButton.css';

// Reloads a page or its data. Every refresh and retry control uses it, so they share one look:
// a quiet button with the ink reload icon, which turns while `busy`.
export default function RefreshButton({ children = 'Refresh', busy = false, className = '', disabled, ...props }) {
  return <button type="button" {...props} className={`refresh-button${busy ? ' is-busy' : ''}${className ? ` ${className}` : ''}`} disabled={busy || disabled} aria-busy={busy || undefined}>
    <Icon name="refresh" /><span>{children}</span>
  </button>;
}
