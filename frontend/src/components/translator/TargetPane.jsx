import { Check, Copy, SpeakerHigh, WifiSlash } from '@phosphor-icons/react';

export const TargetPane = ({
  copied,
  isPlayingTarget,
  isPremium,
  offlineTranslation,
  onCopy,
  onOpenPhrasebook,
  onPlayTarget,
  targetLangName,
  translatedText
}) => (
  <div className="translator-pane">
    <div className="pane-header">
      <span data-testid="target-language-label" className="lang-label">{targetLangName}</span>
      {offlineTranslation && !offlineTranslation.notFound && (
        <span className="offline-badge" data-testid="offline-translation-badge">
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
        <p className="text-xs text-gray-500 mt-2" data-testid="offline-phrasebook-hint">
          Try a common phrase or <button className="underline" onClick={onOpenPhrasebook}>browse the phrasebook</button>
        </p>
      )}
    </div>

    <div className="pane-toolbar">
      <button
        data-testid="speaker-target-button"
        className={`toolbar-btn swiss-btn ${isPlayingTarget ? 'playing-active' : ''} ${!isPremium ? 'free-highlight' : ''}`}
        onClick={onPlayTarget}
        title="Listen to translation - Free feature!"
      >
        <SpeakerHigh size={20} weight={isPlayingTarget ? 'fill' : 'bold'} />
        <span className="text-xs uppercase tracking-wider hidden sm:inline">{isPlayingTarget ? 'Playing' : 'Listen'}</span>
      </button>

      <button
        data-testid="copy-button"
        className="toolbar-btn swiss-btn"
        onClick={onCopy}
        disabled={!translatedText}
      >
        {copied ? <Check size={20} weight="bold" /> : <Copy size={20} weight="bold" />}
        <span className="text-xs uppercase tracking-wider hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  </div>
);