// Conversation content is temporarily disabled in the two beginner courses.
export function supportsConversation(course) {
  return !(course?.language === 'chinese' && /\bHSK\s*[12]\b/i.test(`${course.title || ''} ${course.level || ''}`));
}
