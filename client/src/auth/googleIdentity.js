const SCRIPT_URL = 'https://accounts.google.com/gsi/client?hl=en';
let pending;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    let script = document.querySelector('script[src^="https://accounts.google.com/gsi/client"]');
    if (script?.dataset.googleLoadFailed === 'true') {
      script.remove();
      script = null;
    }
    const created = !script;
    script ||= document.createElement('script');
    let timer;
    const finish = error => {
      clearTimeout(timer);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (error) {
        script.dataset.googleLoadFailed = 'true';
        reject(error);
      } else resolve(window.google.accounts.id);
    };
    const onLoad = () => finish(window.google?.accounts?.id ? null : new Error('Google sign-in did not initialize'));
    const onError = () => finish(new Error('Google sign-in could not load'));
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    timer = setTimeout(onError, 12000);
    if (created) {
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch(error => {
    pending = null;
    throw error;
  });
  return pending;
}
