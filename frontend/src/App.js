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
  X
} from "@phosphor-icons/react";

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
  
  // Conversation mode state
  const [conversationMode, setConversationMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [handsFreeStatus, setHandsFreeStatus] = useState('waiting'); // 'waiting', 'recording', 'processing'
  const conversationRecorderRef = useRef(null);
  const conversationStreamRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const conversationModeRef = useRef(false);
  const handsFreeModeRef = useRef(false);
  const handsFreeStatusRef = useRef('waiting'); // Ref to track status in callbacks
  const handsFreeChunksRef = useRef([]);
  const handsFreeRecorderRef = useRef(null);
  const handsFreeListeningRef = useRef(false);
  
  // Refs
  const debounceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());

  const targetLang = sourceLang === "en" ? "es" : "en";
  const sourceLangName = sourceLang === "en" ? "English" : "Spanish";
  const targetLangName = targetLang === "en" ? "English" : "Spanish";

  // Translation function
  const translateText = useCallback(async (text) => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await axios.post(`${API}/translate`, {
        text: text,
        source_lang: sourceLang,
        target_lang: targetLang
      });
      setTranslatedText(response.data.translated_text);
    } catch (err) {
      console.error("Translation error:", err);
      setError("Translation failed. Please try again.");
      toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLang, targetLang]);

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
      // Switch to hands-free
      setHandsFreeMode(true);
      handsFreeModeRef.current = true;
      setHandsFreeStatus('waiting');
      handsFreeStatusRef.current = 'waiting';
      handsFreeChunksRef.current = [];
      toast.success("Hands-free mode! Say 'Translator listen' to start.");
      // Start listening after a brief delay
      setTimeout(() => {
        if (handsFreeModeRef.current && conversationStreamRef.current) {
          startHandsFreeListening();
        }
      }, 300);
    } else {
      // Switch back to press & hold
      setHandsFreeMode(false);
      handsFreeModeRef.current = false;
      setHandsFreeStatus('waiting');
      handsFreeStatusRef.current = 'waiting';
      handsFreeListeningRef.current = false;
      if (handsFreeRecorderRef.current && handsFreeRecorderRef.current.state === 'recording') {
        handsFreeRecorderRef.current.stop();
      }
      toast.success("Press & Hold mode ready!");
    }
  };

  // Hands-free continuous listening
  const startHandsFreeListening = () => {
    if (!conversationStreamRef.current || !handsFreeModeRef.current || !conversationModeRef.current) {
      console.log("Cannot start hands-free: missing stream or mode disabled");
      return;
    }
    
    if (handsFreeListeningRef.current) {
      console.log("Already listening, skipping");
      return;
    }
    
    console.log("Starting hands-free listening, status:", handsFreeStatusRef.current);
    handsFreeListeningRef.current = true;
    
    try {
      const mediaRecorder = new MediaRecorder(conversationStreamRef.current, { mimeType: 'audio/webm' });
      handsFreeRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          // Accumulate if we're in recording mode
          if (handsFreeStatusRef.current === 'recording') {
            handsFreeChunksRef.current.push(event.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        handsFreeListeningRef.current = false;
        
        if (!handsFreeModeRef.current || !conversationModeRef.current) {
          console.log("Mode disabled, stopping");
          return;
        }
        
        if (chunks.length === 0) {
          console.log("No chunks, restarting listener");
          setTimeout(() => startHandsFreeListening(), 200);
          return;
        }

        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log("Processing audio blob, size:", audioBlob.size);
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'handsfree.webm');

        try {
          const response = await axios.post(`${API}/handsfree-check`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          const { trigger, text } = response.data;
          console.log("Trigger check result:", trigger, "Text:", text);
          
          if (trigger === 'start' && handsFreeStatusRef.current !== 'recording') {
            console.log("START trigger detected!");
            setHandsFreeStatus('recording');
            handsFreeStatusRef.current = 'recording';
            handsFreeChunksRef.current = [...chunks];
            toast.info("Listening... Say 'Translator stop' when done.");
          } else if (trigger === 'stop' && handsFreeStatusRef.current === 'recording') {
            console.log("STOP trigger detected!");
            handsFreeChunksRef.current.push(...chunks);
            setHandsFreeStatus('processing');
            handsFreeStatusRef.current = 'processing';
            
            // Process all accumulated audio
            const fullAudioBlob = new Blob(handsFreeChunksRef.current, { type: 'audio/webm' });
            const processFormData = new FormData();
            processFormData.append('audio', fullAudioBlob, 'handsfree-full.webm');
            
            try {
              const translateResponse = await axios.post(`${API}/handsfree-translate`, processFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              
              if (!translateResponse.data.skipped && translateResponse.data.original_text) {
                const entry = {
                  id: Date.now(),
                  detected: translateResponse.data.detected_language === 'es' ? 'Spanish' : 'English',
                  original: translateResponse.data.original_text,
                  translated: translateResponse.data.translated_text,
                  targetLang: translateResponse.data.target_language === 'es' ? 'Spanish' : 'English'
                };
                setConversationHistory(prev => [...prev, entry]);
                
                if (translateResponse.data.audio) {
                  const audioData = translateResponse.data.audio;
                  const audioBlobPlay = new Blob(
                    [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))],
                    { type: 'audio/mp3' }
                  );
                  const audioUrl = URL.createObjectURL(audioBlobPlay);
                  const audio = new Audio(audioUrl);
                  audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    setHandsFreeStatus('waiting');
                    handsFreeStatusRef.current = 'waiting';
                    handsFreeChunksRef.current = [];
                    toast.success("Ready! Say 'Translator listen' to continue.");
                    // Restart listening
                    setTimeout(() => startHandsFreeListening(), 500);
                  };
                  audio.onerror = () => {
                    setHandsFreeStatus('waiting');
                    handsFreeStatusRef.current = 'waiting';
                    handsFreeChunksRef.current = [];
                    setTimeout(() => startHandsFreeListening(), 500);
                  };
                  await audio.play();
                  return; // Don't restart listening until audio finishes
                }
              }
              
              setHandsFreeStatus('waiting');
              handsFreeStatusRef.current = 'waiting';
              handsFreeChunksRef.current = [];
              toast.info("Ready! Say 'Translator listen' to try again.");
              setTimeout(() => startHandsFreeListening(), 500);
              
            } catch (err) {
              console.error("Handsfree translate error:", err);
              setHandsFreeStatus('waiting');
              handsFreeStatusRef.current = 'waiting';
              handsFreeChunksRef.current = [];
              toast.error("Translation failed");
              setTimeout(() => startHandsFreeListening(), 500);
            }
            return; // Don't restart immediately during processing
          }
          
          // Continue listening loop
          if (handsFreeModeRef.current && conversationModeRef.current) {
            setTimeout(() => startHandsFreeListening(), 100);
          }
        } catch (err) {
          console.error("Hands-free check error:", err);
          if (handsFreeModeRef.current && conversationModeRef.current) {
            setTimeout(() => startHandsFreeListening(), 500);
          }
        }
      };

      mediaRecorder.onerror = (err) => {
        console.error("MediaRecorder error:", err);
        handsFreeListeningRef.current = false;
        if (handsFreeModeRef.current && conversationModeRef.current) {
          setTimeout(() => startHandsFreeListening(), 500);
        }
      };

      mediaRecorder.start();
      console.log("MediaRecorder started");

      // Record 3-second chunks
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);
      
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      handsFreeListeningRef.current = false;
      if (handsFreeModeRef.current && conversationModeRef.current) {
        setTimeout(() => startHandsFreeListening(), 1000);
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
        toast.error("Audio playback failed");
      };
      await audioRef.current.play();
    } catch (err) {
      console.error("TTS error:", err);
      setPlaying(false);
      toast.error("Text-to-speech failed");
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
                /* Hands-Free Mode */
                <>
                  <div className={`handsfree-indicator ${handsFreeStatus}`}>
                    <Microphone size={40} weight={handsFreeStatus === 'recording' ? "fill" : "bold"} />
                  </div>
                  <p className={`text-sm font-mono uppercase tracking-wider mt-4 ${handsFreeStatus === 'recording' ? 'text-red-600 font-bold animate-pulse' : ''}`}>
                    {handsFreeStatus === 'waiting' && 'Say "Translator listen" to start'}
                    {handsFreeStatus === 'recording' && '● RECORDING - Say "Stop" when done'}
                    {handsFreeStatus === 'processing' && 'Translating...'}
                  </p>
                  <div className="trigger-hints">
                    <p className="text-xs font-mono text-gray-500 mt-2">
                      <strong>Start:</strong> "Translator listen" / "Traductor escucha"
                    </p>
                    <p className="text-xs font-mono text-gray-500">
                      <strong>Stop:</strong> "Stop" / "Done" / "Para"
                    </p>
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
                    ? 'Say "Translator listen" to begin' 
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
      
      {/* Header */}
      <header className="translator-header">
        <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-tight">
          Translator
        </h1>
        <div className="flex items-center gap-4">
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
              {error ? 'Error' : isTranslating ? 'Translating' : 'Ready'}
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
          </div>
          
          <div className="pane-content">
            <div 
              data-testid="target-output"
              className={`output-text ${!translatedText ? 'output-placeholder' : ''}`}
            >
              {translatedText || `${targetLangName} translation will appear here...`}
            </div>
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
    </div>
  );
}

export default App;
