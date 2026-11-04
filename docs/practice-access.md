# Practice access

Pinyin remains available to guests. All other Practice Tools require sign-in, including character tracing, listening, sentence building, measure words, numbers, dictation, mock tests, and the existing class calendar.

The hero shortcuts and Practice Tools menu use one guarded navigation handler. Guest selections open sign-in; protected views also check the user before mounting. Logging out clears active practice views. The hero and dropdown explain the sign-in requirement.

The sentence catalog and mock test APIs require valid authentication. Their clients send the session token. Existing course access rules still apply to course listening material. There is no new subscription requirement for the other tools.

The homepage no longer renders the general feature section or Daily Vocabulary Spotlight. Their unused home-page audio handlers and imports have been removed.

Validation includes authenticated/unauthenticated API tests, guest shortcuts from both surfaces, signed-in student navigation, public Pinyin, and responsive homepage checks.
