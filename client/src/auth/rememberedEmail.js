// Remove credentials saved by older versions without reading them.
export function clearLegacyPassword(storage) {
  storage.removeItem('remembered_password');
}

export function loadRememberedEmail(storage) {
  try {
    clearLegacyPassword(storage);
    return storage.getItem('remembered_email') || '';
  } catch {
    return '';
  }
}

export function saveRememberedEmail(storage, email) {
  try {
    clearLegacyPassword(storage);
    if (email) storage.setItem('remembered_email', email);
    else storage.removeItem('remembered_email');
  } catch {
    // Disabled browser storage must not prevent sign-in.
  }
}
