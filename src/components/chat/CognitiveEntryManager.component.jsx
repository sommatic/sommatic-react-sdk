import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@veripass/react-sdk';

import { createEntityRecord, fetchEntityCollection } from '@services/utils/entityServiceAdapter';
import ChatBubble from './ChatBubble.component';
import SystemResponse from './SystemResponse.component';
import ThoughtProcess from './ThoughtProcess.component';
import CognitiveEntryComponent from './CognitiveEntry.component';
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
      if (depth === 0) return str.substring(start, i + 1);
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
      if (!jsonPart) return true;

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

const CognitiveEntryManagerComponent = ({
  mode = 'default',
  initialConversationId = null,
  onConversationChange,
  createContext = {},
  autoFocus = false,
  initialMessage = null,
  onInitialMessageSent,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { executeIntent, ConversationManagementService, executionService, defaultProviderId, commands, allCommands, providers } =
    useCommandCenter();
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [records, setRecords] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState(null);
  const initialMessageSentRef = useRef(false);

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
      setRecords(conv.conversation_records || []);
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

  const handleConversationIntent = ({ query, provider, conversation }) => {
    const path = conversation?.id ? `/admin/chat/conversation/${conversation.id}` : `/admin/chat/conversation`;

    navigate(path, {
      state: {
        autoExecute: true,
        prompt: query,
        llm_provider_id: provider?.id,
      },
    });
  };

  const handleSidebarMessage = async (entity) => {
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
          onPlanReceived: ({ plan, thought }) => {
            setRecords((prev) => [
              ...prev,
              {
                role: 'system',
                thought,
                execution_plan: plan,
                variant: 'default',
                content: '',
                isThinking: true,
              },
            ]);
            setIsThinking(false);
          },
          onProgress: (updatedPlan) => {
            setRecords((prev) => {
              const newRecords = [...prev];
              const lastIndex = newRecords.length - 1;
              if (lastIndex >= 0 && newRecords[lastIndex].isThinking) {
                newRecords[lastIndex] = {
                  ...newRecords[lastIndex],
                  execution_plan: updatedPlan,
                };
              }
              return newRecords;
            });
          },
        });

        if (!intentResult) {
          console.info('No intent result');
        } else {
          const { plan, results, thought } = intentResult;

          if (!results || results.length === 0) {
            console.info('No results');
            return;
          }

          const hasActualCommands = results.some((result) => result.command !== 'reply');

          if (!hasActualCommands) {
            const replyResult = results.find((result) => result.command === 'reply');
            const replyText = replyResult?.result?.text || '';

            setRecords((prevRecords) => {
              const newRecords = [...prevRecords];
              const lastIndex = newRecords.length - 1;

              const displayRecord = {
                role: 'assistant',
                content: { text: replyText },
                thought: thought,
                execution_plan: plan,
                variant: 'default',
                isThinking: false,
              };

              if (lastIndex >= 0 && newRecords[lastIndex].isThinking) {
                newRecords[lastIndex] = {
                  ...newRecords[lastIndex],
                  ...displayRecord,
                };
                return newRecords;
              } else {
                return [...prevRecords, displayRecord];
              }
            });

            setIsThinking(false);
            setCanSendMessage(true);
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

          setIsThinking(true);
          const synthesisResponse = await executionService.execute(synthesisPayload);

          if (!synthesisResponse?.success) {
            resolveLastThinkingRecord('The commands ran successfully but the synthesis response failed.');
            return;
          }

          const output = synthesisResponse.result?.output;
          if (!output) {
            resolveLastThinkingRecord('The commands ran successfully but no output was returned.');
            return;
          }

          let finalText = output.content?.text ?? output.text;
          if (typeof finalText !== 'string') {
            finalText = finalText !== undefined ? JSON.stringify(finalText, null, 2) : '';
          } else {
            try {
              if (finalText.trim().startsWith('{')) {
                const parsed = JSON.parse(finalText);
                if (parsed.message) {
                  finalText = parsed.message;
                } else if (parsed.text) {
                  finalText = parsed.text;
                }
              }
            } catch (error) {
              console.error('Failed to parse JSON', error);
            }
          }

          if (!finalText) {
            resolveLastThinkingRecord('Commands executed successfully.');
            return;
          }

          const displayRecord = {
            ...output,
            content: { ...output.content, text: finalText },
          };

          const variant = 'gradient';

          const labels = results
            .map((result) => {
              const cmdDef = (commands || []).find((command) => command.id === result.command);
              return cmdDef?.label || result.command;
            })
            .filter((label) => label !== 'reply' && label !== 'Reply');

          setRecords((prevRecords) => {
            const newRecords = [...prevRecords];
            const lastIndex = newRecords.length - 1;

            const updatedRecord = {
              ...displayRecord,
              variant,
              label: labels.join(', '),
              execution_plan: plan,
              thought: thought,
            };

            if (lastIndex >= 0 && newRecords[lastIndex].isThinking) {
              newRecords[lastIndex] = {
                ...newRecords[lastIndex],
                ...updatedRecord,
                isThinking: false,
              };
              return newRecords;
            } else {
              return [...prevRecords, updatedRecord];
            }
          });

          return;
        }
      } catch (intentError) {
        console.warn('Command Center Intent failed, falling back to chat.', intentError);
        setRecords((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.isThinking) {
            return prev.slice(0, -1);
          }
          return prev;
        });
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
        <SidebarSection className="flex-grow-1 overflow-auto p-3 d-flex flex-column">
          {records.filter(isValidRecord).map((record, idx) => {
            const roleName = record.role?.name ?? record.role ?? 'system';
            const rawContent = record.content?.text ?? record.content ?? '';
            let content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent, null, 2);

            const replyOnlyText = extractReplyOnlyPlanText(roleName, record.content?.text ?? record.content);
            const isReplyOnlyPlan = Boolean(replyOnlyText);
            if (isReplyOnlyPlan) {
              content = replyOnlyText;
            }

            if (!content) {
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

            return (
              <article key={record?.record_id ?? idx} className="mb-3">
                {!isReplyOnlyPlan && (hasThought || hasPlan) && hasNonReplyPlan && (
                  <ThoughtProcess
                    thought={thoughtContent}
                    plan={planContent}
                    durationMs={record.usage?.latency_ms}
                    defaultExpanded={false}
                  />
                )}
                <SystemResponse
                  variant={variant}
                  label={record.label}
                  isSynthesizing={record.isSynthesizing}
                >
                  {content}
                </SystemResponse>
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
