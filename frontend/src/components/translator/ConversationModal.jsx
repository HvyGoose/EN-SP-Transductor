import { ConversationControls } from '@/components/translator/ConversationControls';
import { ConversationHeader } from '@/components/translator/ConversationHeader';
import { ConversationHistoryList } from '@/components/translator/ConversationHistoryList';

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
        <ConversationHeader handsFreeMode={handsFreeMode} onClose={onClose} onToggleHandsFree={onToggleHandsFree} />

        <div className="conversation-status">
          <ConversationControls
            audioLevel={audioLevel}
            handsFreeMode={handsFreeMode}
            handsFreeStatus={handsFreeStatus}
            holdButtonDisabled={holdButtonDisabled}
            isListening={isListening}
            isProcessing={isProcessing}
            onConversationMouseDown={onConversationMouseDown}
            onConversationMouseUp={onConversationMouseUp}
            onSensitivityChange={onSensitivityChange}
            onSilenceDurationChange={onSilenceDurationChange}
            sensitivity={sensitivity}
            silenceDuration={silenceDuration}
          />

          <p className="text-xs font-mono text-gray-400 mt-3">Speak in English or Spanish</p>
        </div>

        <ConversationHistoryList conversationHistory={conversationHistory} handsFreeMode={handsFreeMode} />
      </div>
    </div>
  );
};