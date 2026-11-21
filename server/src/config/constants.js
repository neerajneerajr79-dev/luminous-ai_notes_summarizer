const SUPPORTED_FILE_TYPES = {
  'application/pdf': { ext: '.pdf', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: '.docx',
    label: 'DOCX',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    ext: '.pptx',
    label: 'PPTX',
  },
  'text/plain': { ext: '.txt', label: 'TXT' },
};

const SUMMARY_TYPES = [
  'quick',
  'detailed',
  'exam',
  'simple',
  'revision',
];

const QUIZ_TYPES = ['mcq', 'truefalse', 'short'];
const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard'];

module.exports = {
  SUPPORTED_FILE_TYPES,
  SUMMARY_TYPES,
  QUIZ_TYPES,
  QUIZ_DIFFICULTIES,
};
