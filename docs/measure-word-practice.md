# Measure Word Practice

Available under Practice Tools, after signing in. Includes 132 phrases across five topics and ten classifiers: 个、本、杯、件、只、张、把、台、辆、条.

Mixed rounds contain one question per classifier. Topic rounds select ten phrases. Students select one of four choices, receive immediate correct/incorrect feedback and an explanation, then continue. Results include missed phrases and a retry option. Every phrase has character-level pinyin, including spoken tone changes for 一 and 两 before classifiers.

Answer choices exclude common valid alternatives, including 条 for dogs, 只 for fish, 张 for chairs, and 台 for vehicles. The English prompt specifies cups/glasses where container choice matters.

An optional device Mandarin speech voice plays the correct phrase only after an answer is selected, with replay and slow playback available. Practice remains usable without speech support. No AI service or audio upload is required. Results last for the current session.

Validation: node --test client/src/practice/*.test.js; client build and lint; browser checks cover scoring, ten-question completion, retry, post-answer audio, unavailable voices, and responsive widths.
