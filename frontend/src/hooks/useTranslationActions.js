import { useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { offlineTranslator } from '@/services/offlineService';
import {
  API,
  COPY_FEEDBACK_DURATION
} from '@/utils/translatorConstants';
import {
  getTargetLanguage
} from '@/utils/translatorHelpers';

export const useTranslationActions = ({ refs, setters, state }) => {
  const { targetLang, sourceLang } = {
    sourceLang: state.sourceLang,
    targetLang: getTargetLanguage(state.sourceLang)
  };
  const { setCopied, setError, setIsTranslating, setOfflineTranslation, setSourceLang, setSourceText, setTranslatedText } = setters;

  const translateText = useCallback(async (text) => {
    if (!text.trim()) {
      setTranslatedText('');
      setOfflineTranslation(null);
      return;
    }

    if (!state.isOnline || state.offlineMode) {
      setIsTranslating(true);
      const result = offlineTranslator.translate(text, sourceLang);
      setOfflineTranslation(result);

      if (result) {
        setTranslatedText(result.translation);
      } else {
        setTranslatedText('[Phrase not in offline dictionary]');
        setOfflineTranslation({ notFound: true });
      }

      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    setError(null);
    setOfflineTranslation(null);

    try {
      const response = await axios.post(`${API}/translate`, {
        text,
        source_lang: sourceLang,
        target_lang: targetLang
      });
      setTranslatedText(response.data.translated_text);
    } catch (error) {
      const result = offlineTranslator.translate(text, sourceLang);
      setOfflineTranslation(result);

      if (result) {
        setTranslatedText(result.translation);
        toast.info('Using offline translation');
      } else {
        setError('Translation failed. Please try again.');
        toast.error('Translation failed');
      }
    } finally {
      setIsTranslating(false);
    }
  }, [setError, setIsTranslating, setOfflineTranslation, setTranslatedText, sourceLang, state.isOnline, state.offlineMode, targetLang]);

  const handleSourceChange = useCallback((event) => {
    setSourceText(event.target.value);
  }, [setSourceText]);

  const handleSwap = useCallback(() => {
    setSourceLang(targetLang);
    setSourceText(state.translatedText);
    setTranslatedText(state.sourceText);
  }, [setSourceLang, setSourceText, setTranslatedText, state.sourceText, state.translatedText, targetLang]);

  const handleCopy = useCallback(async () => {
    if (!state.translatedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.translatedText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [setCopied, state.translatedText]);

  return {
    handleCopy,
    handleSourceChange,
    handleSwap,
    targetLang,
    translateText
  };
};