import React, { useState, useEffect } from 'react';
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
`;

const CognitiveEntryManagerComponent = ({
  mode = 'default',
  initialConversationId = null,
  onConversationChange,
  createContext = {},
  autoFocus = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { executeIntent, ConversationManagementService, executionService, defaultProviderId, commands } = useCommandCenter();
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [records, setRecords] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState(null);

  useEffect(() => {
    if (mode === 'sidebar' && initialConversationId) {
      if (conversation?.id === initialConversationId) {
        return;
      }

      const fetchConversation = async () => {
        const response = await ConversationManagementService.get({
          payload: {
            queryselector: 'id',
            query: { search: initialConversationId },
          },
        });

        if (response?.success && response?.result?.items?.length) {
          const conv = response.result.items[0];
          setConversation(conv);
          setRecords(conv.conversation_records || []);
        }
      };
      fetchConversation();
    } else if (mode === 'sidebar' && !initialConversationId) {
      setRecords([]);
      setConversation(null);
    }
  }, [mode, initialConversationId]);

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

        if (createResponse?.success && createResponse?.result?.id) {
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
        } else {
          console.error('Failed to create conversation for intent execution');
        }
      }

      try {
        const intentResult = await executeIntent(messageContent, currentConversationId, organizationId);
        if (intentResult) {
          const { plan, results, thought } = intentResult;

          if (results && results.length > 0) {
            const targetProviderId = entity.provider?.id || defaultProviderId;

            const synthesisPayload = {
              organization_id: organizationId,
              conversation_id: currentConversationId,
              llm_provider_id: targetProviderId || '',
              message: {
                text: `Context obtained from command execution:\n${JSON.stringify(results, null, 2)}\n\nOriginal User Query: "${messageContent}"\n\nPlease respond to the user based on this context. YOU MUST RESPOND IN SPANISH.`,
              },
            };

            if (targetProviderId) {
              setIsThinking(true);
              const synthesisResponse = await executionService.execute(synthesisPayload);

              if (synthesisResponse?.success) {
                const output = synthesisResponse.result?.output;
                if (output) {
                  let finalText = output.content?.text || output.text;
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

                  const displayRecord = {
                    ...output,
                    content: { ...output.content, text: finalText },
                  };

                  const hasActualCommands = results.some((result) => result.command !== 'reply');
                  const variant = hasActualCommands ? 'gradient' : 'default';

                  const labels = results
                    .map((result) => {
                      const cmdDef = (commands || []).find((command) => command.id === result.command);
                      return cmdDef?.label || result.command;
                    })
                    .filter((label) => label !== 'reply' && label !== 'Reply');

                  setRecords((prevRecords) => [
                    ...prevRecords,
                    {
                      ...displayRecord,
                      variant,
                      label: labels.join(', '),
                      execution_plan: plan,
                      thought: thought,
                    },
                  ]);
                }
              }
            }
          }

          return;
        }
      } catch (intentError) {
        console.warn('Command Center Intent failed, falling back to chat.', intentError);
      }

      const payload = {
        organization_id: organizationId,
        conversation_id: currentConversationId,
        llm_provider_id: provider?.id || '',
        message: { text: messageContent },
        attachments: attachments,
      };

      const response = await executionService.execute(payload);

      if (response?.success) {
        const result = response.result;
        const output = result.output;

        if (output) {
          setRecords((prevRecords) => [...prevRecords, { ...output, variant: 'default' }]);
        }
      } else {
        console.error(response?.message || 'Error executing inference');
      }
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
        if (entity) {
          setRecords((prevRecords) => [...prevRecords, entity]);
        }
        break;
      case 'cognitive-entry::on-inference-error':
        setIsThinking(false);
        setCanSendMessage(true);
        break;
      case 'cognitive-entry::on-inference-success':
        setIsThinking(false);
        setCanSendMessage(true);
        if (entity?.result?.output) {
          setRecords((prevRecords) => [...prevRecords, { ...entity.result.output, variant: 'default' }]);
        }
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
          {records.map((record, idx) => {
            const role = record.role?.name || record.role || 'system';
            const content = record.content?.text || record.content || '';
            if (!content) {
              return null;
            }

            return role === 'user' ? (
              <article key={idx} className="d-flex justify-content-end mb-3">
                <ChatBubble role="user">{String(content)}</ChatBubble>
              </article>
            ) : (
              <article key={idx} className="mb-3">
                {record.thought && record.execution_plan && record.execution_plan.some((step) => step.command_id !== 'reply') && (
                  <ThoughtProcess thought={record.thought} plan={record.execution_plan} durationMs={record.usage?.latency_ms} />
                )}
                <SystemResponse variant={record.variant || 'default'} label={record.label}>
                  {String(content)}
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
        />
      </section>
    </>
  );
};

export default CognitiveEntryManagerComponent;
