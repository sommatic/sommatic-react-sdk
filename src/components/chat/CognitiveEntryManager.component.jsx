import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@veripass/react-sdk';

import { ConversationManagementService, ConversationExecutionService } from '@services';
import { createEntityRecord, fetchEntityCollection } from '@services/utils/entityServiceAdapter';
import ChatBubble from './ChatBubble.component';
import SystemResponse from './SystemResponse.component';
import CognitiveEntryComponent from './CognitiveEntry.component';
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
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [records, setRecords] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [conversation, setConversation] = useState(null);

  // Sidebar-specific logic: Fetch conversation if ID is provided
  useEffect(() => {
    if (mode === 'sidebar' && initialConversationId) {
      if (conversation?.id === initialConversationId) return;

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
      // Reset for new conversation
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

    setRecords((prev) => [...prev, { role: 'user', content: messageContent }]);
    setIsThinking(true);
    setCanSendMessage(false);

    try {
      let currentConversationId = conversation?.id || '';

      // 1. Create conversation ONLY if it doesn't wait
      if (!currentConversationId) {
        const createPayload = {
          organization_id: user?.payload?.organization_id,
          title: messageContent.length > 80 ? `${messageContent.slice(0, 80)}...` : messageContent,
          memory_strategy: { name: 'full-history' },
          memory_window_size: 20,
          conversation_records: [],
          ...createContext, // Merge optional context (e.g. project_id)
        };

        const createResponse = await createEntityRecord({
          service: ConversationManagementService,
          payload: createPayload,
        });

        if (createResponse?.success && createResponse?.result?.id) {
          currentConversationId = createResponse.result.id;
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      // 2. Execute Inference
      const payload = {
        organization_id: user?.payload?.organization_id || '',
        conversation_id: currentConversationId,
        llm_provider_id: provider?.id || '',
        message: { text: messageContent },
        attachments: attachments,
      };

      const response = await new ConversationExecutionService().execute(payload);

      if (response?.success) {
        // Success! We have a new conversation ID and a response.
        const result = response.result;
        const newConversationId = result.conversation_id;
        const output = result.output;

        // If we weren't already in a conversation (or if we just created one), update local state
        if (newConversationId && (!conversation || conversation.id !== newConversationId)) {
          const convResponse = await fetchEntityCollection({
            service: ConversationManagementService,
            payload: {
              queryselector: 'id',
              query: { search: newConversationId },
            },
          });
          if (convResponse?.result?.items?.length) {
            setConversation(convResponse.result.items[0]);
            onConversationChange?.(newConversationId);
          }
        }

        if (output) {
          setRecords((prev) => [...prev, output]);
        }
      } else {
        // Handle error (e.g., using a snackbar or alert)
        console.error(response?.message || 'Error executing inference');
      }
    } catch (e) {
      console.error(e);
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
        if (entity) setRecords((prev) => [...prev, entity]);
        break;
      case 'cognitive-entry::on-inference-error':
        setIsThinking(false);
        setCanSendMessage(true);
        break;
      case 'cognitive-entry::on-inference-success':
        setIsThinking(false);
        setCanSendMessage(true);
        if (entity?.result?.output) {
          setRecords((prev) => [...prev, entity.result.output]);
        }
        break;
      default:
        break;
    }
  };

  const itemOnAction = async (action, entity) => {
    switch (action) {
      case 'cognitive-entry::on-message':
        if (mode === 'sidebar') {
          await handleSidebarMessage(entity);
        } else {
          // entity is now { query, provider }
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
            if (!content) return null;

            return role === 'user' ? (
              <div key={idx} className="d-flex justify-content-end mb-3">
                <ChatBubble role="user">{String(content)}</ChatBubble>
              </div>
            ) : (
              <div key={idx} className="mb-3">
                <SystemResponse>{String(content)}</SystemResponse>
              </div>
            );
          })}
          {isThinking && <div className="text-muted small">Thinking...</div>}
        </SidebarSection>
      )}

      <section className={`px-2 ${mode === 'sidebar' ? 'mt-auto pt-2 pb-3 border-top' : 'mb-5 pb-5'}`}>
        <CognitiveEntryComponent
          itemOnAction={itemOnAction}
          canSendMessage={canSendMessage}
          setCanSendMessage={setCanSendMessage}
          entitySelected={conversation}
          autoFocus={autoFocus}
        />
      </section>
    </>
  );
};

export default CognitiveEntryManagerComponent;
