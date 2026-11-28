// One way to call the BhasaHub API.
//
// apiFetch(path, options) behaves like fetch and resolves to the Response, so callers keep their
// own handling. It adds the stored sign-in token, accepts a `timeout` in milliseconds and a `json`
// body, and notices when the server says the session is no longer valid.
//
// apiJson(path, options) does the same, then resolves to the parsed body or throws an ApiError
// carrying the server's message and the HTTP status.

export const SESSION_EXPIRED_EVENT = 'bhasahub:session-expired';

// Sign-in, registration and password flows answer 401 for a wrong password or code,
// which says nothing about the stored session. /api/auth/me does reflect the session.
const AUTH_FLOW = /\/api\/auth\/(?!me(?:[/?#]|$))/;

export const apiUrl = path => (/^https?:\/\//i.test(path) ? path : `${window.API_BASE_URL || ''}${path}`);
export const getToken = () => localStorage.getItem('token') || '';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let reportedToken = '';
function reportExpiredSession(token) {
  // Several requests often fail together; sign out once per token.
  if (reportedToken === token) return;
  reportedToken = token;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export async function apiFetch(path, options = {}) {
  const { timeout, json, auth = true, ...init } = options;
  const url = apiUrl(path);
  const headers = new Headers(init.headers);

  // A caller that sends its own Authorization header (signing a device out with the old token,
  // for example) manages that session itself, so its 401s are not reported.
  const token = auth && !headers.has('Authorization') ? getToken() : '';
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(json);
  }

  const signals = [init.signal, timeout ? AbortSignal.timeout(timeout) : null].filter(Boolean);
  if (signals.length) init.signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);

  const response = await fetch(url, { ...init, headers });
  // Only a 401 for the token still stored counts: a request that was already running when the
  // person signed out (or signed in as someone else) says nothing about the current session.
  if (response.status === 401 && token && token === getToken() && !AUTH_FLOW.test(url)) reportExpiredSession(token);
  return response;
}

export async function apiJson(path, { fallbackError = 'Something went wrong. Please try again.', ...options } = {}) {
  const response = await apiFetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || fallbackError, response.status, data);
  return data;
}
