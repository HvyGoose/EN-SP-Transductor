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
  Circle,
  Stop
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
      
      {/* Header */}
      <header className="translator-header">
        <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-tight">
          Translator
        </h1>
        <div className="flex items-center gap-2">
          <div className={`status-dot ${error ? 'error' : isTranslating ? 'loading' : ''}`} />
          <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">
            {error ? 'Error' : isTranslating ? 'Translating' : 'Ready'}
          </span>
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
