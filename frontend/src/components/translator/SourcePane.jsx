import { ArrowsLeftRight, Microphone, SpeakerHigh, Stop } from '@phosphor-icons/react';

export const SourcePane = ({
  isPlayingSource,
  isPremium,
  isRecording,
  onMicClick,
  onPlaySource,
  onSourceChange,
  onSwap,
  sourceLangName,
  sourceText
}) => (
  <>
    <div className="translator-pane">
      <div className="pane-header">
        <span data-testid="source-language-label" className="lang-label">{sourceLangName}</span>
      </div>

      <div className="pane-content">
        <textarea
          data-testid="source-input"
          className="translator-textarea"
          placeholder={`Type ${sourceLangName} text here...`}
          value={sourceText}
          onChange={onSourceChange}
        />
      </div>

      <div className="pane-toolbar">
        <button
          data-testid="mic-button"
          className={`toolbar-btn swiss-btn ${isRecording ? 'recording-active' : ''} ${!isPremium ? 'free-highlight' : ''}`}
          onClick={onMicClick}
          style={isRecording ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
          title="Voice input - Free feature!"
        >
          {isRecording ? <Stop size={20} weight="fill" /> : <Microphone size={20} weight="bold" />}
          <span className="text-xs uppercase tracking-wider hidden sm:inline">{isRecording ? 'Stop' : 'Voice'}</span>
        </button>

        <button
          data-testid="speaker-source-button"
          className={`toolbar-btn swiss-btn ${isPlayingSource ? 'playing-active' : ''} ${!isPremium ? 'free-highlight' : ''}`}
          onClick={onPlaySource}
          title="Listen to pronunciation - Free feature!"
        >
          <SpeakerHigh size={20} weight={isPlayingSource ? 'fill' : 'bold'} />
          <span className="text-xs uppercase tracking-wider hidden sm:inline">{isPlayingSource ? 'Playing' : 'Listen'}</span>
        </button>
      </div>
    </div>

    <div className="swap-button-container md:hidden">
      <button
        data-testid="swap-languages-button"
        className="swap-button"
        onClick={onSwap}
        aria-label="Swap languages"
      >
        <ArrowsLeftRight size={24} weight="bold" style={{ transform: 'rotate(90deg)' }} />
      </button>
    </div>

    <div className="swap-button-container hidden md:block">
      <button
        data-testid="swap-languages-button-desktop"
        className="swap-button"
        onClick={onSwap}
        aria-label="Swap languages"
      >
        <ArrowsLeftRight size={24} weight="bold" />
      </button>
    </div>
  </>
);