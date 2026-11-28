import { useState } from 'react';
import { recordingMedia } from './recordingMedia';

export default function RecordingPlayer({ session }) {
  const media = recordingMedia(session.videoUrl);
  const [failed, setFailed] = useState(false);
  if (!media) return <p role="alert">This video link is unavailable. Please contact your teacher.</p>;
  return <div className="recording-player">
    {media.type === 'embed' && <iframe src={media.src} title={`Recording: ${session.title}`} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
    {media.type === 'video' && <video controls preload="metadata" src={media.src} aria-label={session.title} onError={() => setFailed(true)} />}
    {failed && <p role="alert">The video could not play here. Try opening it on the video site.</p>}
    {media.type === 'link' && <p>This recording plays on the video provider’s website.</p>}
    <a className="access-button" href={session.videoUrl} target="_blank" rel="noopener noreferrer">Open video in a new tab</a>
  </div>;
}
