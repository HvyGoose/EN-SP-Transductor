import { useEffect } from 'react';
import { stopMediaTracks } from '@/utils/audioRecorder';

export const useConversationEffects = ({ refs }) => {
  const { conversationStreamRef } = refs;

  useEffect(() => () => {
    const stream = conversationStreamRef.current;
    if (stream) {
      stopMediaTracks(stream);
    }
  }, [conversationStreamRef]);
};