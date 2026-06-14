import { Book, X } from '@phosphor-icons/react';
import { offlineTranslator } from '@/services/offlineService';

export const PhrasebookModal = ({
  onClose,
  onPickPhrase,
  phrasebookCategory,
  setPhrasebookCategory,
  show,
  sourceLang
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="conversation-overlay" data-testid="phrasebook-modal-overlay">
      <div className="conversation-modal phrasebook-modal">
        <div className="conversation-header">
          <h2 className="font-heading text-xl font-black uppercase tracking-tight">
            <Book size={24} weight="bold" className="inline mr-2" />
            Phrasebook
          </h2>
          <button className="swiss-btn p-2 border border-black" onClick={onClose} data-testid="close-phrasebook-btn">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="phrasebook-content">
          {!phrasebookCategory ? (
            <div className="phrasebook-categories" data-testid="phrasebook-category-list">
              {offlineTranslator.getCategories().map((category) => (
                <button
                  key={category.key}
                  className="phrasebook-category-btn"
                  data-testid={`phrasebook-category-${category.key}`}
                  onClick={() => setPhrasebookCategory(category.key)}
                >
                  <span>{category.name[sourceLang]}</span>
                  <span className="text-gray-400">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="phrasebook-phrases" data-testid="phrasebook-phrase-list">
              <button className="phrasebook-back-btn" onClick={() => setPhrasebookCategory(null)} data-testid="phrasebook-back-btn">
                ← Back to categories
              </button>

              {offlineTranslator.getCategory(phrasebookCategory)?.phrases.map((phrase, index) => (
                <div
                  key={`${phrase[sourceLang]}-${index}`}
                  className="phrasebook-phrase"
                  data-testid={`phrasebook-phrase-${index}`}
                  onClick={() => onPickPhrase(phrase)}
                >
                  <div className="phrase-source">{phrase[sourceLang]}</div>
                  <div className="phrase-target">{phrase[sourceLang === 'en' ? 'es' : 'en']}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};