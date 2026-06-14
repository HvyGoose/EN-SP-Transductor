import {
  HIGH_SENSITIVITY_THRESHOLD,
  LOW_SENSITIVITY_THRESHOLD,
  MEDIUM_SENSITIVITY_THRESHOLD
} from '@/utils/translatorConstants';

export const getTargetLanguage = (sourceLang) => (sourceLang === 'en' ? 'es' : 'en');

export const getLanguageName = (lang) => (lang === 'en' ? 'English' : 'Spanish');

export const getSensitivityLabel = (value) => {
  if (value < LOW_SENSITIVITY_THRESHOLD) return 'Low';
  if (value < MEDIUM_SENSITIVITY_THRESHOLD) return 'Medium';
  if (value < HIGH_SENSITIVITY_THRESHOLD) return 'High';
  return 'Max';
};

export const getStatusText = ({ error, isTranslating, offlineMode }) => {
  if (error) return 'Error';
  if (isTranslating) return 'Translating';
  if (offlineMode) return 'Offline';
  return 'Ready';
};

export const getStatusDotClass = ({ error, isTranslating }) => {
  if (error) return 'error';
  if (isTranslating) return 'loading';
  return '';
};

export const getHoldToTalkText = ({ isListening, isProcessing }) => {
  if (isListening) return 'Listening... Release to translate';
  if (isProcessing) return 'Translating...';
  return 'Hold to Talk';
};

export const getConversationButtonClass = ({ conversationMode, isPremium }) => {
  const baseClass = 'swiss-btn flex items-center gap-2 px-3 py-2 border text-sm font-mono uppercase tracking-wider';
  if (conversationMode) return `${baseClass} bg-black text-white border-black`;
  if (isPremium) return `${baseClass} border-black`;
  return `${baseClass} border-gray-400 text-gray-600`;
};

export const createConversationEntryId = () => `${crypto.randomUUID()}-${Math.round(performance.now())}`;

export const buildConversationEntry = (responseData) => ({
  id: createConversationEntryId(),
  detected: responseData.detected_language === 'es' ? 'Spanish' : 'English',
  original: responseData.original_text,
  translated: responseData.translated_text,
  targetLang: responseData.target_language === 'es' ? 'Spanish' : 'English'
});

export const isValidEmail = (value) => Boolean(value) && value.includes('@');