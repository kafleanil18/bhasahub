// Conversations always use the Google Mandarin voice; other Mandarin voices are only a fallback where Google isn't offered (e.g. iPhone, Safari).
export function pickConversationVoice(voices) {
  const google = voices.filter(voice => /google/i.test(voice.name));
  return google.find(voice => /^zh-(CN|Hans)/i.test(voice.lang)) || google[0] || voices[0] || null;
}
