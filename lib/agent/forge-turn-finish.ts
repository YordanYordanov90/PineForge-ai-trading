import 'server-only';

import type { StepResult } from 'ai';
import type { ForgeToolSet } from '@/lib/agent/build-forge-tools';
import { appendMessages, updateConversationTitle, upsertAgentMemory } from '@/lib/db';
import {
  evaluateTipsForTurn,
  extractToolResultsFromSteps,
} from '@/lib/agent/tips';
import {
  generateConversationTitle,
  stepsToAgentMessages,
  buildUserAgentMessage,
} from '@/lib/agent/persist-turn';
import { maybeExtractAndPersistMemory } from '@/lib/agent/memory-extraction';
import { devWarn } from '@/lib/dev-log';
import type { AgentMessage, AgentUserProfile, SavedConversation } from '@/lib/types/agent';
import type { GrokModelId } from '@/lib/types';

export type ForgeTurnFinishInput = {
  userId: number;
  conversationId: number;
  message: string;
  conversation: SavedConversation;
  profile: AgentUserProfile;
  model: GrokModelId;
  userAgentMessage: ReturnType<typeof buildUserAgentMessage>;
  isFirstExchange: boolean;
  steps: ReadonlyArray<StepResult<ForgeToolSet>>;
  signal: AbortSignal;
  releaseLock: () => Promise<void>;
};

async function persistTurnMessages(input: ForgeTurnFinishInput): Promise<AgentMessage[]> {
  const newAgentMessages: AgentMessage[] = [
    input.userAgentMessage,
    ...stepsToAgentMessages(input.steps),
  ];
  const postTurnMessages = [...input.conversation.messages, ...newAgentMessages];

  await appendMessages(input.conversationId, input.userId, newAgentMessages);

  if (input.isFirstExchange) {
    const title = await generateConversationTitle(
      input.message,
      input.model,
      input.signal,
    );
    await updateConversationTitle(input.userId, input.conversationId, title);
  }

  return postTurnMessages;
}

async function maybeAppendTipMessage(
  input: ForgeTurnFinishInput,
  postTurnMessages: AgentMessage[],
): Promise<AgentMessage[]> {
  const toolResultsFromTurn = extractToolResultsFromSteps(input.steps ?? []);
  const candidate = evaluateTipsForTurn(
    toolResultsFromTurn,
    input.profile.seenTips,
    postTurnMessages,
  );

  if (!candidate) return postTurnMessages;

  const tipMessage: AgentMessage = {
    role: 'assistant',
    content: '',
    tip: {
      id: candidate.id,
      title: candidate.title,
      body: candidate.body,
      codeSnippet: candidate.codeSnippet,
      refineSuggestion: candidate.refineSuggestion,
      triggerTool: candidate.triggerTool,
    },
    createdAt: new Date().toISOString(),
  };

  await appendMessages(input.conversationId, input.userId, [tipMessage]);

  const updatedSeen = Array.from(
    new Set([...(input.profile.seenTips ?? []), candidate.id]),
  );
  void upsertAgentMemory(input.userId, { ...input.profile, seenTips: updatedSeen }).catch(() => {
    devWarn('[forge] seen tip upsert failed (non-fatal)');
  });

  return [...postTurnMessages, tipMessage];
}

export async function handleForgeTurnFinish(input: ForgeTurnFinishInput): Promise<void> {
  let postTurnMessages = input.conversation.messages;

  try {
    postTurnMessages = await persistTurnMessages(input);
  } catch (error) {
    devWarn('[forge] persist-turn failed', error);
  }

  try {
    postTurnMessages = await maybeAppendTipMessage(input, postTurnMessages);
  } catch (e) {
    devWarn('[forge] tip evaluation failed (non-fatal)', e);
  }

  void maybeExtractAndPersistMemory({
    userId: input.userId,
    conversation: { messages: postTurnMessages },
    model: input.model,
  });

  void input.releaseLock();
}