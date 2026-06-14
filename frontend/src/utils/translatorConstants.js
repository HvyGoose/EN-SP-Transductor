export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AUDIO_FFT_SIZE = 512;
export const DEFAULT_SILENCE_DURATION = 2;
export const DEFAULT_SENSITIVITY = 25;
export const SENSITIVITY_MULTIPLIER = 1.5;
export const MIN_AUDIO_BLOB_SIZE = 5000;
export const TRANSLATION_DEBOUNCE_MS = 500;
export const COPY_FEEDBACK_DURATION = 2000;
export const HTTP_NOT_FOUND = 404;
export const VOICE_MIN_AUDIO_BLOB_SIZE = 1500;
export const MIN_RECORDING_DURATION_MS = 700;
export const RECORDER_CHUNK_MS = 250;
export const RECORDER_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];