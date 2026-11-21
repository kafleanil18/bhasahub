import { useEffect, useRef, useCallback, useState } from 'react';
import { loadGoogleIdentity } from './googleIdentity';
import './GoogleAuthButton.css';

function GoogleAuthButton({ mode = 'signin', onSuccess, onError, setLoading }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const isConfigured = clientId && !clientId.includes('your_google_client_id');
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);

  const handleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) {
      if (onError) onError('No credential received from Google');
      return;
    }

    if (setLoading) setLoading(true);
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (onError) onError(data.error || 'Google authentication failed');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onSuccess) onSuccess(data.user);
      }
    } catch {
      if (onError) onError('Could not reach the server to authenticate with Google');
    } finally {
      if (setLoading) setLoading(false);
    }
  }, [onError, onSuccess, setLoading]);

  const handleCredentialResponseRef = useRef(handleCredentialResponse);
  useEffect(() => {
    handleCredentialResponseRef.current = handleCredentialResponse;
  }, [handleCredentialResponse]);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    let active = true;
    let identity;
    let renderedWidth = 0;
    let renderTimer;
    const slot = containerRef.current;
    const ready = () => {
      if (!active) return;
      clearTimeout(renderTimer);
      setStatus('ready');
    };
    const failed = () => {
      if (active) setStatus('error');
    };
    const watchButton = () => {
      if (slot.querySelector('[role="button"]')) ready();
      slot.querySelectorAll('iframe').forEach(frame => {
        if (frame.dataset.googleLoadObserved) return;
        frame.dataset.googleLoadObserved = 'true';
        frame.addEventListener('load', ready, { once: true });
        frame.addEventListener('error', failed, { once: true });
      });
    };
    const observer = new MutationObserver(watchButton);
    observer.observe(slot, { childList: true, subtree: true });

    const setupGsi = () => {
      if (active && identity && slot) {
        try {
          const buttonWidth = Math.min(400, Math.floor(containerRef.current.clientWidth));
          if (!buttonWidth) return false;
          if (buttonWidth === renderedWidth && containerRef.current.childElementCount) return true;

          identity.initialize({
            client_id: clientId,
            callback: (res) => handleCredentialResponseRef.current(res),
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Clear previous render if any
          containerRef.current.innerHTML = '';

          clearTimeout(renderTimer);
          renderTimer = setTimeout(failed, 10000);
          identity.renderButton(containerRef.current, {
            type: 'standard',
            locale: 'en',
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonWidth,
          });
          renderedWidth = buttonWidth;
          watchButton();
        } catch {
          failed();
        }
        return true;
      }
      return false;
    };

    loadGoogleIdentity().then(api => {
      if (!active) return;
      identity = api;
      setupGsi();
    }).catch(failed);

    const resizeObserver = containerRef.current && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => setupGsi())
      : null;
    if (resizeObserver && containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      active = false;
      clearTimeout(renderTimer);
      observer.disconnect();
      resizeObserver?.disconnect();
    };
  }, [clientId, isConfigured, mode, retry]);

  const handlePlaceholderClick = () => {
    setStatus('loading');
    setRetry(value => value + 1);
  };

  return (
    <div className="google-auth-container">
      <div className="google-button-wrapper">
      {isConfigured && <div ref={containerRef} className={`google-btn-slot${status === 'ready' ? '' : ' is-pending'}`} aria-hidden={status !== 'ready'} inert={status !== 'ready'}></div>}
      {(!isConfigured || status !== 'ready') && (
        <button
          type="button"
          className="google-custom-btn"
          onClick={handlePlaceholderClick}
          disabled={!isConfigured || status === 'loading'}
          aria-busy={isConfigured && status === 'loading'}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.39 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.19 0 10.03 0 12s.46 3.81 1.26 5.42l4.02-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>{isConfigured && status === 'error' ? 'Retry Google sign-in' : mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>
      )}
      </div>
      {(!isConfigured || status !== 'ready') && <p className="google-auth-status" role="status">{!isConfigured ? 'Google sign-in is unavailable. Please use email.' : status === 'error' ? 'Google sign-in could not load. Retry, or use email below.' : 'Loading Google sign-in…'}</p>}
    </div>
  );
}

export default GoogleAuthButton;
