import { Toaster } from 'sonner';
import '@/App.css';
import { ConversationModal } from '@/components/translator/ConversationModal';
import { AppFooter } from '@/components/translator/AppFooter';
import { FreeTierBanner } from '@/components/translator/FreeTierBanner';
import { PaymentModal } from '@/components/translator/PaymentModal';
import { PhrasebookModal } from '@/components/translator/PhrasebookModal';
import { SourcePane } from '@/components/translator/SourcePane';
import { TargetPane } from '@/components/translator/TargetPane';
import { TranslatorHeader } from '@/components/translator/TranslatorHeader';
import { useAudioPlaybackManager } from '@/hooks/useAudioPlaybackManager';
import { useConversationManager } from '@/hooks/useConversationManager';
import { usePaymentManager } from '@/hooks/usePaymentManager';
import { useTranslatorEffects } from '@/hooks/useTranslatorEffects';
import { useTranslatorState } from '@/hooks/useTranslatorState';
import { useTranslationActions } from '@/hooks/useTranslationActions';
import { useVoiceInputManager } from '@/hooks/useVoiceInputManager';
import {
  getConversationButtonClass,
  getLanguageName,
  getStatusDotClass,
  getStatusText,
  getTargetLanguage
} from '@/utils/translatorHelpers';

export default function App() {
  const { refs, setters, state } = useTranslatorState();
  const translationActions = useTranslationActions({ refs, setters, state });
  const paymentManager = usePaymentManager({ setters, state });
  const voiceInputManager = useVoiceInputManager({
    refs,
    setters,
    state,
    translateText: translationActions.translateText
  });
  const audioPlaybackManager = useAudioPlaybackManager({ refs, setters, state });
  const conversationManager = useConversationManager({ refs, setters, state });

  useTranslatorEffects({
    refs,
    setters,
    state,
    translateText: translationActions.translateText
  });

  const targetLang = getTargetLanguage(state.sourceLang);
  const sourceLangName = getLanguageName(state.sourceLang);
  const targetLangName = getLanguageName(targetLang);
  const statusText = getStatusText({
    error: state.error,
    isTranslating: state.isTranslating,
    offlineMode: state.offlineMode
  });
  const statusDotClass = getStatusDotClass({
    error: state.error,
    isTranslating: state.isTranslating
  });
  const conversationButtonClass = getConversationButtonClass({
    conversationMode: state.conversationMode,
    isPremium: state.isPremium
  });

  const handleToggleOfflineMode = () => {
    if (!state.isPremium) {
      return;
    }

    setters.setOfflineMode(!state.offlineMode);
  };

  const handlePhrasebookClose = () => {
    setters.setShowPhrasebook(false);
    setters.setPhrasebookCategory(null);
  };

  const handlePhrasePick = (phrase) => {
    setters.setSourceText(phrase[state.sourceLang]);
    setters.setTranslatedText(phrase[targetLang]);
    setters.setShowPhrasebook(false);
    setters.setPhrasebookCategory(null);
  };

  const openPhrasebook = () => {
    setters.setShowPhrasebook(true);
  };

  return (
    <div className="translator-container" data-testid="translator-app">
      <Toaster position="top-center" richColors />

      <ConversationModal
        audioLevel={state.audioLevel}
        conversationHistory={state.conversationHistory}
        handsFreeMode={state.handsFreeMode}
        handsFreeStatus={state.handsFreeStatus}
        holdButtonDisabled={state.isProcessing}
        isListening={state.isListening}
        isProcessing={state.isProcessing}
        onClose={conversationManager.stopConversationMode}
        onConversationMouseDown={conversationManager.handleConversationMouseDown}
        onConversationMouseUp={conversationManager.handleConversationMouseUp}
        onSensitivityChange={conversationManager.updateSensitivity}
        onSilenceDurationChange={conversationManager.updateSilenceDuration}
        onToggleHandsFree={conversationManager.toggleHandsFreeMode}
        sensitivity={state.sensitivity}
        show={state.conversationMode}
        silenceDuration={state.silenceDuration}
      />

      <PhrasebookModal
        onClose={handlePhrasebookClose}
        onPickPhrase={handlePhrasePick}
        phrasebookCategory={state.phrasebookCategory}
        setPhrasebookCategory={setters.setPhrasebookCategory}
        show={state.showPhrasebook}
        sourceLang={state.sourceLang}
      />

      <PaymentModal
        isProcessingPayment={state.isProcessingPayment}
        onCheckout={paymentManager.initiateCheckout}
        onClose={paymentManager.closePaymentModal}
        onEmailChange={setters.setPaymentEmail}
        onRestore={paymentManager.checkPremiumByEmail}
        paymentEmail={state.paymentEmail}
        show={state.showPaymentModal}
      />

      <TranslatorHeader
        conversationButtonClass={conversationButtonClass}
        conversationMode={state.conversationMode}
        isOnline={state.isOnline}
        isPremium={state.isPremium}
        offlineMode={state.offlineMode}
        onConversationClick={conversationManager.handleConversationClick}
        onOpenPhrasebook={openPhrasebook}
        onPremiumClick={paymentManager.openPaymentModal}
        onToggleOfflineMode={handleToggleOfflineMode}
        statusDotClass={statusDotClass}
        statusText={statusText}
      />

      <main className="translator-main">
        <SourcePane
          isPlayingSource={state.isPlayingSource}
          isPremium={state.isPremium}
          isRecording={state.isRecording}
          onMicClick={voiceInputManager.handleMicClick}
          onPlaySource={audioPlaybackManager.handlePlaySource}
          onSourceChange={translationActions.handleSourceChange}
          onSwap={translationActions.handleSwap}
          sourceLangName={sourceLangName}
          sourceText={state.sourceText}
        />

        <TargetPane
          copied={state.copied}
          isPlayingTarget={state.isPlayingTarget}
          isPremium={state.isPremium}
          offlineTranslation={state.offlineTranslation}
          onCopy={translationActions.handleCopy}
          onOpenPhrasebook={openPhrasebook}
          onPlayTarget={audioPlaybackManager.handlePlayTarget}
          targetLangName={targetLangName}
          translatedText={state.translatedText}
        />
      </main>

      <FreeTierBanner isPremium={state.isPremium} onUpgrade={paymentManager.openPaymentModal} />
      <AppFooter />
    </div>
  );
}