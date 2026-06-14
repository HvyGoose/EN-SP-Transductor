import { Crown, SpeakerHigh } from '@phosphor-icons/react';

export const FreeTierBanner = ({ isPremium, onUpgrade }) => {
  if (isPremium) {
    return null;
  }

  return (
    <div className="ad-banner" data-testid="ad-banner">
      <div className="ad-content">
        <span className="ad-text flex items-center gap-2">
          <SpeakerHigh size={16} weight="bold" className="text-green-400" />
          <span>Free: Voice & Listen included!</span>
        </span>
        <button
          data-testid="upgrade-banner-btn"
          className="upgrade-btn"
          onClick={onUpgrade}
        >
          <Crown size={14} weight="fill" />
          Upgrade for Conversation Mode
        </button>
      </div>
    </div>
  );
};