import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  API,
  MIN_RECORDING_DURATION_MS,
  RECORDER_CHUNK_MS,
  VOICE_MIN_AUDIO_BLOB_SIZE
} from '@/utils/translatorConstants';
import { createRecorder, stopMediaTracks } from '@/utils/audioRecorder';
import { useLatestValue } from '@/hooks/useLatestValue';

export const useVoiceInputManager = ({ refs, setters, state, translateText }) => {
  const sourceLangRef = useLatestValue(state.sourceLang);
  const isRecordingRef = useLatestValue(state.isRecording);
  const {
    audioChunksRef,
    isStartingRecordingRef,
    mediaRecorderRef,
    recordingStartedAtRef,
    recordingStreamRef,
    skipNextDebounceRef,
    stopRecordingTimeoutRef
  } = refs;
  const { setError, setIsRecording, setSourceText } = setters;

  const submitVoiceRecording = useCallback(async (audioBlob) => {
    if (audioBlob.size < VOICE_MIN_AUDIO_BLOB_SIZE) {
      toast.error('We did not catch enough audio. Please hold the mic a bit longer.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', sourceLangRef.current);

    try {
      setError(null);
      const response = await axios.post(`${API}/speech-to-text`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const transcript = response.data.text?.trim() || '';
      if (!transcript) {
        toast.error('No speech was detected. Please try again.');
        return;
      }

      skipNextDebounceRef.current = true;
      setSourceText(transcript);
      await translateText(transcript);
      toast.success('Voice transcribed');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' && detail.length > 0 ? detail : 'Voice recognition failed');
    }
  }, [setError, setSourceText, skipNextDebounceRef, sourceLangRef, translateText]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current || isStartingRecordingRef.current) {
      return;
    }

    try {
      isStartingRecordingRef.current = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      recordingStreamRef.current = stream;
      const mediaRecorder = createRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        stopMediaTracks(stream);
        if (recordingStreamRef.current === stream) {
          recordingStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        await submitVoiceRecording(audioBlob);
      };

      mediaRecorder.onerror = () => {
        stopMediaTracks(stream);
        if (recordingStreamRef.current === stream) {
          recordingStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        toast.error('Microphone recording failed');
      };

      mediaRecorder.start(RECORDER_CHUNK_MS);
      isStartingRecordingRef.current = false;
      setIsRecording(true);
      toast.info('Listening... tap Stop when you are done speaking.');
    } catch (error) {
      isStartingRecordingRef.current = false;
      setIsRecording(false);
      toast.error('Microphone access denied');
    }
  }, [audioChunksRef, isRecordingRef, isStartingRecordingRef, mediaRecorderRef, recordingStartedAtRef, recordingStreamRef, setIsRecording, submitVoiceRecording]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecordingRef.current || recorder.state !== 'recording') {
      return;
    }

    const stopRecorder = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        return;
      }

      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
      } catch (error) {
        void error;
      }

      mediaRecorderRef.current.stop();
    };

    const elapsed = Date.now() - recordingStartedAtRef.current;
    if (elapsed < MIN_RECORDING_DURATION_MS) {
      stopRecordingTimeoutRef.current = setTimeout(stopRecorder, MIN_RECORDING_DURATION_MS - elapsed);
      return;
    }

    stopRecorder();
  }, [isRecordingRef, mediaRecorderRef, recordingStartedAtRef, stopRecordingTimeoutRef]);

  const handleMicClick = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
      return;
    }

    startRecording();
  }, [isRecordingRef, startRecording, stopRecording]);

  useEffect(() => () => {
    const stream = recordingStreamRef.current;
    const timeoutId = stopRecordingTimeoutRef.current;
    if (stream) {
      stopMediaTracks(stream);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, [recordingStreamRef, stopRecordingTimeoutRef]);

  return {
    handleMicClick
  };
};