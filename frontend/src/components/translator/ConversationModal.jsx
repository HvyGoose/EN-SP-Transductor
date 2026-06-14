import { Microphone, X } from '@phosphor-icons/react';
import { getHoldToTalkText, getSensitivityLabel } from '@/utils/translatorHelpers';

export const ConversationModal = ({
  audioLevel,
  conversationHistory,
  handsFreeMode,
  handsFreeStatus,
  holdButtonDisabled,
  isListening,
  isProcessing,
  onClose,
  onConversationMouseDown,
  onConversationMouseUp,
  onSensitivityChange,
  onSilenceDurationChange,
  onToggleHandsFree,
  sensitivity,
  show,
  silenceDuration
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="conversation-overlay" data-testid="conversation-overlay">
      <div className="conversation-modal">
        <div className="conversation-header">
          <h2 className="font-heading text-xl font-black uppercase tracking-tight">Conversation Mode</h2>
          <div className="flex items-center gap-2">
            <button
              data-testid="toggle-mode-btn"
              className={`swiss-btn px-3 py-1 border border-black text-xs font-mono uppercase ${handsFreeMode ? 'bg-black text-white' : ''}`}
              onClick={onToggleHandsFree}
            >
              {handsFreeMode ? 'Hands-Free' : 'Press & Hold'}
            </button>
            <button data-testid="close-conversation-btn" className="swiss-btn p-2 border border-black" onClick={onClose}>
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        <div className="conversation-status">
          {!handsFreeMode ? (
            <>
              <button
                data-testid="hold-to-talk-btn"
                className={`hold-to-talk-btn ${isListening ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                onMouseDown={onConversationMouseDown}
                onMouseUp={onConversationMouseUp}
                onMouseLeave={onConversationMouseUp}
                onTouchStart={onConversationMouseDown}
                onTouchEnd={onConversationMouseUp}
                disabled={holdButtonDisabled}
              >
                <Microphone size={40} weight={isListening ? 'fill' : 'bold'} />
              </button>
              <p className="text-sm font-mono uppercase tracking-wider mt-4">{getHoldToTalkText({ isListening, isProcessing })}</p>
            </>
          ) : (
            <>
              <div className={`handsfree-indicator ${handsFreeStatus}`} data-testid="handsfree-indicator">
                <Microphone size={40} weight={handsFreeStatus === 'recording' ? 'fill' : 'bold'} />
                <div
                  className="audio-level-ring"
                  style={{ transform: `scale(${1 + (audioLevel / 100) * 0.5})`, opacity: audioLevel > 10 ? 0.6 : 0.2 }}
                />
              </div>

              <p className={`text-sm font-mono uppercase tracking-wider mt-4 ${handsFreeStatus === 'recording' ? 'text-red-600 font-bold' : ''}`} data-testid="handsfree-status-text">
                {handsFreeStatus === 'listening' && 'Listening... Speak when ready'}
                {handsFreeStatus === 'recording' && `● RECORDING - Pause ${silenceDuration}s to translate`}
                {handsFreeStatus === 'processing' && 'Translating...'}
              </p>

              <div className="silence-setting">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-600">Pause Duration: {silenceDuration}s</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={silenceDuration}
                  onChange={(event) => onSilenceDurationChange(parseFloat(event.target.value))}
                  className="silence-slider"
                  data-testid="silence-duration-slider"
                />
                <div className="silence-labels"><span>1s</span><span>3s</span><span>5s</span></div>
              </div>

              <div className="silence-setting">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-600">Noise Filter: {getSensitivityLabel(sensitivity)}</label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={sensitivity}
                  onChange={(event) => onSensitivityChange(parseInt(event.target.value, 10))}
                  className="silence-slider"
                  data-testid="sensitivity-slider"
                />
                <div className="silence-labels"><span>Quiet</span><span>Normal</span><span>Noisy</span></div>
              </div>

              <div className="audio-level-bar-container"><div className="audio-level-bar" style={{ width: `${Math.min(100, audioLevel)}%` }} /></div>
            </>
          )}

          <p className="text-xs font-mono text-gray-400 mt-3">Speak in English or Spanish</p>
        </div>

        <div className="conversation-history" data-testid="conversation-history">
          {conversationHistory.length === 0 ? (
            <p className="text-center text-gray-400 font-mono text-sm py-8">
              {handsFreeMode ? 'Speak naturally, pause when done' : 'Hold the button and speak to see translations'}
            </p>
          ) : (
            conversationHistory.map((entry) => (
              <div key={entry.id} className="conversation-entry" data-testid="conversation-entry">
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
  );
};