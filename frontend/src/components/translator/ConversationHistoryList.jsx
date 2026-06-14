export const ConversationHistoryList = ({ conversationHistory, handsFreeMode }) => (
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
);