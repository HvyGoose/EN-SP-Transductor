import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  ArrowsLeftRight, 
  Microphone, 
  SpeakerHigh, 
  Copy, 
  Check,
  Stop,
  Chats,
  X,
  Question,
  WifiSlash,
  WifiHigh,
  Crown,
  Book
} from "@phosphor-icons/react";
import { offlineTranslator, offlineSpeechSynthesis } from "@/services/offlineService";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  // State
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en"); // "en" or "es"
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingSource, setIsPlayingSource] = useState(false);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  
  // Offline & Premium state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('translator_premium') === 'true';
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const [showPhrasebook, setShowPhrasebook] = useState(false);
  const [phrasebookCategory, setPhrasebookCategory] = useState(null);
  const [offlineTranslation, setOfflineTranslation] = useState(null);
  
  // Conversation mode state
  const [conversationMode, setConversationMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [handsFreeStatus, setHandsFreeStatus] = useState('waiting'); // 'waiting', 'listening', 'recording', 'processing'
  const [audioLevel, setAudioLevel] = useState(0);
  const [silenceDuration, setSilenceDuration] = useState(2); // Default 2 seconds
  const [sensitivity, setSensitivity] = useState(25); // Default threshold (higher = less sensitive)
  const [peakAudioLevel, setPeakAudioLevel] = useState(0); // Track peak level during recording
  const silenceDurationRef = useRef(2);
  const sensitivityRef = useRef(25);
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
  
  // Refs
  const debounceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());

  const targetLang = sourceLang === "en" ? "es" : "en";
  const sourceLangName = sourceLang === "en" ? "English" : "Spanish";
  const targetLangName = targetLang === "en" ? "English" : "Spanish";

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!offlineMode) toast.success("Back online!");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Using phrasebook mode.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineMode]);

  // Load phrasebook on mount
  useEffect(() => {
    offlineTranslator.loadPhrasebook();
  }, []);

  // Toggle premium (for demo - in production this would be tied to payment)
  const togglePremium = () => {
    const newValue = !isPremium;
    setIsPremium(newValue);
    localStorage.setItem('translator_premium', newValue.toString());
    toast.success(newValue ? "Premium activated! Offline mode unlocked." : "Switched to free version.");
  };

  // Toggle offline mode (premium only)
  const toggleOfflineMode = () => {
    if (!isPremium) {
      toast.error("Offline mode is a premium feature. Upgrade to unlock!");
      return;
    }
    setOfflineMode(!offlineMode);
    toast.info(offlineMode ? "Switched to online mode" : "Offline mode enabled - using phrasebook");
  };

  // Offline translation using phrasebook
  const translateOffline = useCallback((text) => {
    const result = offlineTranslator.translate(text, sourceLang);
    setOfflineTranslation(result);
    if (result) {
      setTranslatedText(result.translation);
      return true;
    }
    return false;
  }, [sourceLang]);

  // Translation function
  const translateText = useCallback(async (text) => {
    if (!text.trim()) {
      setTranslatedText("");
      setOfflineTranslation(null);
      return;
    }

    // Use offline translation if offline or in offline mode
    if (!isOnline || offlineMode) {
      setIsTranslating(true);
      const result = offlineTranslator.translate(text, sourceLang);
      setOfflineTranslation(result);
      if (result) {
        setTranslatedText(result.translation);
      } else {
        setTranslatedText("[Phrase not in offline dictionary]");
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
        text: text,
        source_lang: sourceLang,
        target_lang: targetLang
      });
      setTranslatedText(response.data.translated_text);
    } catch (err) {
      console.error("Translation error:", err);
      // Fallback to offline translation on error
      const result = offlineTranslator.translate(text, sourceLang);
      setOfflineTranslation(result);
      if (result) {
        setTranslatedText(result.translation);
        toast.info("Using offline translation");
      } else {
        setError("Translation failed. Please try again.");
        toast.error("Translation failed");
      }
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLang, targetLang, isOnline, offlineMode]);

  // Debounced translation on text change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      translateText(sourceText);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [sourceText, translateText]);

  // Handle source text change
  const handleSourceChange = (e) => {
    setSourceText(e.target.value);
  };

  // Swap languages
  const handleSwap = () => {
    setSourceLang(targetLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // Speech-to-text (Recording)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Send to backend for transcription
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', sourceLang);

        try {
          const response = await axios.post(`${API}/speech-to-text`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSourceText(response.data.text);
          toast.success("Voice transcribed");
        } catch (err) {
          console.error("STT error:", err);
          toast.error("Voice recognition failed");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording... Click again to stop");
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Conversation Mode Functions
  const startConversationMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      conversationStreamRef.current = stream;
      conversationModeRef.current = true;
      setConversationMode(true);
      setConversationHistory([]);
      setIsProcessing(false);
      setHandsFreeMode(false);
      handsFreeModeRef.current = false;
      toast.success("Press & Hold mode ready! Hold the mic to speak.");
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied");
    }
  };

  const stopConversationMode = () => {
    conversationModeRef.current = false;
    handsFreeModeRef.current = false;
    setConversationMode(false);
    setIsListening(false);
    setIsProcessing(false);
    setHandsFreeMode(false);
    setHandsFreeStatus('waiting');
    handsFreeStatusRef.current = 'waiting';
    
    // Stop silence detection
    stopSilenceDetection();
    
    if (conversationRecorderRef.current && conversationRecorderRef.current.state === 'recording') {
      conversationRecorderRef.current.stop();
    }
    if (handsFreeRecorderRef.current && handsFreeRecorderRef.current.state === 'recording') {
      handsFreeRecorderRef.current.stop();
    }
    if (conversationStreamRef.current) {
      conversationStreamRef.current.getTracks().forEach(track => track.stop());
      conversationStreamRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    toast.info("Conversation mode ended");
  };

  // Toggle between Press & Hold and Hands-free modes
  const toggleHandsFreeMode = () => {
    if (!handsFreeMode) {
      // Switch to hands-free (silence detection)
      setHandsFreeMode(true);
      handsFreeModeRef.current = true;
      setHandsFreeStatus('listening');
      handsFreeStatusRef.current = 'listening';
      toast.success("Hands-free mode! Just speak, pause when done.");
      startSilenceDetection();
    } else {
      // Switch back to press & hold
      stopSilenceDetection();
      setHandsFreeMode(false);
      handsFreeModeRef.current = false;
      setHandsFreeStatus('waiting');
      handsFreeStatusRef.current = 'waiting';
      toast.success("Press & Hold mode ready!");
    }
  };

  // Start silence detection using Web Audio API
  const startSilenceDetection = async () => {
    if (!conversationStreamRef.current) return;

    try {
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(conversationStreamRef.current);
      source.connect(analyser);
      
      // Start the media recorder (always recording)
      const mediaRecorder = new MediaRecorder(conversationStreamRef.current, { mimeType: 'audio/webm' });
      handsFreeRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (recordingChunksRef.current.length > 0 && handsFreeStatusRef.current === 'processing') {
          await processRecordedAudio();
        }
      };
      
      // Start recording in chunks
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start monitoring audio levels
      monitorAudioLevel();
      
    } catch (err) {
      console.error("Failed to start silence detection:", err);
      toast.error("Could not start audio monitoring");
    }
  };

  // Stop silence detection
  const stopSilenceDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (handsFreeRecorderRef.current && handsFreeRecorderRef.current.state === 'recording') {
      handsFreeRecorderRef.current.stop();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    isSpeakingRef.current = false;
    silenceStartRef.current = null;
    setAudioLevel(0);
  };

  // Monitor audio levels for speech detection
  const monitorAudioLevel = () => {
    if (!analyserRef.current || !handsFreeModeRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkLevel = () => {
      if (!handsFreeModeRef.current || !conversationModeRef.current) return;
      if (handsFreeStatusRef.current === 'processing') {
        animationFrameRef.current = requestAnimationFrame(checkLevel);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = Math.min(100, average * 1.5);
      setAudioLevel(normalizedLevel);
      
      const SPEECH_THRESHOLD = sensitivityRef.current; // Use user setting
      const SILENCE_DURATION = silenceDurationRef.current * 1000; // Use user setting
      
      if (average > SPEECH_THRESHOLD) {
        // Speech detected
        if (!isSpeakingRef.current) {
          console.log("Speech started, level:", average);
          isSpeakingRef.current = true;
          peakAudioLevelRef.current = average; // Reset peak
          setHandsFreeStatus('recording');
          handsFreeStatusRef.current = 'recording';
        }
        // Track peak audio level
        if (average > peakAudioLevelRef.current) {
          peakAudioLevelRef.current = average;
        }
        silenceStartRef.current = null; // Reset silence timer
      } else {
        // Silence detected
        if (isSpeakingRef.current) {
          // Was speaking, now silent
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
            console.log("Silence started");
          } else {
            const silenceDuration = Date.now() - silenceStartRef.current;
            if (silenceDuration >= SILENCE_DURATION) {
              console.log("Silence threshold reached, processing...");
              isSpeakingRef.current = false;
              silenceStartRef.current = null;
              setHandsFreeStatus('processing');
              handsFreeStatusRef.current = 'processing';
              
              // Stop recorder to trigger processing
              if (handsFreeRecorderRef.current && handsFreeRecorderRef.current.state === 'recording') {
                handsFreeRecorderRef.current.stop();
              }
              return; // Exit the loop, will restart after processing
            }
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  };

  // Process the recorded audio
  const processRecordedAudio = async () => {
    console.log("Processing recorded audio, chunks:", recordingChunksRef.current.length);
    console.log("Peak audio level during recording:", peakAudioLevelRef.current);
    
    if (recordingChunksRef.current.length === 0) {
      restartListening();
      return;
    }
    
    const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
    console.log("Audio blob size:", audioBlob.size);
    
    // Skip if too small (likely just noise)
    if (audioBlob.size < 5000) {
      console.log("Audio too small, skipping");
      restartListening();
      return;
    }
    
    // Skip if peak audio level was too low (likely background noise, not real speech)
    const minPeakLevel = sensitivityRef.current * 1.5; // Must be significantly above threshold
    if (peakAudioLevelRef.current < minPeakLevel) {
      console.log(`Peak audio level ${peakAudioLevelRef.current} below min ${minPeakLevel} - skipping`);
      restartListening();
      return;
    }
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'conversation.webm');
    
    try {
      toast.info("Translating...");
      const response = await axios.post(`${API}/conversation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("Translation response:", response.data);
      
      if (!response.data.skipped && response.data.original_text) {
        const entry = {
          id: Date.now(),
          detected: response.data.detected_language === 'es' ? 'Spanish' : 'English',
          original: response.data.original_text,
          translated: response.data.translated_text,
          targetLang: response.data.target_language === 'es' ? 'Spanish' : 'English'
        };
        setConversationHistory(prev => [...prev, entry]);
        
        // Play the translation
        if (response.data.audio) {
          const audioData = response.data.audio;
          const audioBlobPlay = new Blob(
            [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))],
            { type: 'audio/mp3' }
          );
          const audioUrl = URL.createObjectURL(audioBlobPlay);
          const audio = new Audio(audioUrl);
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            restartListening();
          };
          audio.onerror = () => {
            restartListening();
          };
          await audio.play();
          return;
        }
      } else {
        console.log("No translation (skipped or empty)");
      }
      
      restartListening();
      
    } catch (err) {
      console.error("Translation error:", err);
      toast.error("Translation failed");
      restartListening();
    }
  };

  // Restart listening after processing
  const restartListening = () => {
    if (!handsFreeModeRef.current || !conversationModeRef.current) return;
    
    recordingChunksRef.current = [];
    peakAudioLevelRef.current = 0; // Reset peak level
    setHandsFreeStatus('listening');
    handsFreeStatusRef.current = 'listening';
    
    // Restart the media recorder
    if (conversationStreamRef.current) {
      try {
        const mediaRecorder = new MediaRecorder(conversationStreamRef.current, { mimeType: 'audio/webm' });
        handsFreeRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordingChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          if (recordingChunksRef.current.length > 0 && handsFreeStatusRef.current === 'processing') {
            await processRecordedAudio();
          }
        };
        
        mediaRecorder.start(100);
        
        // Restart audio monitoring
        monitorAudioLevel();
        
        toast.success("Ready! Speak when ready.");
      } catch (err) {
        console.error("Failed to restart recorder:", err);
      }
    }
  };

  const startListening = (stream) => {
    if (!stream || !conversationModeRef.current) return;
    if (isProcessing) return;
    
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    conversationRecorderRef.current = mediaRecorder;
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      if (!conversationModeRef.current) return;
      
      if (chunks.length === 0) {
        setIsListening(false);
        return;
      }

      setIsProcessing(true);
      setIsListening(false);
      
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'conversation.webm');

      try {
        const response = await axios.post(`${API}/conversation`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (!response.data.skipped && response.data.original_text) {
          const entry = {
            id: Date.now(),
            detected: response.data.detected_language === 'es' ? 'Spanish' : 'English',
            original: response.data.original_text,
            translated: response.data.translated_text,
            targetLang: response.data.target_language === 'es' ? 'Spanish' : 'English'
          };
          setConversationHistory(prev => [...prev, entry]);
          
          if (response.data.audio) {
            const audioData = response.data.audio;
            const audioBlobPlay = new Blob(
              [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))],
              { type: 'audio/mp3' }
            );
            const audioUrl = URL.createObjectURL(audioBlobPlay);
            const audio = new Audio(audioUrl);
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              setIsProcessing(false);
            };
            audio.onerror = () => {
              setIsProcessing(false);
            };
            await audio.play();
          } else {
            setIsProcessing(false);
          }
        } else {
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Conversation error:", err);
        toast.error("Translation failed");
        setIsProcessing(false);
      }
    };

    mediaRecorder.start();
    setIsListening(true);
  };

  const handleConversationMouseDown = () => {
    if (!conversationModeRef.current || !conversationStreamRef.current || isProcessing || handsFreeMode) return;
    startListening(conversationStreamRef.current);
  };

  const handleConversationMouseUp = () => {
    if (conversationRecorderRef.current && conversationRecorderRef.current.state === 'recording') {
      conversationRecorderRef.current.stop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationStreamRef.current) {
        conversationStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // Text-to-speech
  const playAudio = async (text, lang, setPlaying) => {
    if (!text.trim()) {
      toast.error("No text to speak");
      return;
    }

    setPlaying(true);

    // Use browser speech synthesis when offline or in offline mode
    if (!isOnline || offlineMode) {
      try {
        await offlineSpeechSynthesis.speak(text, lang);
        setPlaying(false);
      } catch (err) {
        console.error("Offline TTS error:", err);
        setPlaying(false);
        toast.error("Speech not available offline");
      }
      return;
    }

    try {
      const response = await axios.post(`${API}/text-to-speech`, {
        text: text,
        lang: lang
      });

      const audioData = response.data.audio;
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setPlaying(false);
        // Fallback to browser TTS
        offlineSpeechSynthesis.speak(text, lang).catch(() => {});
        toast.error("Audio playback failed, using device voice");
      };
      await audioRef.current.play();
    } catch (err) {
      console.error("TTS error:", err);
      // Fallback to browser speech synthesis
      try {
        await offlineSpeechSynthesis.speak(text, lang);
        setPlaying(false);
      } catch (fallbackErr) {
        setPlaying(false);
        toast.error("Text-to-speech failed");
      }
    }
  };

  const handlePlaySource = () => {
    if (!isPlayingSource) {
      playAudio(sourceText, sourceLang, setIsPlayingSource);
    } else {
      audioRef.current.pause();
      setIsPlayingSource(false);
    }
  };

  const handlePlayTarget = () => {
    if (!isPlayingTarget) {
      playAudio(translatedText, targetLang, setIsPlayingTarget);
    } else {
      audioRef.current.pause();
      setIsPlayingTarget(false);
    }
  };

  return (
    <div className="translator-container">
      <Toaster position="top-center" richColors />
      
      {/* Conversation Mode Overlay */}
      {conversationMode && (
        <div className="conversation-overlay">
          <div className="conversation-modal">
            <div className="conversation-header">
              <h2 className="font-heading text-xl font-black uppercase tracking-tight">
                Conversation Mode
              </h2>
              <div className="flex items-center gap-2">
                <button
                  data-testid="toggle-mode-btn"
                  className={`swiss-btn px-3 py-1 border border-black text-xs font-mono uppercase ${handsFreeMode ? 'bg-black text-white' : ''}`}
                  onClick={toggleHandsFreeMode}
                >
                  {handsFreeMode ? 'Hands-Free' : 'Press & Hold'}
                </button>
                <button
                  data-testid="close-conversation-btn"
                  className="swiss-btn p-2 border border-black"
                  onClick={stopConversationMode}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>
            
            <div className="conversation-status">
              {!handsFreeMode ? (
                /* Press & Hold Mode */
                <>
                  <button
                    data-testid="hold-to-talk-btn"
                    className={`hold-to-talk-btn ${isListening ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                    onMouseDown={handleConversationMouseDown}
                    onMouseUp={handleConversationMouseUp}
                    onMouseLeave={handleConversationMouseUp}
                    onTouchStart={handleConversationMouseDown}
                    onTouchEnd={handleConversationMouseUp}
                    disabled={isProcessing}
                  >
                    <Microphone size={40} weight={isListening ? "fill" : "bold"} />
                  </button>
                  <p className="text-sm font-mono uppercase tracking-wider mt-4">
                    {isListening ? 'Listening... Release to translate' : isProcessing ? 'Translating...' : 'Hold to Talk'}
                  </p>
                </>
              ) : (
                /* Hands-Free Mode - Silence Detection */
                <>
                  <div className={`handsfree-indicator ${handsFreeStatus}`}>
                    <Microphone size={40} weight={handsFreeStatus === 'recording' ? "fill" : "bold"} />
                    {/* Audio level indicator ring */}
                    <div className="audio-level-ring" style={{ 
                      transform: `scale(${1 + (audioLevel / 100) * 0.5})`,
                      opacity: audioLevel > 10 ? 0.6 : 0.2
                    }} />
                  </div>
                  <p className={`text-sm font-mono uppercase tracking-wider mt-4 ${handsFreeStatus === 'recording' ? 'text-red-600 font-bold' : ''}`}>
                    {handsFreeStatus === 'listening' && 'Listening... Speak when ready'}
                    {handsFreeStatus === 'recording' && `● RECORDING - Pause ${silenceDuration}s to translate`}
                    {handsFreeStatus === 'processing' && 'Translating...'}
                  </p>
                  
                  {/* Silence duration setting */}
                  <div className="silence-setting">
                    <label className="text-xs font-mono uppercase tracking-wider text-gray-600">
                      Pause Duration: {silenceDuration}s
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={silenceDuration}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSilenceDuration(val);
                        silenceDurationRef.current = val;
                      }}
                      className="silence-slider"
                      data-testid="silence-duration-slider"
                    />
                    <div className="silence-labels">
                      <span>1s</span>
                      <span>3s</span>
                      <span>5s</span>
                    </div>
                  </div>
                  
                  {/* Sensitivity setting */}
                  <div className="silence-setting">
                    <label className="text-xs font-mono uppercase tracking-wider text-gray-600">
                      Noise Filter: {sensitivity < 20 ? 'Low' : sensitivity < 35 ? 'Medium' : sensitivity < 50 ? 'High' : 'Max'}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={sensitivity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSensitivity(val);
                        sensitivityRef.current = val;
                      }}
                      className="silence-slider"
                      data-testid="sensitivity-slider"
                    />
                    <div className="silence-labels">
                      <span>Quiet</span>
                      <span>Normal</span>
                      <span>Noisy</span>
                    </div>
                  </div>
                  
                  {/* Audio level bar */}
                  <div className="audio-level-bar-container">
                    <div 
                      className="audio-level-bar" 
                      style={{ width: `${Math.min(100, audioLevel)}%` }}
                    />
                  </div>
                </>
              )}
              <p className="text-xs font-mono text-gray-400 mt-3">
                Speak in English or Spanish
              </p>
            </div>
            
            <div className="conversation-history">
              {conversationHistory.length === 0 ? (
                <p className="text-center text-gray-400 font-mono text-sm py-8">
                  {handsFreeMode 
                    ? 'Speak naturally, pause when done' 
                    : 'Hold the button and speak to see translations'}
                </p>
              ) : (
                conversationHistory.map((entry) => (
                  <div key={entry.id} className="conversation-entry">
                    <div className="entry-original">
                      <span className="lang-badge">{entry.detected}</span>
                      <p>{entry.original}</p>
                    </div>
                    <div className="entry-translated">
                      <span className="lang-badge">{entry.targetLang}</span>
                      <p>{entry.translated}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Phrasebook Modal */}
      {showPhrasebook && (
        <div className="conversation-overlay">
          <div className="conversation-modal phrasebook-modal">
            <div className="conversation-header">
              <h2 className="font-heading text-xl font-black uppercase tracking-tight">
                <Book size={24} weight="bold" className="inline mr-2" />
                Phrasebook
              </h2>
              <button
                className="swiss-btn p-2 border border-black"
                onClick={() => { setShowPhrasebook(false); setPhrasebookCategory(null); }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <div className="phrasebook-content">
              {!phrasebookCategory ? (
                // Category list
                <div className="phrasebook-categories">
                  {offlineTranslator.getCategories().map(cat => (
                    <button
                      key={cat.key}
                      className="phrasebook-category-btn"
                      onClick={() => setPhrasebookCategory(cat.key)}
                    >
                      <span>{cat.name[sourceLang]}</span>
                      <span className="text-gray-400">→</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Phrases in category
                <div className="phrasebook-phrases">
                  <button
                    className="phrasebook-back-btn"
                    onClick={() => setPhrasebookCategory(null)}
                  >
                    ← Back to categories
                  </button>
                  {offlineTranslator.getCategory(phrasebookCategory)?.phrases.map((phrase, idx) => (
                    <div 
                      key={idx} 
                      className="phrasebook-phrase"
                      onClick={() => {
                        setSourceText(phrase[sourceLang]);
                        setTranslatedText(phrase[targetLang]);
                        setShowPhrasebook(false);
                        setPhrasebookCategory(null);
                      }}
                    >
                      <div className="phrase-source">{phrase[sourceLang]}</div>
                      <div className="phrase-target">{phrase[targetLang]}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="translator-header">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-tight">
            Translator
          </h1>
          {/* Connection status */}
          <div className={`connection-badge ${isOnline ? 'online' : 'offline'} ${offlineMode ? 'offline-mode' : ''}`}>
            {offlineMode ? (
              <><WifiSlash size={14} /> <span className="hidden sm:inline">Offline</span></>
            ) : isOnline ? (
              <><WifiHigh size={14} /> <span className="hidden sm:inline">Online</span></>
            ) : (
              <><WifiSlash size={14} /> <span className="hidden sm:inline">No Connection</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Premium toggle */}
          <button
            data-testid="premium-btn"
            className={`swiss-btn flex items-center gap-1 px-2 py-2 border text-sm font-mono ${isPremium ? 'bg-yellow-400 border-yellow-500 text-black' : 'border-black'}`}
            onClick={togglePremium}
            title={isPremium ? "Premium Active" : "Upgrade to Premium"}
          >
            <Crown size={16} weight={isPremium ? "fill" : "bold"} />
          </button>
          
          {/* Offline mode toggle (premium only) */}
          {isPremium && (
            <button
              data-testid="offline-mode-btn"
              className={`swiss-btn flex items-center gap-1 px-2 py-2 border text-sm font-mono ${offlineMode ? 'bg-black text-white' : 'border-black'}`}
              onClick={toggleOfflineMode}
              title="Toggle Offline Mode"
            >
              <WifiSlash size={16} weight="bold" />
            </button>
          )}
          
          {/* Phrasebook button */}
          <button
            data-testid="phrasebook-btn"
            className="swiss-btn flex items-center gap-1 px-2 py-2 border border-black text-sm font-mono"
            onClick={() => setShowPhrasebook(true)}
            title="Phrasebook"
          >
            <Book size={16} weight="bold" />
          </button>
          
          <a
            href="/guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="swiss-btn flex items-center gap-1 px-2 py-2 border border-black text-sm font-mono"
            data-testid="help-link"
            title="User Guide"
          >
            <Question size={18} weight="bold" />
          </a>
          <button
            data-testid="conversation-mode-btn"
            className={`swiss-btn flex items-center gap-2 px-3 py-2 border border-black text-sm font-mono uppercase tracking-wider ${conversationMode ? 'bg-black text-white' : ''}`}
            onClick={conversationMode ? stopConversationMode : startConversationMode}
          >
            <Chats size={18} weight="bold" />
            <span className="hidden sm:inline">Conversation</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={`status-dot ${error ? 'error' : isTranslating ? 'loading' : ''}`} />
            <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">
              {error ? 'Error' : isTranslating ? 'Translating' : offlineMode ? 'Offline' : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Translation Area */}
      <main className="translator-main">
        {/* Source Pane */}
        <div className="translator-pane">
          <div className="pane-header">
            <span 
              data-testid="source-language-label"
              className="lang-label"
            >
              {sourceLangName}
            </span>
          </div>
          
          <div className="pane-content">
            <textarea
              data-testid="source-input"
              className="translator-textarea"
              placeholder={`Type ${sourceLangName} text here...`}
              value={sourceText}
              onChange={handleSourceChange}
            />
          </div>
          
          <div className="pane-toolbar">
            <button
              data-testid="mic-button"
              className={`toolbar-btn swiss-btn ${isRecording ? 'recording-active' : ''}`}
              onClick={handleMicClick}
              style={isRecording ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
            >
              {isRecording ? <Stop size={20} weight="fill" /> : <Microphone size={20} weight="bold" />}
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                {isRecording ? 'Stop' : 'Voice'}
              </span>
            </button>
            <button
              data-testid="speaker-source-button"
              className={`toolbar-btn swiss-btn ${isPlayingSource ? 'playing-active' : ''}`}
              onClick={handlePlaySource}
            >
              <SpeakerHigh size={20} weight={isPlayingSource ? "fill" : "bold"} />
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                {isPlayingSource ? 'Playing' : 'Listen'}
              </span>
            </button>
          </div>
        </div>

        {/* Swap Button - Mobile */}
        <div className="swap-button-container md:hidden">
          <button
            data-testid="swap-languages-button"
            className="swap-button"
            onClick={handleSwap}
            aria-label="Swap languages"
          >
            <ArrowsLeftRight size={24} weight="bold" style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>

        {/* Swap Button - Desktop */}
        <div className="swap-button-container hidden md:block">
          <button
            data-testid="swap-languages-button-desktop"
            className="swap-button"
            onClick={handleSwap}
            aria-label="Swap languages"
          >
            <ArrowsLeftRight size={24} weight="bold" />
          </button>
        </div>

        {/* Target Pane */}
        <div className="translator-pane">
          <div className="pane-header">
            <span 
              data-testid="target-language-label"
              className="lang-label"
            >
              {targetLangName}
            </span>
            {/* Offline translation indicator */}
            {offlineTranslation && !offlineTranslation.notFound && (
              <span className="offline-badge">
                <WifiSlash size={12} />
                {offlineTranslation.confidence === 'exact' ? 'Exact match' : 'Similar phrase'}
              </span>
            )}
          </div>
          
          <div className="pane-content">
            <div 
              data-testid="target-output"
              className={`output-text ${!translatedText ? 'output-placeholder' : ''} ${offlineTranslation?.notFound ? 'text-red-500' : ''}`}
            >
              {translatedText || `${targetLangName} translation will appear here...`}
            </div>
            {offlineTranslation?.notFound && (
              <p className="text-xs text-gray-500 mt-2">
                Try a common phrase or <button className="underline" onClick={() => setShowPhrasebook(true)}>browse the phrasebook</button>
              </p>
            )}
          </div>
          
          <div className="pane-toolbar">
            <button
              data-testid="speaker-target-button"
              className={`toolbar-btn swiss-btn ${isPlayingTarget ? 'playing-active' : ''}`}
              onClick={handlePlayTarget}
            >
              <SpeakerHigh size={20} weight={isPlayingTarget ? "fill" : "bold"} />
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                {isPlayingTarget ? 'Playing' : 'Listen'}
              </span>
            </button>
            <button
              data-testid="copy-button"
              className="toolbar-btn swiss-btn"
              onClick={handleCopy}
              disabled={!translatedText}
            >
              {copied ? <Check size={20} weight="bold" /> : <Copy size={20} weight="bold" />}
              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
          </div>
        </div>
      </main>
      
      {/* Free tier ad banner */}
      {!isPremium && (
        <div className="ad-banner" data-testid="ad-banner">
          <div className="ad-content">
            <span className="ad-text">Free Version</span>
            <button 
              className="upgrade-btn"
              onClick={togglePremium}
            >
              <Crown size={14} weight="fill" />
              Upgrade for Offline Mode & No Ads
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
