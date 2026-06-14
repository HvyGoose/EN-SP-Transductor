import { useConversationActions } from '@/hooks/useConversationActions';
import { useConversationEffects } from '@/hooks/useConversationEffects';

export const useConversationManager = ({ refs, setters, state }) => {
  const conversationActions = useConversationActions({ refs, setters, state });

  useConversationEffects({ refs, state, stopConversationMode: conversationActions.stopConversationMode });

  return conversationActions;
};