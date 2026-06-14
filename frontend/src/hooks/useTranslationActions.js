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
import { useLatestValue } from '@/hooks/useLatestValue';

export const useTranslationActions = ({ refs, setters, state }) => {
  const sourceLang = state.sourceLang;
  const targetLang = getTargetLanguage(sourceLang);
  const isOnlineRef = useLatestValue(state.isOnline);
  const offlineModeRef = useLatestValue(state.offlineMode);
  const sourceTextRef = useLatestValue(state.sourceText);
  const translatedTextRef = useLatestValue(state.translatedText);
  const { setCopied, setError, setIsTranslating, setOfflineTranslation, setSourceLang, setSourceText, setTranslatedText } = setters;

  const translateText = useCallback(async (text) => {
    if (!text.trim()) {
      setTranslatedText('');
      setOfflineTranslation(null);
      return;
    }

    if (!isOnlineRef.current || offlineModeRef.current) {
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
  }, [offlineModeRef, isOnlineRef, setError, setIsTranslating, setOfflineTranslation, setTranslatedText, sourceLang, targetLang]);

  const handleSourceChange = useCallback((event) => {
    setSourceText(event.target.value);
  }, [setSourceText]);

  const handleSwap = useCallback(() => {
    setSourceLang(targetLang);
    setSourceText(translatedTextRef.current);
    setTranslatedText(sourceTextRef.current);
  }, [setSourceLang, setSourceText, setTranslatedText, sourceTextRef, targetLang, translatedTextRef]);

  const handleCopy = useCallback(async () => {
    const textToCopy = translatedTextRef.current;
    if (!textToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [setCopied, translatedTextRef]);

  return {
    handleCopy,
    handleSourceChange,
    handleSwap,
    targetLang,
    translateText
  };
};