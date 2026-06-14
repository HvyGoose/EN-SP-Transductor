import { useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useLatestValue } from '@/hooks/useLatestValue';
import { offlineSpeechSynthesis } from '@/services/offlineService';
import { API } from '@/utils/translatorConstants';
import { getTargetLanguage } from '@/utils/translatorHelpers';

export const useAudioPlaybackManager = ({ refs, setters, state }) => {
  const { audioRef } = refs;
  const { setIsPlayingSource, setIsPlayingTarget } = setters;
  const targetLang = getTargetLanguage(state.sourceLang);
  const isOnlineRef = useLatestValue(state.isOnline);
  const offlineModeRef = useLatestValue(state.offlineMode);
  const sourceTextRef = useLatestValue(state.sourceText);
  const translatedTextRef = useLatestValue(state.translatedText);
  const sourceLangRef = useLatestValue(state.sourceLang);

  const playAudio = useCallback(async (text, lang, setPlaying) => {
    if (!text.trim()) {
      toast.error('No text to speak');
      return;
    }

    setPlaying(true);

    if (!isOnlineRef.current || offlineModeRef.current) {
      try {
        await offlineSpeechSynthesis.speak(text, lang);
      } catch (error) {
        toast.error('Speech not available offline');
      } finally {
        setPlaying(false);
      }
      return;
    }

    try {
      const response = await axios.post(`${API}/text-to-speech`, { text, lang });
      const audioBlob = new Blob([
        Uint8Array.from(atob(response.data.audio), (character) => character.charCodeAt(0))
      ], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setPlaying(false);
        offlineSpeechSynthesis.speak(text, lang).catch(() => {});
        toast.error('Audio playback failed, using device voice');
      };
      await audioRef.current.play();
    } catch (error) {
      try {
        await offlineSpeechSynthesis.speak(text, lang);
      } catch (fallbackError) {
        toast.error('Text-to-speech failed');
      } finally {
        setPlaying(false);
      }
    }
  }, [audioRef, isOnlineRef, offlineModeRef]);

  const handlePlaySource = useCallback(() => {
    if (!state.isPlayingSource) {
      playAudio(sourceTextRef.current, sourceLangRef.current, setIsPlayingSource);
      return;
    }

    audioRef.current.pause();
    setIsPlayingSource(false);
  }, [audioRef, playAudio, setIsPlayingSource, sourceLangRef, sourceTextRef, state.isPlayingSource]);

  const handlePlayTarget = useCallback(() => {
    if (!state.isPlayingTarget) {
      playAudio(translatedTextRef.current, targetLang, setIsPlayingTarget);
      return;
    }

    audioRef.current.pause();
    setIsPlayingTarget(false);
  }, [audioRef, playAudio, setIsPlayingTarget, state.isPlayingTarget, targetLang, translatedTextRef]);

  return {
    handlePlaySource,
    handlePlayTarget
  };
};