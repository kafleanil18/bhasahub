// Admin's WhatsApp / Viber number in international format, digits only.
// VITE_CONTACT_PHONE in the client environment overrides it.
export const CONTACT_PHONE = (import.meta.env.VITE_CONTACT_PHONE || '+9779865498607').replace(/\D/g, '');

export const LIVE_CLASS_MESSAGE = 'Hello, I would like to know about live Chinese classes.';

// WhatsApp chat link with the live-class enquiry pre-filled, or '' when no number is set.
export const liveClassInquiryHref = () => CONTACT_PHONE ? `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(LIVE_CLASS_MESSAGE)}` : '';
