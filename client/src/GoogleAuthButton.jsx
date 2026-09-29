import { useEffect, useRef, useCallback } from 'react';
import './GoogleAuthButton.css';

function GoogleAuthButton({ mode = 'signin', onSuccess, onError, setLoading }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const isConfigured = clientId && !clientId.includes('your_google_client_id');

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

    let intervalId = null;

    const setupGsi = () => {
      if (window.google?.accounts?.id && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => handleCredentialResponseRef.current(res),
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Clear previous render if any
          containerRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        } catch (e) {
          console.error('Error initializing Google Sign-In:', e);
        }
        return true;
      }
      return false;
    };

    if (!setupGsi()) {
      intervalId = setInterval(() => {
        if (setupGsi()) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId, isConfigured, mode]);

  const handlePlaceholderClick = () => {
    if (onError) {
      onError('Google Client ID is not configured yet. Please set VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env.');
    }
  };

  return (
    <div className="google-auth-container">
      {isConfigured ? (
        <div ref={containerRef} className="google-btn-slot"></div>
      ) : (
        <button
          type="button"
          className="google-custom-btn"
          onClick={handlePlaceholderClick}
          title="Google Client ID needs to be configured in .env"
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
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
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>
      )}
    </div>
  );
}

export default GoogleAuthButton;
