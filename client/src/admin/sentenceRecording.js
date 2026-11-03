export const MAX_RECORDING_SECONDS = 60;
export const MAX_RECORDING_BYTES = 15 * 1024 * 1024;

export function recordingMimeType(Recorder = window.MediaRecorder) {
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']
    .find(type => Recorder.isTypeSupported(type)) || '';
}

export function recordingExtension(type) {
  if (/mp4|aac/i.test(type)) return 'm4a';
  if (/ogg/i.test(type)) return 'ogg';
  if (/wav/i.test(type)) return 'wav';
  return 'webm';
}
