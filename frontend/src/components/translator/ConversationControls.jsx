import { Microphone } from '@phosphor-icons/react';
import {
  HANDSFREE_ACTIVE_AUDIO_LEVEL,
  HANDSFREE_ACTIVE_RING_OPACITY,
  HANDSFREE_IDLE_RING_OPACITY,
  HANDSFREE_RECORDING_RING_BASE_SCALE,
  HANDSFREE_RECORDING_RING_SCALE_FACTOR
} from '@/utils/translatorConstants';
import { getHoldToTalkText, getSensitivityLabel } from '@/utils/translatorHelpers';

const getHandsFreeStatusText = (handsFreeStatus, silenceDuration) => {
  if (handsFreeStatus === 'listening') return 'Listening... Speak when ready';
  if (handsFreeStatus === 'recording') return `● RECORDING - Pause ${silenceDuration}s to translate`;
  return 'Translating...';
};

const getRingStyle = (audioLevel) => ({
  transform: `scale(${HANDSFREE_RECORDING_RING_BASE_SCALE + (audioLevel / 100) * HANDSFREE_RECORDING_RING_SCALE_FACTOR})`,
  opacity: audioLevel > HANDSFREE_ACTIVE_AUDIO_LEVEL ? HANDSFREE_ACTIVE_RING_OPACITY : HANDSFREE_IDLE_RING_OPACITY
});

export const ConversationControls = ({
  audioLevel,
  handsFreeMode,
  handsFreeStatus,
  holdButtonDisabled,
  isListening,
  isProcessing,
  onConversationMouseDown,
  onConversationMouseUp,
  onSensitivityChange,
  onSilenceDurationChange,
  sensitivity,
  silenceDuration
}) => {
  if (!handsFreeMode) {
    return (
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
    );
  }

  return (
    <>
      <div className={`handsfree-indicator ${handsFreeStatus}`} data-testid="handsfree-indicator">
        <Microphone size={40} weight={handsFreeStatus === 'recording' ? 'fill' : 'bold'} />
        <div className="audio-level-ring" style={getRingStyle(audioLevel)} />
      </div>

      <p className={`text-sm font-mono uppercase tracking-wider mt-4 ${handsFreeStatus === 'recording' ? 'text-red-600 font-bold' : ''}`} data-testid="handsfree-status-text">
        {getHandsFreeStatusText(handsFreeStatus, silenceDuration)}
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
  );
};