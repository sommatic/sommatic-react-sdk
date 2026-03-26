import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@veripass/react-sdk';

import { createEntityRecord, fetchEntityCollection } from '@services/utils/entityServiceAdapter';
import ChatBubble from './ChatBubble.component';
import SystemResponse from './SystemResponse.component';
import ThoughtProcess from './ThoughtProcess.component';
import CognitiveEntryComponent from './CognitiveEntry.component';
import AppOutputCard from './AppOutputCard.component';
import { useCommandCenter } from '../../features/command-center/hooks/useCommandCenter.hook';
import styled from 'styled-components';

const SidebarSection = styled.section`
  min-height: 0;
  background-color: #ebeff2;

  scrollbar-width: thin;
  scrollbar-color: #5d4a7d transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #5d4a7d;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4e3875;
  }
`;

// Module-level cache: survives unmount/remount of CognitiveEntryManager.
// Keyed by conversationId, stores app-embed records so they persist
// across Command Center close/reopen cycles.
const appEmbedRecordsCache = new Map();

// ---------------------------------------------------------------------------
// Record validation and metadata extraction (ported from ConversationManagementEdit)
// so that sidebar restore shows ThoughtProcess/SystemResponse correctly.
// ---------------------------------------------------------------------------

function extractFirstJsonStructure(str, openChar, closeChar) {
  const start = str.indexOf(openChar);
  if (start === -1) {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote = null;
  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === quote) {
        inString = false;
        continue;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      continue;
    }
    if (c === openChar) {
      depth++;
      continue;
    }
    if (c === closeChar) {
      depth--;
      if (depth === 0) {
        return str.substring(start, i + 1);
      }
    }
  }
  return null;
}

function isValidRecord(record) {
  try {
    const role = record?.role?.name ?? record?.role ?? 'system';
    const text = record?.content?.text ?? record?.content ?? '';

    if (typeof text !== 'string') {
      return true;
    }

    const trimmedText = text.trim();

    if (role === 'assistant') {
      let jsonText = trimmedText;

      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      if (!jsonText.startsWith('{')) {
        return true;
      }

      const jsonPart = extractFirstJsonStructure(jsonText, '{', '}');
      if (!jsonPart) {
        return true;
      }

      const parsed = JSON.parse(jsonPart);

      if (!parsed.thought || !parsed.plan) {
        return true;
      }

      const isOnlyReply = parsed.plan.length > 0 && parsed.plan.every((step) => step.command_id === 'reply');

      if (!isOnlyReply) {
        return false;
      }

      return true;
    }

    if (role === 'user' && trimmedText.startsWith('Context obtained from command execution:')) {
      const jsonPart = extractFirstJsonStructure(text, '[', ']');
      if (!jsonPart) {
        return true;
      }

      const parsed = JSON.parse(jsonPart);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return true;
      }

      const firstItem = parsed[0];

      const hasCommand = Object.prototype.hasOwnProperty.call(firstItem, 'command');
      const hasStatus = Object.prototype.hasOwnProperty.call(firstItem, 'status');

      if (!hasCommand || !hasStatus) {
        return true;
      }

      return false;
    }

    return true;
  } catch (e) {
    return true;
  }
}

function resolveSystemResponseVariant(allRecordsUnfiltered, record) {
  if (record?.variant) {
    return record.variant;
  }

  const currentIdx = allRecordsUnfiltered.indexOf(record);
  if (currentIdx === -1) {
    return 'default';
  }

  for (let i = currentIdx - 1; i >= 0; i--) {
    const prevRole = allRecordsUnfiltered[i]?.role?.name ?? allRecordsUnfiltered[i]?.role ?? '';
    if (prevRole !== 'user') {
      continue;
    }

    const prevText = allRecordsUnfiltered[i]?.content?.text ?? allRecordsUnfiltered[i]?.content ?? '';

    if (typeof prevText === 'string' && prevText.trimStart().startsWith('Context obtained from command execution:')) {
      return 'gradient';
    }

    break;
  }

  return 'default';
}

function extractReplyOnlyPlanText(roleName, recordText) {
  try {
    if (roleName !== 'assistant' || typeof recordText !== 'string') {
      return null;
    }

    let rawStr = recordText.trim();

    if (rawStr.startsWith('```json')) {
      rawStr = rawStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (rawStr.startsWith('```')) {
      rawStr = rawStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    if (!rawStr.startsWith('{')) {
      return null;
    }

    const parsed = JSON.parse(rawStr);

    if (!parsed.plan || parsed.plan.length === 0) {
      return null;
    }

    const isOnlyReply = parsed.plan.every((step) => step.command_id === 'reply');
    if (!isOnlyReply) {
      return null;
    }

    return parsed.plan[0].args?.text || parsed.plan[0].args?.message || '...';
  } catch (e) {
    return null;
  }
}

function extractContextMetadata(allRecordsUnfiltered, currentRecord) {
  try {
    const currentIdx = allRecordsUnfiltered.indexOf(currentRecord);
    if (currentIdx === -1) {
      return { thought: null, plan: null };
    }

    let prevUserRecord = null;
    for (let i = currentIdx - 1; i >= 0; i--) {
      const prevRole = allRecordsUnfiltered[i]?.role?.name ?? allRecordsUnfiltered[i]?.role ?? '';
      if (prevRole === 'user') {
        prevUserRecord = allRecordsUnfiltered[i];
        break;
      }
    }

    if (!prevUserRecord || !prevUserRecord.metadata) {
      return { thought: null, plan: null };
    }

    const metadata = prevUserRecord.metadata;
    let thoughtContent = null;
    let planContent = null;

    const prevText = prevUserRecord.content?.text ?? prevUserRecord.content ?? '';
    const isContextExecution =
      typeof prevText === 'string' && prevText.trimStart().startsWith('Context obtained from command execution:');

    if (isContextExecution) {
      thoughtContent = metadata.thought || null;
      planContent = metadata.execution_plan || null;
    }

    if (!thoughtContent && metadata.thought) {
      thoughtContent = metadata.thought;
    }

    if (!planContent && metadata.execution_plan) {
      planContent = metadata.execution_plan;
    }

    return { thought: thoughtContent, plan: planContent };
  } catch (e) {
    return { thought: null, plan: null };
  }
}

/**
 * Extracts the value of the "thought" field from a raw, potentially incomplete JSON string.
 *
 * This function is designed to work with streaming LLM responses where the JSON payload
 * may not yet be fully received or parseable by `JSON.parse`. Instead of parsing the
 * entire structure, it locates the `"thought"` key using string scanning, then manually
 * reads the string value character by character — correctly handling JSON escape sequences
 * (e.g. `\"`, `\\`, `\n`, `\t`) — until the closing double-quote is found or the input ends.
 *
 * @param {string} rawText - The raw (possibly partial) JSON string received from the stream.
 * @returns {string} The extracted thought text, or an empty string if the key/value is
 *   not found, not yet present, or does not start with a quoted string.
 */
function extractPartialThought(rawText) {
  const keyIdx = rawText.indexOf('"thought"');
  if (keyIdx === -1) {
    return '';
  }
  const afterKey = rawText.slice(keyIdx + 9);
  const colonIdx = afterKey.indexOf(':');
  if (colonIdx === -1) {
    return '';
  }
  const afterColon = afterKey.slice(colonIdx + 1).trimStart();
  if (!afterColon.startsWith('"')) {
    return '';
  }
  let result = '';
  let escaped = false;
  for (let i = 1; i < afterColon.length; i++) {
    const ch = afterColon[i];
    if (escaped) {
      result += ch === 'n' ? '\n' : ch === 't' ? '\t' : ch;
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (ch === '"') {
      break;
    } else {
      result += ch;
    }
  }
  return result;
}

const CognitiveEntryManagerComponent = ({
  mode = 'default',
  initialConversationId = null,
  onConversationChange,
  createContext = {},
  autoFocus = false,
  initialMessage = null,
  onInitialMessageSent,
  renderAppEmbed,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const appBasePath = location.pathname.startsWith('/client') ? '/client' : '/admin';
  const { executeIntent, ConversationManagementService, executionService, defaultProviderId, commands, allCommands, providers } =
    useCommandCenter();
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [records, setRecords] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState(null);
  const initialMessageSentRef = useRef(false);
  const chunkBufferRef = useRef('');
  const thinkingRecordIdRef = useRef(null);
  const thinkingStartTimeRef = useRef(null);
  const sidebarScrollRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  // Refs for app-output handler (avoids stale closures in useEffect)
  const conversationRef = useRef(null);
  const executionServiceRef = useRef(executionService);
  const defaultProviderIdRef = useRef(defaultProviderId);
  const userRef = useRef(user);
  conversationRef.current = conversation;
  executionServiceRef.current = executionService;
  defaultProviderIdRef.current = defaultProviderId;
  userRef.current = user;

  useEffect(() => {
    if (mode !== 'sidebar') {
      return;
    }

    if (!initialConversationId) {
      setRecords([]);
      setConversation(null);
      return;
    }

    if (conversation?.id === initialConversationId) {
      return;
    }

    const fetchConversation = async () => {
      const response = await fetchEntityCollection({
        service: ConversationManagementService,
        payload: {
          queryselector: 'id',
          query: { search: initialConversationId },
          pageSize: 1,
        },
      });

      if (!response?.success || !response?.result?.items?.length) {
        return;
      }

      const conv = response.result.items[0];
      setConversation(conv);
      const baseRecords = conv.conversation_records || [];
      const cachedEmbeds = appEmbedRecordsCache.get(conv.id) || [];
      setRecords([...baseRecords, ...cachedEmbeds]);
    };
    fetchConversation();
  }, [mode, initialConversationId]);

  useEffect(() => {
    if (initialMessage == null) {
      initialMessageSentRef.current = false;
      return;
    }
  }, [initialMessage]);

  useEffect(() => {
    if (mode !== 'sidebar' || !initialMessage || initialMessageSentRef.current || isThinking) {
      return;
    }
    initialMessageSentRef.current = true;
    handleSidebarMessage({ query: initialMessage }).finally(() => {
      onInitialMessageSent?.();
    });
    // Intentionally omit handleSidebarMessage/onInitialMessageSent to run only when initialMessage (or mode/isThinking) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialMessage, isThinking]);

  useEffect(() => {
    const el = sidebarScrollRef.current;
    if (!el) {
      return;
    }
    const THRESHOLD = 100;
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = false;
        return;
      }
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - THRESHOLD;
      userScrolledUpRef.current = !isAtBottom;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mode !== 'sidebar') return;
    const handleAppOutput = async (event) => {
      const { recordId, appSlug, outputPayload } = event.detail || {};
      if (!outputPayload) return;
      console.log('[CognitiveEntryManager] Received app output:', { recordId, appSlug, outputPayload });

      const outputRecordId = `app-output_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setRecords((prev) => [
        ...prev,
        {
          record_id: outputRecordId,
          type: 'app-output',
          role: 'system',
          app_slug: appSlug,
          source_record_id: recordId,
          content: { text: `App [${appSlug}] submitted output.` },
          output_payload: outputPayload,
        },
      ]);

      // Collapse the source embed record
      setRecords((prev) =>
        prev.map((r) => {
          if (r.type !== 'app-embed' || r.status === 'completed') return r;
          const isMatch = recordId ? r.record_id === recordId : r.app_slug === appSlug;
          return isMatch ? { ...r, status: 'completed' } : r;
        }),
      );

      // Update module-level cache so collapse persists across CC close/reopen
      const currentConversationId = conversationRef.current?.id;
      if (currentConversationId && appEmbedRecordsCache.has(currentConversationId)) {
        const cached = appEmbedRecordsCache.get(currentConversationId);
        const updatedCache = cached.map((r) => {
          const isMatch = recordId ? r.record_id === recordId : r.app_slug === appSlug;
          return isMatch ? { ...r, status: 'completed' } : r;
        });
        appEmbedRecordsCache.set(currentConversationId, updatedCache);
      }

      // Send app output to LLM so it persists in conversation and the agent has context
      const currentConversation = conversationRef.current;
      const currentExecutionService = executionServiceRef.current;
      const currentProviderId = defaultProviderIdRef.current;
      const currentUser = userRef.current;

      if (!currentConversation?.id || !currentExecutionService || !currentProviderId) return;

      const outputSummary =
        typeof outputPayload === 'object' ? JSON.stringify(outputPayload, null, 2) : String(outputPayload);
      const truncated = outputSummary.length > 8000 ? outputSummary.slice(0, 8000) + '\n... [truncated]' : outputSummary;

      const synthesisRecordId = `app-output-synthesis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setRecords((prev) => [
        ...prev,
        {
          record_id: synthesisRecordId,
          role: 'assistant',
          content: { text: '' },
          variant: 'default',
          isSynthesizing: true,
          isSynthesisStreaming: true,
        },
      ]);

      let synthesisBuffer = '';
      const organizationId =
        currentUser?.payload?.organization_id || currentUser?.organization_id || '';

      try {
        await currentExecutionService.executeStream(
          {
            organization_id: organizationId,
            conversation_id: currentConversation.id,
            llm_provider_id: currentProviderId,
            message: {
              text: `Data received from app [${appSlug}]:\n${truncated}\n\nAcknowledge this data briefly. The user may ask questions about it later.`,
            },
          },
          {
            onChunk: (chunkData) => {
              synthesisBuffer += chunkData?.text || '';
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === synthesisRecordId
                    ? { ...record, content: { text: synthesisBuffer }, isSynthesizing: false }
                    : record,
                ),
              );
            },
            onDone: (donePayload) => {
              const output = donePayload?.output;
              let finalText = synthesisBuffer;
              if (output) {
                const rawText = output.content?.text ?? output.text;
                if (typeof rawText === 'string') finalText = rawText;
              }
              if (!finalText) finalText = synthesisBuffer || 'Data received and stored.';
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === synthesisRecordId
                    ? { ...record, content: { text: finalText }, isSynthesizing: false, isSynthesisStreaming: false }
                    : record,
                ),
              );
            },
            onError: () => {
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === synthesisRecordId
                    ? {
                        ...record,
                        content: { text: synthesisBuffer || 'Data received.' },
                        isSynthesizing: false,
                        isSynthesisStreaming: false,
                      }
                    : record,
                ),
              );
            },
          },
        );
      } catch (err) {
        console.error('[CognitiveEntryManager] Failed to persist app output to conversation:', err);
      }
    };
    window.addEventListener('sommatic:app:output', handleAppOutput);
    return () => window.removeEventListener('sommatic:app:output', handleAppOutput);
  }, [mode]);

  const isAnyRecordStreaming = records.some(
    (record) => record.isThinking || record.isSynthesizing || record.isSynthesisStreaming,
  );

  useEffect(() => {
    if (!isAnyRecordStreaming || userScrolledUpRef.current) {
      return;
    }
    const el = sidebarScrollRef.current;
    if (!el) {
      return;
    }
    isProgrammaticScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
  }, [records, isAnyRecordStreaming]);

  const handleConversationIntent = ({ query, provider, conversation }) => {
    const path = conversation?.id ? `${appBasePath}/chat/conversation/${conversation.id}` : `${appBasePath}/chat/conversation`;

    navigate(path, {
      state: {
        autoExecute: true,
        prompt: query,
        llm_provider_id: provider?.id,
      },
    });
  };

  const handleSidebarMessage = async (entity) => {
    userScrolledUpRef.current = false;
    const messageContent = entity.query || entity;
    const attachments = entity.attachments || [];
    const provider = entity.provider;

    setRecords((prevRecords) => [...prevRecords, { role: 'user', content: messageContent }]);
    setIsThinking(true);
    setCanSendMessage(false);

    try {
      const organizationId = user?.payload?.organization_id || user?.organization_id || '';
      let currentConversationId = conversation?.id || '';

      if (!currentConversationId) {
        const createPayload = {
          organization_id: organizationId,
          title: messageContent.length > 80 ? `${messageContent.slice(0, 80)}...` : messageContent,
          memory_strategy: { name: 'full-history' },
          memory_window_size: 20,
          conversation_records: [],
          ...createContext,
        };

        const createResponse = await createEntityRecord({
          service: ConversationManagementService,
          payload: createPayload,
        });

        if (!createResponse?.success || !createResponse?.result?.id) {
          console.error('Failed to create conversation for intent execution');
          return;
        }

        currentConversationId = createResponse.result.id;

        const convResponse = await fetchEntityCollection({
          service: ConversationManagementService,
          payload: {
            queryselector: 'id',
            query: { search: currentConversationId },
          },
        });

        if (convResponse?.result?.items?.length) {
          setConversation(convResponse.result.items[0]);
          onConversationChange?.(currentConversationId);
        }
      }

      try {
        const intentResult = await executeIntent(messageContent, currentConversationId, organizationId, {
          onStreamOpen: () => {
            thinkingStartTimeRef.current = Date.now();
            chunkBufferRef.current = '';
            const recordId = `thinking-${Date.now()}`;
            thinkingRecordIdRef.current = recordId;
            setIsThinking(true);
            setRecords((prev) => [
              ...prev,
              {
                record_id: recordId,
                role: 'system',
                thought: '',
                execution_plan: [],
                variant: 'default',
                content: '',
                isThinking: true,
                durationMs: null,
              },
            ]);
          },
          onThoughtChunk: (text) => {
            chunkBufferRef.current += text;
            const partialThought = extractPartialThought(chunkBufferRef.current);
            if (!partialThought) {
              return;
            }
            setRecords((prev) =>
              prev.map((record) =>
                record.record_id === thinkingRecordIdRef.current ? { ...record, thought: partialThought } : record,
              ),
            );
          },
          onPlanReceived: ({ plan, thought }) => {
            setIsThinking(false);
            setRecords((prev) =>
              prev.map((record) =>
                record.record_id === thinkingRecordIdRef.current
                  ? { ...record, thought, execution_plan: plan, isThinking: false }
                  : record,
              ),
            );
          },
          onProgress: (updatedPlan) => {
            setRecords((prev) =>
              prev.map((record) =>
                record.record_id === thinkingRecordIdRef.current ? { ...record, execution_plan: updatedPlan } : record,
              ),
            );
          },
        });

        const totalDurationMs = thinkingStartTimeRef.current ? Date.now() - thinkingStartTimeRef.current : null;

        if (!intentResult) {
          console.info('No intent result');
          if (thinkingRecordIdRef.current) {
            setRecords((prev) => prev.filter((record) => record.record_id !== thinkingRecordIdRef.current));
            thinkingRecordIdRef.current = null;
          }
        } else {
          const { plan, results: rawResults, thought } = intentResult;

          if (!rawResults || rawResults.length === 0) {
            console.info('No results');
            if (thinkingRecordIdRef.current) {
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === thinkingRecordIdRef.current
                    ? { ...record, isThinking: false, durationMs: totalDurationMs }
                    : record,
                ),
              );
              thinkingRecordIdRef.current = null;
            }
            setIsThinking(false);
            setCanSendMessage(true);
            return;
          }

          // Extract app-embed results and insert them as records in the conversation
          const embedResults = rawResults.filter((r) => r.result?.type === 'app-embed');
          const results = rawResults.filter((r) => r.result?.type !== 'app-embed');

          if (embedResults.length > 0) {
            const newEmbedRecords = [];
            for (const embed of embedResults) {
              const embedData = embed.result.app_embed || {};
              const embedRecord = {
                record_id: `embed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                type: 'app-embed',
                role: 'system',
                app_slug: embedData.app_slug,
                route_path: embedData.route_path,
                input_payload: embedData.input_payload,
                launch_mode: embedData.launch_mode,
                status: 'active',
              };
              newEmbedRecords.push(embedRecord);
              setRecords((prev) => [...prev, embedRecord]);
            }

            // Cache embed records so they survive CC close/reopen
            const cacheKey = currentConversationId || '__no_conversation__';
            const cached = appEmbedRecordsCache.get(cacheKey) || [];
            appEmbedRecordsCache.set(cacheKey, [...cached, ...newEmbedRecords]);

          }

          if (results.length === 0 && embedResults.length > 0) {
            // Only app-embed results — persist via synthesis (same pattern as other commands)
            const appEmbedsMeta = embedResults.map((e) => ({
              app_slug: e.result?.app_embed?.app_slug,
              route_path: e.result?.app_embed?.route_path,
              launch_mode: e.result?.app_embed?.launch_mode,
            }));

            const targetProviderId = entity.provider?.id || defaultProviderId;
            const capturedThinkingId = thinkingRecordIdRef.current;
            thinkingRecordIdRef.current = null;

            if (!targetProviderId || typeof executionService.executeStream !== 'function') {
              if (capturedThinkingId) {
                setRecords((prev) =>
                  prev.map((record) => {
                    if (record.record_id !== capturedThinkingId) return record;
                    const completedPlan = (record.execution_plan || []).map((step) => ({
                      ...step,
                      status: step.status === 'running' ? 'success' : step.status,
                    }));
                    return { ...record, isThinking: false, durationMs: totalDurationMs, execution_plan: completedPlan };
                  }),
                );
              }
              setIsThinking(false);
              setCanSendMessage(true);
              return;
            }

            const appSlugs = appEmbedsMeta.map((a) => a.app_slug).join(', ');

            // Single setRecords: mark plan as success + activate synthesis (same pattern as line 1096)
            if (capturedThinkingId) {
              setRecords((prev) =>
                prev.map((record) => {
                  if (record.record_id !== capturedThinkingId) return record;
                  const completedPlan = (record.execution_plan || []).map((step) => ({
                    ...step,
                    status: step.status === 'running' ? 'success' : step.status,
                  }));
                  return {
                    ...record,
                    execution_plan: completedPlan,
                    isThinking: false,
                    durationMs: totalDurationMs,
                    isSynthesizing: true,
                    isSynthesisStreaming: true,
                    variant: 'default',
                  };
                }),
              );
            }

            let synthesisBuffer = '';

            await executionService.executeStream(
              {
                organization_id: organizationId,
                conversation_id: currentConversationId,
                llm_provider_id: targetProviderId,
                message: {
                  text: `The following app(s) were opened in embedded view for the user: [${appSlugs}].\n\nOriginal user request: "${messageContent}"\n\nBriefly acknowledge that the app has been opened. 1-2 sentences max. Respond in the same language as the user's message.`,
                },
                metadata: {
                  thought,
                  execution_plan: plan,
                  app_embeds: appEmbedsMeta,
                },
              },
              {
                onChunk: (chunkData) => {
                  synthesisBuffer += chunkData?.text || '';
                  setRecords((prev) =>
                    prev.map((record) =>
                      record.record_id === capturedThinkingId
                        ? { ...record, content: { text: synthesisBuffer }, isSynthesizing: false }
                        : record,
                    ),
                  );
                },
                onDone: (donePayload) => {
                  const output = donePayload?.output;
                  let finalText = synthesisBuffer;
                  if (output) {
                    const rawText = output.content?.text ?? output.text;
                    if (typeof rawText === 'string') finalText = rawText;
                  }
                  if (!finalText) finalText = synthesisBuffer || `App ${appSlugs} opened.`;
                  setRecords((prev) =>
                    prev.map((record) =>
                      record.record_id === capturedThinkingId
                        ? { ...record, content: { text: finalText }, isSynthesizing: false, isSynthesisStreaming: false }
                        : record,
                    ),
                  );
                  setIsThinking(false);
                  setCanSendMessage(true);
                },
                onError: () => {
                  setRecords((prev) =>
                    prev.map((record) =>
                      record.record_id === capturedThinkingId
                        ? {
                            ...record,
                            content: { text: `App ${appSlugs} opened.` },
                            isSynthesizing: false,
                            isSynthesisStreaming: false,
                          }
                        : record,
                    ),
                  );
                  setIsThinking(false);
                  setCanSendMessage(true);
                },
              },
            );
            return;
          }

          if (results.length === 0) {
            console.info('No results');
            if (thinkingRecordIdRef.current) {
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === thinkingRecordIdRef.current
                    ? { ...record, isThinking: false, durationMs: totalDurationMs }
                    : record,
                ),
              );
              thinkingRecordIdRef.current = null;
            }
            setIsThinking(false);
            setCanSendMessage(true);
            return;
          }

          const hasActualCommands = results.some((result) => result.command !== 'reply');

          if (!hasActualCommands) {
            const replyResult = results.find((result) => result.command === 'reply');
            const classificationReplyText = replyResult?.result?.text || '';
            const targetProviderId = provider?.id || defaultProviderId;
            const capturedThinkingId = thinkingRecordIdRef.current;
            thinkingRecordIdRef.current = null;

            if (!targetProviderId || typeof executionService.executeStream !== 'function') {
              setRecords((prevRecords) => {
                const newRecords = [...prevRecords];
                const lastIndex = newRecords.length - 1;
                const displayRecord = {
                  role: 'assistant',
                  content: { text: classificationReplyText },
                  thought: thought,
                  execution_plan: plan,
                  variant: 'default',
                  isThinking: false,
                };
                if (lastIndex >= 0 && newRecords[lastIndex].isThinking) {
                  newRecords[lastIndex] = { ...newRecords[lastIndex], ...displayRecord };
                  return newRecords;
                }
                return [...prevRecords, displayRecord];
              });
              setIsThinking(false);
              setCanSendMessage(true);
              return;
            }

            setRecords((prev) =>
              prev.map((record) =>
                record.record_id === capturedThinkingId
                  ? {
                      ...record,
                      execution_plan: plan,
                      thought: thought,
                      isThinking: false,
                      durationMs: totalDurationMs,
                      isSynthesizing: true,
                      isSynthesisStreaming: true,
                      variant: 'default',
                    }
                  : record,
              ),
            );

            let replyBuffer = '';

            await executionService.executeStream(
              {
                organization_id: organizationId,
                conversation_id: currentConversationId,
                llm_provider_id: targetProviderId,
                message: { text: messageContent },
              },
              {
                onChunk: (chunkData) => {
                  replyBuffer += chunkData?.text || '';
                  setRecords((prev) =>
                    prev.map((record) =>
                      record.record_id === capturedThinkingId
                        ? { ...record, content: { text: replyBuffer }, isSynthesizing: false }
                        : record,
                    ),
                  );
                },
                onDone: (donePayload) => {
                  const output = donePayload?.output;
                  let finalText = replyBuffer;
                  if (output) {
                    const rawText = output.content?.text ?? output.text;
                    if (typeof rawText === 'string') finalText = rawText;
                  }
                  if (!finalText) finalText = replyBuffer || classificationReplyText;
                  setRecords((prev) =>
                    prev.map((record) =>
                      record.record_id === capturedThinkingId
                        ? { ...record, content: { text: finalText }, isSynthesizing: false, isSynthesisStreaming: false }
                        : record,
                    ),
                  );
                  setIsThinking(false);
                  setCanSendMessage(true);
                },
                onError: () => {
                  setRecords((prev) =>
                    prev.map((record) =>
                      record.record_id === capturedThinkingId
                        ? {
                            ...record,
                            content: { text: replyBuffer || classificationReplyText || 'An error occurred.' },
                            isSynthesizing: false,
                            isSynthesisStreaming: false,
                          }
                        : record,
                    ),
                  );
                  setIsThinking(false);
                  setCanSendMessage(true);
                },
              },
            );
            return;
          }

          const resolveLastThinkingRecord = (text) => {
            setRecords((prev) => {
              const next = [...prev];
              const lastIndex = next.length - 1;
              if (lastIndex >= 0 && next[lastIndex].isThinking) {
                next[lastIndex] = {
                  ...next[lastIndex],
                  content: { text },
                  isThinking: false,
                };
              }
              return next;
            });
            setIsThinking(false);
            setCanSendMessage(true);
          };

          // Trim synthesis context to avoid exceeding LLM context limits.
          // Nested results (e.g. execution log entries containing full page context) are
          // summarized so the payload stays within a safe character budget.
          // Timestamps (Unix ms) are pre-converted to ISO strings so the LLM does not
          // attempt to format them and produce incorrect dates.
          const MAX_SYNTHESIS_CHARS = 12000;
          const MS_TS_MIN = 1_500_000_000_000; // ~2017
          const MS_TS_MAX = 2_000_000_000_000; // ~2033

          const convertTimestamps = (value) => {
            if (Array.isArray(value)) {
              return value.map(convertTimestamps);
            }
            if (value !== null && typeof value === 'object') {
              const result = {};
              for (const [k, v] of Object.entries(value)) {
                result[k] = convertTimestamps(v);
              }
              return result;
            }
            if (typeof value === 'number' && value >= MS_TS_MIN && value <= MS_TS_MAX) {
              return new Date(value).toISOString();
            }
            if (typeof value === 'string' && /^\d{13}$/.test(value)) {
              const n = Number(value);
              if (n >= MS_TS_MIN && n <= MS_TS_MAX) {
                return new Date(n).toISOString();
              }
            }
            return value;
          };

          const trimResultsForSynthesis = (rawResults) => {
            const converted = convertTimestamps(rawResults);
            const trimmed = converted.map((r) => {
              const resultStr = JSON.stringify(r.result ?? null);
              if (resultStr.length <= 4000) {
                return r;
              }
              return {
                ...r,
                result: `[truncated — ${resultStr.length} chars. Summary: ${resultStr.slice(0, 400)}...]`,
              };
            });

            const fullStr = JSON.stringify(trimmed, null, 2);
            if (fullStr.length <= MAX_SYNTHESIS_CHARS) {
              return fullStr;
            }
            return fullStr.slice(0, MAX_SYNTHESIS_CHARS) + '\n... [truncated for synthesis]';
          };

          const targetProviderId = entity.provider?.id || defaultProviderId;

          if (!targetProviderId) {
            resolveLastThinkingRecord('Commands executed. No synthesis provider configured.');
            return;
          }

          const synthesisPayload = {
            organization_id: organizationId,
            conversation_id: currentConversationId,
            llm_provider_id: targetProviderId || '',
            message: {
              text: `Context obtained from command execution:\n${trimResultsForSynthesis(results)}\n\nOriginal User Query: "${messageContent}"\n\nCurrent date/time: ${new Date().toLocaleString()} (UTC${new Date().getTimezoneOffset() <= 0 ? '+' : '-'}${String(Math.abs(Math.floor(new Date().getTimezoneOffset() / 60))).padStart(2, '0')}:${String(Math.abs(new Date().getTimezoneOffset() % 60)).padStart(2, '0')})\n\nPlease respond to the user based on this context. Rules:\n- YOU MUST RESPOND IN THE SAME LANGUAGE AS THE ORIGINAL USER QUERY.\n- All ISO timestamps in the data are UTC. When displaying dates, convert them to the local time shown above and include the UTC offset (e.g. "25 feb 2026, 11:31 PM UTC-05:00"). Do NOT use any special timestamp syntax like <t:...:R> or template literals.`,
            },
            metadata: {
              thought: thought,
              execution_plan: plan,
            },
          };

          if (providers && providers.length > 0) {
            const synthesisProvider = providers.find((provider) => provider.id === targetProviderId);
            if (synthesisProvider && import.meta.env.VITE_COMMAND_CENTER_DEBUG === 'true') {
              console.log(
                `%c Command Center - Synthesis Model: ${synthesisProvider.name || synthesisProvider.model_identifier}`,
                'background: #222; color: #bada55; font-size: 12px; padding: 4px; border-radius: 4px;',
              );
            }
          }

          const labels = results
            .map((result) => {
              const cmdDef = (commands || []).find((command) => command.id === result.command);
              return cmdDef?.label || result.command;
            })
            .filter((label) => label !== 'reply' && label !== 'Reply');

          const capturedThinkingId = thinkingRecordIdRef.current;
          thinkingRecordIdRef.current = null;

          setRecords((prev) =>
            prev.map((record) =>
              record.record_id === capturedThinkingId
                ? {
                    ...record,
                    execution_plan: plan,
                    isThinking: false,
                    durationMs: totalDurationMs,
                    isSynthesizing: true,
                    isSynthesisStreaming: true,
                    variant: 'gradient',
                    label: labels.join(', '),
                  }
                : record,
            ),
          );

          let synthesisTextBuffer = '';

          await executionService.executeStream(synthesisPayload, {
            onChunk: (chunkData) => {
              synthesisTextBuffer += chunkData?.text || '';
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === capturedThinkingId
                    ? { ...record, content: { text: synthesisTextBuffer }, isSynthesizing: false }
                    : record,
                ),
              );
            },
            onDone: (donePayload) => {
              const output = donePayload?.output;
              let finalText = synthesisTextBuffer;

              if (output) {
                const rawText = output.content?.text ?? output.text;
                if (typeof rawText === 'string') {
                  finalText = rawText;
                  try {
                    if (finalText.trim().startsWith('{')) {
                      const parsed = JSON.parse(finalText);
                      if (parsed.message) finalText = parsed.message;
                      else if (parsed.text) finalText = parsed.text;
                    }
                  } catch (_) {}
                } else if (rawText !== undefined) {
                  finalText = JSON.stringify(rawText, null, 2);
                }
              }

              if (!finalText) {
                finalText = synthesisTextBuffer || 'Commands executed successfully.';
              }

              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === capturedThinkingId
                    ? { ...record, content: { text: finalText }, isSynthesizing: false, isSynthesisStreaming: false }
                    : record,
                ),
              );
              setIsThinking(false);
              setCanSendMessage(true);
            },
            onError: () => {
              const errorText = synthesisTextBuffer || 'The commands ran successfully but the synthesis response failed.';
              setRecords((prev) =>
                prev.map((record) =>
                  record.record_id === capturedThinkingId
                    ? { ...record, content: { text: errorText }, isSynthesizing: false, isSynthesisStreaming: false }
                    : record,
                ),
              );
              setIsThinking(false);
              setCanSendMessage(true);
            },
          });

          return;
        }
      } catch (intentError) {
        console.warn('Command Center Intent failed, falling back to chat.', intentError);
        if (thinkingRecordIdRef.current) {
          setRecords((prev) =>
            prev.map((record) =>
              record.record_id === thinkingRecordIdRef.current ? { ...record, isThinking: false } : record,
            ),
          );
          thinkingRecordIdRef.current = null;
        } else {
          setRecords((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.isThinking) {
              return prev.map((r, i) => (i === prev.length - 1 ? { ...r, isThinking: false } : r));
            }
            return prev;
          });
        }
      }

      const payload = {
        organization_id: organizationId,
        conversation_id: currentConversationId,
        llm_provider_id: provider?.id || '',
        message: { text: messageContent },
        attachments: attachments,
      };

      const response = await executionService.execute(payload);

      if (!response?.success) {
        console.error(response?.message || 'Error executing inference');
        return;
      }

      const result = response.result;
      const output = result.output;

      if (!output) {
        return;
      }

      setRecords((prevRecords) => [...prevRecords, { ...output, variant: 'default' }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
      setCanSendMessage(true);
    }
  };

  const handleInferenceLifecycle = (action, entity) => {
    switch (action) {
      case 'cognitive-entry::on-inference-start':
        setIsThinking(true);
        setCanSendMessage(false);
        break;
      case 'cognitive-entry::on-inference-attempt':
        if (!entity) break;
        setRecords((prevRecords) => [...prevRecords, entity]);
        break;
      case 'cognitive-entry::on-inference-error':
        setIsThinking(false);
        setCanSendMessage(true);
        break;
      case 'cognitive-entry::on-inference-success':
        setIsThinking(false);
        setCanSendMessage(true);
        if (!entity?.result?.output) {
          break;
        }
        setRecords((prevRecords) => [...prevRecords, { ...entity.result.output, variant: 'default' }]);
        break;
      default:
        break;
    }
  };

  const itemOnAction = async (action, entity) => {
    if (!action || !entity) {
      console.error('Invalid action or entity');
      return;
    }
    switch (action) {
      case 'cognitive-entry::on-message':
        if (mode === 'sidebar') {
          await handleSidebarMessage(entity);
        } else {
          handleConversationIntent({
            query: entity.query,
            provider: entity.provider,
            conversation: entity.conversation,
          });
        }
        break;
      case 'cognitive-entry::on-inference-start':
      case 'cognitive-entry::on-inference-attempt':
      case 'cognitive-entry::on-inference-error':
      case 'cognitive-entry::on-inference-success':
        if (mode === 'sidebar') {
          handleInferenceLifecycle(action, entity);
        }
        break;
      default:
        break;
    }
  };

  return (
    <>
      {mode === 'default' && (
        <header className="text-center mt-5 pt-5">
          <h2>Welcome {user?.payload?.profile?.display_name}.</h2>
          <p className="mb-5">Your cognitive layer is ready to elevate every process.</p>
        </header>
      )}

      {mode === 'sidebar' && (
        <SidebarSection ref={sidebarScrollRef} className="flex-grow-1 overflow-auto p-3 d-flex flex-column">
          {records.filter(isValidRecord).map((record, idx) => {
            if (record.type === 'app-embed') {
              if (record.status === 'completed') {
                return (
                  <article key={record.record_id ?? idx} className="mb-3">
                    <AppOutputCard appSlug={record.app_slug} isEmbed={true} />
                  </article>
                );
              }
              if (renderAppEmbed) {
                return (
                  <article key={record.record_id ?? idx} className="mb-3">
                    {renderAppEmbed(record)}
                  </article>
                );
              }
            }

            if (record.type === 'app-output') {
              return (
                <article key={record.record_id ?? idx} className="mb-3">
                  <AppOutputCard appSlug={record.app_slug} />
                </article>
              );
            }

            const roleName = record.role?.name ?? record.role ?? 'system';
            const rawContent = record.content?.text ?? record.content ?? '';
            let content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent, null, 2);

            const replyOnlyText = extractReplyOnlyPlanText(roleName, record.content?.text ?? record.content);
            const isReplyOnlyPlan = Boolean(replyOnlyText);
            if (isReplyOnlyPlan) {
              content = replyOnlyText;
            }

            if (!content && !record.isThinking && !record.isSynthesizing) {
              return null;
            }

            if (roleName === 'user') {
              return (
                <article key={record?.record_id ?? idx} className="d-flex justify-content-end mb-3">
                  <ChatBubble role="user">{content}</ChatBubble>
                </article>
              );
            }

            let variant = resolveSystemResponseVariant(records, record);
            if (isReplyOnlyPlan) {
              variant = 'default';
            }

            let thoughtContent = record.thought;
            let planContent = record.execution_plan;
            let hasThought = Boolean(thoughtContent);
            let hasPlan = planContent && planContent.length > 0;

            if (!hasThought || !hasPlan) {
              if (variant === 'gradient') {
                const contextMeta = extractContextMetadata(records, record);
                if (!hasThought && contextMeta.thought) {
                  thoughtContent = contextMeta.thought;
                  hasThought = true;
                }
                if (!hasPlan && contextMeta.plan) {
                  planContent = contextMeta.plan;
                  hasPlan = Boolean(planContent && planContent.length > 0);
                }
              }
            }
            if (!hasThought && record?.metadata?.thought) {
              thoughtContent = record.metadata.thought;
              hasThought = true;
            }
            if (!hasPlan && record?.metadata?.execution_plan) {
              planContent = record.metadata.execution_plan;
              hasPlan = Boolean(planContent && planContent.length > 0);
            }

            const hasNonReplyPlan = hasPlan && planContent.some((step) => step.command_id !== 'reply');
            const isStreamingThought = Boolean(record.isThinking);

            return (
              <article key={record?.record_id ?? idx} className="mb-3">
                {(isStreamingThought || (!isReplyOnlyPlan && (hasThought || hasPlan) && hasNonReplyPlan)) && (
                  <ThoughtProcess
                    thought={thoughtContent}
                    plan={planContent}
                    durationMs={record.durationMs}
                    isStreaming={isStreamingThought}
                    defaultExpanded={true}
                  />
                )}
                {(content || record.isSynthesizing) && (
                  <SystemResponse variant={variant} label={record.label} isSynthesizing={Boolean(record.isSynthesizing)}>
                    {content}
                  </SystemResponse>
                )}
              </article>
            );
          })}
          {isThinking && <aside className="text-muted small">Thinking...</aside>}
        </SidebarSection>
      )}

      <section className={`px-2 ${mode === 'sidebar' ? 'mt-auto pt-2 pb-3 border-top' : 'mb-5 pb-5'}`}>
        <CognitiveEntryComponent
          itemOnAction={itemOnAction}
          canSendMessage={canSendMessage}
          setCanSendMessage={setCanSendMessage}
          entitySelected={conversation}
          autoFocus={autoFocus}
          manualInference={mode === 'sidebar'}
          commandCenterCommands={mode === 'sidebar' ? (allCommands ?? commands) : undefined}
        />
      </section>
    </>
  );
};

export default CognitiveEntryManagerComponent;
