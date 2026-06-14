import { Book, Chats, Crown, Question, WifiSlash } from '@phosphor-icons/react';
import { LegalLinkGroup } from '@/components/legal/LegalLinkGroup';
import { ConnectionBadge } from '@/components/translator/ConnectionBadge';

export const TranslatorHeader = ({
  conversationMode,
  conversationButtonClass,
  isOnline,
  isPremium,
  offlineMode,
  onConversationClick,
  onOpenPhrasebook,
  onPremiumClick,
  onToggleOfflineMode,
  statusDotClass,
  statusText
}) => (
  <header className="translator-header">
    <div className="flex items-center gap-3">
      <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-tight">
        Translator
      </h1>
      <ConnectionBadge isOnline={isOnline} offlineMode={offlineMode} />
    </div>

    <div className="flex items-center gap-2 sm:gap-4">
      <button
        data-testid="premium-btn"
        className={`swiss-btn flex items-center gap-1 px-2 py-2 border text-sm font-mono ${isPremium ? 'bg-yellow-400 border-yellow-500 text-black' : 'border-black'}`}
        onClick={onPremiumClick}
        title={isPremium ? 'Premium Active' : 'Upgrade to Premium'}
      >
        <Crown size={16} weight={isPremium ? 'fill' : 'bold'} />
      </button>

      {isPremium && (
        <button
          data-testid="offline-mode-btn"
          className={`swiss-btn flex items-center gap-1 px-2 py-2 border text-sm font-mono ${offlineMode ? 'bg-black text-white' : 'border-black'}`}
          onClick={onToggleOfflineMode}
          title="Toggle Offline Mode"
        >
          <WifiSlash size={16} weight="bold" />
        </button>
      )}

      <button
        data-testid="phrasebook-btn"
        className="swiss-btn flex items-center gap-1 px-2 py-2 border border-black text-sm font-mono"
        onClick={onOpenPhrasebook}
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
        className={conversationButtonClass}
        onClick={onConversationClick}
        title={isPremium ? 'Conversation Mode' : 'Premium Feature - Upgrade to unlock'}
      >
        <Chats size={18} weight="bold" />
        <span className="hidden sm:inline">Conversation</span>
        {!isPremium && <Crown size={12} weight="fill" className="text-yellow-500" />}
      </button>

      <div className="header-meta-group">
        <LegalLinkGroup />
        <div data-testid="translator-status" className="flex items-center gap-2">
          <div className={`status-dot ${statusDotClass}`} />
          <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  </header>
);