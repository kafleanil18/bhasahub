// Admin's WhatsApp / Viber number in international format, digits only.
// VITE_CONTACT_PHONE in the client environment overrides it.
export const CONTACT_PHONE = (import.meta.env.VITE_CONTACT_PHONE || '+9779865498607').replace(/\D/g, '');
