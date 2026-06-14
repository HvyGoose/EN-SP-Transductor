import { RECORDER_MIME_TYPES } from '@/utils/translatorConstants';

export const getSupportedRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

export const createRecorder = (stream) => {
  const mimeType = getSupportedRecorderMimeType();

  return mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);
};

export const stopMediaTracks = (stream) => {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
};