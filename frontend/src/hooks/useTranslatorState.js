import { useRef, useState } from 'react';
import { DEFAULT_SILENCE_DURATION, DEFAULT_SENSITIVITY } from '@/utils/translatorConstants';

export const useTranslatorState = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingSource, setIsPlayingSource] = useState(false);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('translator_premium') === 'true');
  const [premiumEmail, setPremiumEmail] = useState(() => localStorage.getItem('translator_email') || '');
  const [offlineMode, setOfflineMode] = useState(false);
  const [showPhrasebook, setShowPhrasebook] = useState(false);
  const [phrasebookCategory, setPhrasebookCategory] = useState(null);
  const [offlineTranslation, setOfflineTranslation] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [handsFreeStatus, setHandsFreeStatus] = useState('waiting');
  const [audioLevel, setAudioLevel] = useState(0);
  const [silenceDuration, setSilenceDuration] = useState(DEFAULT_SILENCE_DURATION);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);

  const debounceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const recordingStreamRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const stopRecordingTimeoutRef = useRef(null);
  const skipNextDebounceRef = useRef(false);
  const isStartingRecordingRef = useRef(false);
  const silenceDurationRef = useRef(DEFAULT_SILENCE_DURATION);
  const sensitivityRef = useRef(DEFAULT_SENSITIVITY);
  const peakAudioLevelRef = useRef(0);
  const conversationRecorderRef = useRef(null);
  const conversationStreamRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const conversationModeRef = useRef(false);
  const handsFreeModeRef = useRef(false);
  const handsFreeStatusRef = useRef('waiting');
  const handsFreeRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const silenceStartRef = useRef(null);
  const recordingChunksRef = useRef([]);

  return {
    state: {
      audioLevel,
      conversationHistory,
      conversationMode,
      copied,
      error,
      handsFreeMode,
      handsFreeStatus,
      isListening,
      isOnline,
      isPlayingSource,
      isPlayingTarget,
      isPremium,
      isProcessing,
      isProcessingPayment,
      isRecording,
      isTranslating,
      offlineMode,
      offlineTranslation,
      paymentEmail,
      phrasebookCategory,
      premiumEmail,
      sensitivity,
      showPaymentModal,
      showPhrasebook,
      silenceDuration,
      sourceLang,
      sourceText,
      translatedText
    },
    refs: {
      analyserRef,
      animationFrameRef,
      audioChunksRef,
      audioContextRef,
      audioRef,
      conversationModeRef,
      conversationRecorderRef,
      conversationStreamRef,
      debounceRef,
      handsFreeModeRef,
      handsFreeRecorderRef,
      handsFreeStatusRef,
      isSpeakingRef,
      isStartingRecordingRef,
      mediaRecorderRef,
      peakAudioLevelRef,
      recordingChunksRef,
      recordingStartedAtRef,
      recordingStreamRef,
      sensitivityRef,
      silenceDurationRef,
      silenceStartRef,
      silenceTimeoutRef,
      skipNextDebounceRef,
      stopRecordingTimeoutRef
    },
    setters: {
      setAudioLevel,
      setConversationHistory,
      setConversationMode,
      setCopied,
      setError,
      setHandsFreeMode,
      setHandsFreeStatus,
      setIsListening,
      setIsOnline,
      setIsPlayingSource,
      setIsPlayingTarget,
      setIsPremium,
      setIsProcessing,
      setIsProcessingPayment,
      setIsRecording,
      setIsTranslating,
      setOfflineMode,
      setOfflineTranslation,
      setPaymentEmail,
      setPhrasebookCategory,
      setPremiumEmail,
      setSensitivity,
      setShowPaymentModal,
      setShowPhrasebook,
      setSilenceDuration,
      setSourceLang,
      setSourceText,
      setTranslatedText
    }
  };
};