import { X } from '@phosphor-icons/react';

export const ConversationHeader = ({ handsFreeMode, onClose, onToggleHandsFree }) => (
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
);