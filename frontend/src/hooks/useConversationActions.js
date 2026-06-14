import { useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API, AUDIO_FFT_SIZE, HANDSFREE_ACTIVE_AUDIO_LEVEL, HANDSFREE_ACTIVE_RING_OPACITY, HANDSFREE_IDLE_RING_OPACITY, HANDSFREE_RECORDING_RING_BASE_SCALE, HANDSFREE_RECORDING_RING_SCALE_FACTOR } from '@/utils/translatorConstants';
import { createRecorder, stopMediaTracks } from '@/utils/audioRecorder';
import { buildConversationEntry } from '@/utils/translatorHelpers';
import { useLatestValue } from '@/hooks/useLatestValue';
import {
  isConversationAudioTooSmall,
  isPeakAudioBelowThreshold,
  shouldStartConversationListening,
  shouldStopForSilence
} from '@/hooks/useConversationValidation';

const createConversationAudioBlob = (chunks) => new Blob(chunks, { type: 'audio/webm' });

const createConversationRequest = (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'conversation.webm');
  return formData;
};

const updateHandsFreeState = (setHandsFreeStatus, handsFreeStatusRef, nextState) => {
  setHandsFreeStatus(nextState);
  handsFreeStatusRef.current = nextState;
};

const createUpgradePrompt = (openPaymentModal) => (
  <div>
    <strong>Conversation Mode is Premium</strong>
    <p className="text-sm mt-1">Auto-detect language & hands-free translation</p>
    <button
      onClick={() => {
        openPaymentModal();
        toast.dismiss();
      }}
      className="mt-2 bg-yellow-400 text-black px-3 py-1 text-sm font-bold"
    >
      Unlock Premium - $4.99
    </button>
  </div>
);

export const useConversationActions = ({ refs, setters, state }) => {
  const monitorAudioLevelRef = useRef(null);
  const processRecordedAudioRef = useRef(null);
  const stateRef = useLatestValue(state);
  const {
    analyserRef,
    animationFrameRef,
    audioContextRef,
    conversationModeRef,
    conversationRecorderRef,
    conversationStreamRef,
    handsFreeModeRef,
    handsFreeRecorderRef,
    handsFreeStatusRef,
    isSpeakingRef,
    peakAudioLevelRef,
    recordingChunksRef,
    sensitivityRef,
    silenceDurationRef,
    silenceStartRef,
    silenceTimeoutRef
  } = refs;
  const {
    setAudioLevel,
    setConversationHistory,
    setConversationMode,
    setHandsFreeMode,
    setHandsFreeStatus,
    setIsListening,
    setIsProcessing,
    setSensitivity,
    setShowPaymentModal,
    setSilenceDuration
  } = setters;

  const playConversationAudio = useCallback(async (audioData, onComplete) => {
    if (!audioData) {
      onComplete();
      return;
    }

    const audioBlob = new Blob([
      Uint8Array.from(atob(audioData), (character) => character.charCodeAt(0))
    ], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      onComplete();
    };
    audio.onerror = onComplete;
    await audio.play();
  }, []);

  const restartListening = useCallback(() => {
    if (!handsFreeModeRef.current || !conversationModeRef.current || !conversationStreamRef.current) {
      return;
    }

    recordingChunksRef.current = [];
    peakAudioLevelRef.current = 0;
    updateHandsFreeState(setHandsFreeStatus, handsFreeStatusRef, 'listening');

    try {
      const mediaRecorder = createRecorder(conversationStreamRef.current);
      handsFreeRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingChunksRef.current.length > 0 && handsFreeStatusRef.current === 'processing') {
          await processRecordedAudioRef.current?.();
        }
      };

      mediaRecorder.start(100);
      monitorAudioLevelRef.current?.();
      toast.success('Ready! Speak when ready.');
    } catch (error) {
      toast.error('Microphone error. Please try again.');
    }
  }, [conversationModeRef, conversationStreamRef, handsFreeModeRef, handsFreeRecorderRef, handsFreeStatusRef, peakAudioLevelRef, recordingChunksRef, setHandsFreeStatus]);

  const processRecordedAudio = useCallback(async () => {
    if (recordingChunksRef.current.length === 0) {
      restartListening();
      return;
    }

    const audioBlob = createConversationAudioBlob(recordingChunksRef.current);
    if (isConversationAudioTooSmall(audioBlob)) {
      restartListening();
      return;
    }

    if (isPeakAudioBelowThreshold(peakAudioLevelRef.current, sensitivityRef.current)) {
      restartListening();
      return;
    }

    try {
      toast.info('Translating...');
      const response = await axios.post(`${API}/conversation`, createConversationRequest(audioBlob), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!response.data.skipped && response.data.original_text) {
        setConversationHistory((previous) => [...previous, buildConversationEntry(response.data)]);
        await playConversationAudio(response.data.audio, restartListening);
        if (response.data.audio) {
          return;
        }
      }

      restartListening();
    } catch (error) {
      toast.error('Translation failed');
      restartListening();
    }
  }, [peakAudioLevelRef, playConversationAudio, recordingChunksRef, restartListening, sensitivityRef, setConversationHistory]);

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !handsFreeModeRef.current) {
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!handsFreeModeRef.current || !conversationModeRef.current) {
        return;
      }

      if (handsFreeStatusRef.current === 'processing') {
        animationFrameRef.current = requestAnimationFrame(checkLevel);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let index = 0; index < dataArray.length; index += 1) {
        sum += dataArray[index];
      }

      const average = sum / dataArray.length;
      setAudioLevel(Math.min(100, average * 1.5));
      const silenceDurationMs = silenceDurationRef.current * 1000;

      if (average > sensitivityRef.current) {
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          peakAudioLevelRef.current = average;
          updateHandsFreeState(setHandsFreeStatus, handsFreeStatusRef, 'recording');
        }

        if (average > peakAudioLevelRef.current) {
          peakAudioLevelRef.current = average;
        }
        silenceStartRef.current = null;
      } else if (isSpeakingRef.current) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        } else if (shouldStopForSilence({ silenceStart: silenceStartRef.current, silenceDurationMs, now: Date.now() })) {
          isSpeakingRef.current = false;
          silenceStartRef.current = null;
          updateHandsFreeState(setHandsFreeStatus, handsFreeStatusRef, 'processing');
          if (handsFreeRecorderRef.current?.state === 'recording') {
            handsFreeRecorderRef.current.stop();
          }
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }, [analyserRef, animationFrameRef, conversationModeRef, handsFreeModeRef, handsFreeRecorderRef, handsFreeStatusRef, isSpeakingRef, peakAudioLevelRef, sensitivityRef, setAudioLevel, setHandsFreeStatus, silenceDurationRef, silenceStartRef]);

  const startSilenceDetection = useCallback(async () => {
    if (!conversationStreamRef.current) {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = AUDIO_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(conversationStreamRef.current);
      source.connect(analyser);

      const mediaRecorder = createRecorder(conversationStreamRef.current);
      handsFreeRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingChunksRef.current.length > 0 && handsFreeStatusRef.current === 'processing') {
          await processRecordedAudioRef.current?.();
        }
      };

      mediaRecorder.start(100);
      monitorAudioLevelRef.current?.();
    } catch (error) {
      toast.error('Could not start audio monitoring');
    }
  }, [analyserRef, audioContextRef, conversationStreamRef, handsFreeRecorderRef, handsFreeStatusRef, recordingChunksRef]);

  const stopSilenceDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (handsFreeRecorderRef.current?.state === 'recording') {
      handsFreeRecorderRef.current.stop();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    isSpeakingRef.current = false;
    silenceStartRef.current = null;
    setAudioLevel(0);
  }, [animationFrameRef, audioContextRef, handsFreeRecorderRef, isSpeakingRef, setAudioLevel, silenceStartRef, silenceTimeoutRef]);

  const startConversationMode = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      conversationStreamRef.current = stream;
      conversationModeRef.current = true;
      setConversationMode(true);
      setConversationHistory([]);
      setIsProcessing(false);
      setHandsFreeMode(false);
      handsFreeModeRef.current = false;
      toast.success('Press & Hold mode ready! Hold the mic to speak.');
    } catch (error) {
      toast.error('Microphone access denied');
    }
  }, [conversationModeRef, conversationStreamRef, handsFreeModeRef, setConversationHistory, setConversationMode, setHandsFreeMode, setIsProcessing]);

  const stopConversationMode = useCallback(() => {
    conversationModeRef.current = false;
    handsFreeModeRef.current = false;
    setConversationMode(false);
    setIsListening(false);
    setIsProcessing(false);
    setHandsFreeMode(false);
    updateHandsFreeState(setHandsFreeStatus, handsFreeStatusRef, 'waiting');
    stopSilenceDetection();

    if (conversationRecorderRef.current?.state === 'recording') {
      conversationRecorderRef.current.stop();
    }
    if (handsFreeRecorderRef.current?.state === 'recording') {
      handsFreeRecorderRef.current.stop();
    }
    if (conversationStreamRef.current) {
      stopMediaTracks(conversationStreamRef.current);
      conversationStreamRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    toast.info('Conversation mode ended');
  }, [conversationModeRef, conversationRecorderRef, conversationStreamRef, handsFreeModeRef, handsFreeRecorderRef, handsFreeStatusRef, setConversationMode, setHandsFreeMode, setHandsFreeStatus, setIsListening, setIsProcessing, silenceTimeoutRef, stopSilenceDetection]);

  const handleConversationClick = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.conversationMode) {
      stopConversationMode();
      return;
    }

    if (!currentState.isPremium) {
      toast.info(createUpgradePrompt(() => setShowPaymentModal(true)), { duration: 5000 });
      return;
    }

    startConversationMode();
  }, [setShowPaymentModal, startConversationMode, stateRef, stopConversationMode]);

  const toggleHandsFreeMode = useCallback(() => {
    if (!stateRef.current.handsFreeMode) {
      setHandsFreeMode(true);
      handsFreeModeRef.current = true;
      updateHandsFreeState(setHandsFreeStatus, handsFreeStatusRef, 'listening');
      toast.success('Hands-free mode! Just speak, pause when done.');
      startSilenceDetection();
      return;
    }

    stopSilenceDetection();
    setHandsFreeMode(false);
    handsFreeModeRef.current = false;
    updateHandsFreeState(setHandsFreeStatus, handsFreeStatusRef, 'waiting');
    toast.success('Press & Hold mode ready!');
  }, [handsFreeModeRef, handsFreeStatusRef, setHandsFreeMode, setHandsFreeStatus, startSilenceDetection, stateRef, stopSilenceDetection]);

  const startListening = useCallback((stream) => {
    if (!stream || !conversationModeRef.current || stateRef.current.isProcessing) {
      return;
    }

    const mediaRecorder = createRecorder(stream);
    conversationRecorderRef.current = mediaRecorder;
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      if (!conversationModeRef.current) {
        return;
      }
      if (chunks.length === 0) {
        setIsListening(false);
        return;
      }

      setIsProcessing(true);
      setIsListening(false);

      try {
        const response = await axios.post(`${API}/conversation`, createConversationRequest(createConversationAudioBlob(chunks)), {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (!response.data.skipped && response.data.original_text) {
          setConversationHistory((previous) => [...previous, buildConversationEntry(response.data)]);
          await playConversationAudio(response.data.audio, () => setIsProcessing(false));
          if (response.data.audio) {
            return;
          }
        }

        setIsProcessing(false);
      } catch (error) {
        toast.error('Translation failed');
        setIsProcessing(false);
      }
    };

    mediaRecorder.start();
    setIsListening(true);
  }, [conversationModeRef, conversationRecorderRef, playConversationAudio, setConversationHistory, setIsListening, setIsProcessing, stateRef]);

  const handleConversationMouseDown = useCallback(() => {
    const currentState = stateRef.current;
    if (!shouldStartConversationListening({
      conversationMode: conversationModeRef.current,
      stream: conversationStreamRef.current,
      isProcessing: currentState.isProcessing,
      handsFreeMode: currentState.handsFreeMode
    })) {
      return;
    }

    startListening(conversationStreamRef.current);
  }, [conversationModeRef, conversationStreamRef, startListening, stateRef]);

  const handleConversationMouseUp = useCallback(() => {
    if (conversationRecorderRef.current?.state === 'recording') {
      conversationRecorderRef.current.stop();
    }
  }, [conversationRecorderRef]);

  const updateSilenceDuration = useCallback((value) => {
    setSilenceDuration(value);
    silenceDurationRef.current = value;
  }, [setSilenceDuration, silenceDurationRef]);

  const updateSensitivity = useCallback((value) => {
    setSensitivity(value);
    sensitivityRef.current = value;
  }, [sensitivityRef, setSensitivity]);

  processRecordedAudioRef.current = processRecordedAudio;
  monitorAudioLevelRef.current = monitorAudioLevel;

  return {
    handleConversationClick,
    handleConversationMouseDown,
    handleConversationMouseUp,
    stopConversationMode,
    stopSilenceDetection,
    toggleHandsFreeMode,
    updateSensitivity,
    updateSilenceDuration
  };
};