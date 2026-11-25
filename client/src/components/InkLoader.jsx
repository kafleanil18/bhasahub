import { useId } from 'react';

// Ink-brush loading mark: an ensō circle is painted while "Loading / 加载中" is written beside it.
// Styles live in index.html so the first-paint copy there and this component look identical.
// `message` adds a plain line under the calligraphy, e.g. what is being loaded.
export default function InkLoader({ fullscreen = false, label = 'Loading', message = '' }) {
  const filter = `ink-rough-${useId().replace(/:/g, '')}`;
  return (
    <div className={`ink-loader${fullscreen ? ' is-fullscreen' : ''}`} role="status" aria-label={message || label}>
      <svg className="ink-loader-mark" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <filter id={filter} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="3.2" />
          </filter>
        </defs>
        <g filter={`url(#${filter})`} fill="none" stroke="currentColor">
          <path pathLength="1" strokeWidth="8.5" strokeLinecap="round" d="M67.3 18.6A42 42 0 1 1 45.6 20.5" />
          <path pathLength="1" strokeWidth="2.2" opacity=".5" d="M67.8 14.7A45.8 45.8 0 1 1 44.3 16.9" />
          <path pathLength="1" strokeWidth="1.8" opacity=".4" d="M66.6 22.4A38.2 38.2 0 1 1 46.9 24.1" />
          <circle className="ink-drop" cx="67.3" cy="18.6" r="5.6" />
        </g>
      </svg>
      <div className="ink-loader-words" aria-hidden="true">
        <span className="ink-loader-en">Loading</span>
        <span className="ink-loader-zh">加载中</span>
      </div>
      {message && <p className="ink-loader-message" aria-hidden="true">{message}</p>}
    </div>
  );
}
