export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function formatSessionDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`));
}
// Only trusted video providers are embedded. Other HTTPS links open on their own site.
export function recordingMedia(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
    id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  }
  if (id && /^[\w-]{11}$/.test(id)) return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` };
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?\/?$/);
    if (match) {
      const hash = match[2] || url.searchParams.get('h');
      return { type: 'embed', src: `https://player.vimeo.com/video/${match[1]}${hash ? `?h=${encodeURIComponent(hash)}` : ''}` };
    }
  }
  if (host === 'drive.google.com') {
    const file = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1];
    if (file) return { type: 'embed', src: `https://drive.google.com/file/d/${file}/preview` };
  }
  if (/\.(mp4|webm|ogg|m4v)$/i.test(url.pathname)) return { type: 'video', src: url.href };
  return { type: 'link', src: url.href };
}
