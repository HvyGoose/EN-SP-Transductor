// Offline Translation Service
// Uses cached phrasebook + browser Speech APIs

class OfflineTranslator {
  constructor() {
    this.phrasebook = null;
    this.phraseIndex = { en: {}, es: {} };
    this.isLoaded = false;
  }

  async loadPhrasebook() {
    if (this.isLoaded) return true;
    
    try {
      const response = await fetch('/phrasebook.json');
      const data = await response.json();
      this.phrasebook = data;
      
      // Build search index for fuzzy matching
      Object.values(data.categories).forEach(category => {
        category.phrases.forEach(phrase => {
          const enLower = phrase.en.toLowerCase();
          const esLower = phrase.es.toLowerCase();
          this.phraseIndex.en[enLower] = phrase.es;
          this.phraseIndex.es[esLower] = phrase.en;
        });
      });
      
      this.isLoaded = true;
      console.log('Phrasebook loaded:', Object.keys(this.phraseIndex.en).length, 'phrases');
      return true;
    } catch (err) {
      console.error('Failed to load phrasebook:', err);
      return false;
    }
  }

  // Find translation from phrasebook
  translate(text, sourceLang) {
    if (!this.isLoaded) return null;
    
    const normalizedText = text.toLowerCase().trim();
    const index = sourceLang === 'en' ? this.phraseIndex.en : this.phraseIndex.es;
    
    // Exact match
    if (index[normalizedText]) {
      return {
        translation: index[normalizedText],
        confidence: 'exact',
        offline: true
      };
    }
    
    // Fuzzy match - find closest phrase
    let bestMatch = null;
    let bestScore = 0;
    
    Object.keys(index).forEach(phrase => {
      const score = this.similarity(normalizedText, phrase);
      if (score > bestScore && score > 0.7) {
        bestScore = score;
        bestMatch = { phrase, translation: index[phrase] };
      }
    });
    
    if (bestMatch) {
      return {
        translation: bestMatch.translation,
        confidence: 'fuzzy',
        matchedPhrase: bestMatch.phrase,
        score: bestScore,
        offline: true
      };
    }
    
    return null;
  }

  // Simple similarity score (Jaccard-like)
  similarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  // Get all phrases in a category
  getCategory(categoryName) {
    if (!this.isLoaded || !this.phrasebook) return null;
    return this.phrasebook.categories[categoryName];
  }

  // Get all category names
  getCategories() {
    if (!this.isLoaded || !this.phrasebook) return [];
    return Object.keys(this.phrasebook.categories).map(key => ({
      key,
      name: this.phrasebook.categories[key].name
    }));
  }

  // Search phrases
  searchPhrases(query, lang = 'en') {
    if (!this.isLoaded) return [];
    
    const normalizedQuery = query.toLowerCase();
    const results = [];
    
    Object.values(this.phrasebook.categories).forEach(category => {
      category.phrases.forEach(phrase => {
        const text = phrase[lang].toLowerCase();
        if (text.includes(normalizedQuery)) {
          results.push({
            ...phrase,
            category: category.name[lang]
          });
        }
      });
    });
    
    return results.slice(0, 20); // Limit results
  }
}

// Browser Speech Recognition (STT)
class OfflineSpeechRecognition {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.isSupported = true;
    }
  }

  async recognize(lang = 'en-US') {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      this.recognition.lang = lang === 'en' ? 'en-US' : 'es-ES';
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        resolve({ text: transcript, confidence });
      };

      this.recognition.onerror = (event) => {
        reject(new Error(event.error));
      };

      this.recognition.onend = () => {
        // Recognition ended without result
      };

      this.recognition.start();
    });
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Browser Speech Synthesis (TTS)
class OfflineSpeechSynthesis {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.isSupported = !!this.synth;
    this.loadVoices();
  }

  loadVoices() {
    if (!this.isSupported) return;
    
    // Voices may not be immediately available
    this.voices = this.synth.getVoices();
    
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }

  getVoiceForLang(lang) {
    const langCode = lang === 'en' ? 'en' : 'es';
    
    // Prefer high-quality voices
    const preferred = this.voices.find(v => 
      v.lang.startsWith(langCode) && (v.localService || v.name.includes('Google') || v.name.includes('Microsoft'))
    );
    
    if (preferred) return preferred;
    
    // Fallback to any matching voice
    return this.voices.find(v => v.lang.startsWith(langCode));
  }

  speak(text, lang = 'en') {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getVoiceForLang(lang);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = lang === 'en' ? 'en-US' : 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      this.synth.speak(utterance);
    });
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

// Export instances
export const offlineTranslator = new OfflineTranslator();
export const offlineSpeechRecognition = new OfflineSpeechRecognition();
export const offlineSpeechSynthesis = new OfflineSpeechSynthesis();

// Initialize on load
offlineTranslator.loadPhrasebook();
