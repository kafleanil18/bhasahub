// Uploaded media can live on the API origin (local/dev disk storage, path like
// "/uploads/x.jpg") or on Cloudinary (already an absolute https:// URL). This
// resolves either form to something usable directly in a src attribute.
export function mediaUrl(path) {
  if (!path) return path;
  return /^https?:\/\//i.test(path) ? path : `${window.API_BASE_URL}${path}`;
}
