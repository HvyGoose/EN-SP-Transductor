import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { offlineTranslator } from '@/services/offlineService';
import { API, TRANSLATION_DEBOUNCE_MS } from '@/utils/translatorConstants';

export const useTranslatorEffects = ({
  refs,
  setters,
  state,
  translateText
}) => {
  const {
    debounceRef,
    skipNextDebounceRef,
    stopRecordingTimeoutRef
  } = refs;
  const {
    setIsOnline,
    setIsPremium
  } = setters;
  const {
    sourceText
  } = state;

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    toast.success('Back online!');
  }, [setIsOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    toast.warning("You're offline. Using phrasebook mode.");
  }, [setIsOnline]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOffline, handleOnline]);

  useEffect(() => {
    offlineTranslator.loadPhrasebook();
  }, []);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const savedEmail = localStorage.getItem('translator_email');
      if (!savedEmail) {
        return;
      }

      try {
        const response = await axios.post(`${API}/payments/check-premium`, {
          email: savedEmail.toLowerCase()
        });

        if (response.data.is_premium) {
          setIsPremium(true);
          localStorage.setItem('translator_premium', 'true');
        }
      } catch (error) {
        void error;
      }
    };

    checkPremiumStatus();
  }, [setIsPremium]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return undefined;
    }

    debounceRef.current = setTimeout(() => {
      translateText(sourceText);
    }, TRANSLATION_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debounceRef, skipNextDebounceRef, sourceText, translateText]);

  useEffect(() => () => {
    const timeoutId = stopRecordingTimeoutRef.current;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, [stopRecordingTimeoutRef]);
};