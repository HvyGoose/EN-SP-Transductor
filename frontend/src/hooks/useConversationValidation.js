import { MIN_AUDIO_BLOB_SIZE, SENSITIVITY_MULTIPLIER } from '@/utils/translatorConstants';

export const isConversationAudioTooSmall = (audioBlob) => audioBlob.size < MIN_AUDIO_BLOB_SIZE;

export const isPeakAudioBelowThreshold = (peakAudioLevel, sensitivity) => peakAudioLevel < sensitivity * SENSITIVITY_MULTIPLIER;

export const shouldStartConversationListening = ({ conversationMode, stream, isProcessing, handsFreeMode }) => (
  conversationMode && Boolean(stream) && !isProcessing && !handsFreeMode
);

export const shouldStopForSilence = ({ silenceStart, silenceDurationMs, now }) => Boolean(silenceStart) && (now - silenceStart) >= silenceDurationMs;