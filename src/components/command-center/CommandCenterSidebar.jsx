import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@veripass/react-sdk';
import { useCommandCenter } from '../../features/command-center/hooks/useCommandCenter.hook';
import { fetchEntityCollection, updateEntityRecord } from '@services/utils/entityServiceAdapter';
import CommandCenterChat from './CommandCenterChat';
import CommandCenterTrigger from './CommandCenterTrigger';

const CommandCenterSidebar = ({ topOffset = 0, renderAppEmbed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [initialMessage, setInitialMessage] = useState(null);
  const [prefillEntry, setPrefillEntry] = useState(null);
  const [conversationTitle, setConversationTitle] = useState(null);

  const theme = useTheme();
  const { user } = useAuth();
  const { ConversationManagementService } = useCommandCenter() || {};

  const toggleSidebar = (value) => {
    setIsOpen(typeof value === 'boolean' ? value : !isOpen);
  };

  const openChat = (conversationId = null) => {
    if (conversationId !== undefined && conversationId !== null) {
      setActiveConversationId(conversationId);
    }
    setIsOpen(true);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setInitialMessage(null);
    setIsOpen(true);
  };

  const applyConversationStatus = async (statusKey) => {
    if (!activeConversationId || !ConversationManagementService) {
      return;
    }

    try {
      const statusResponse = await fetchEntityCollection({
        service: ConversationManagementService,
        payload: { queryselector: 'statuses' },
      });

      const statuses = statusResponse?.success ? statusResponse.result || {} : null;

      if (statuses && statuses[statusKey] != null) {
        await updateEntityRecord({
          service: ConversationManagementService,
          payload: { id: activeConversationId, status: statuses[statusKey] },
        });
      }
    } catch (error) {
      console.error('[CommandCenter] Failed to update conversation status:', error);
    }
  };

  const resetToNewConversation = () => {
    setActiveConversationId(null);
    setInitialMessage(null);
    setConversationTitle(null);
    setIsOpen(true);
  };

  React.useEffect(() => {
    if (!activeConversationId || !ConversationManagementService) {
      setConversationTitle(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetchEntityCollection({
          service: ConversationManagementService,
          payload: { queryselector: 'id', query: { search: activeConversationId } },
        });

        const item = response?.result?.items?.[0];

        if (!cancelled) {
          setConversationTitle(item?.title || null);
        }
      } catch (error) {
        if (!cancelled) {
          setConversationTitle(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, ConversationManagementService]);

  const handleDeleteConversation = async () => {
    await applyConversationStatus('deleted');
    resetToNewConversation();
  };

  const handleInactivateConversation = async () => {
    await applyConversationStatus('inactive');
    resetToNewConversation();
  };

  React.useEffect(() => {
    const handleOpenCommandCenter = (event) => {
      const detail = event.detail || {};
      const appEmbed = detail.appEmbed;

      // Modal / fullscreen embeds are owned by the host layout (LayoutBusiness),
      // not by the chat sidebar. Only command-center embeds open the chat.
      const isSidebarEmbed =
        !appEmbed || !appEmbed.app_slug || (appEmbed.launch_mode || 'command-center') === 'command-center';

      if (!isSidebarEmbed) {
        // Close the sidebar so it does not overlap with the modal.
        if (appEmbed?.launch_mode === 'modal') {
          setIsOpen(false);
        }
        return;
      }

      if (detail.startNewConversation === true) {
        setActiveConversationId(null);
      }

      if (detail.initialMessage != null) {
        setInitialMessage(detail.initialMessage);
      }

      if (detail.prefillEntry != null) {
        setPrefillEntry(detail.prefillEntry);
      }

      openChat(detail.conversationId ?? undefined);

      if (!appEmbed?.app_slug) return;

      // Forward to CognitiveEntryManager so the embed shows up inside the chat.
      const embedDetail = {
        appSlug: appEmbed.app_slug,
        routePath: appEmbed.route_path || '/',
        inputPayload: appEmbed.input_payload || {},
        parentSessionId: null,
        viewState: null,
      };

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('sommatic:app:create-embed-from-escalation', { detail: embedDetail }),
        );
      }, 0);
    };

    window.addEventListener('sommatic:open-command-center', handleOpenCommandCenter);

    return () => {
      window.removeEventListener('sommatic:open-command-center', handleOpenCommandCenter);
    };
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('sommatic:command-center-opened'));
    } else {
      window.dispatchEvent(new CustomEvent('sommatic:command-center-closed'));
    }
  }, [isOpen]);

  return (
    <>
      <CommandCenterChat
        isOpen={isOpen}
        onClose={() => toggleSidebar(false)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onInactivateConversation={handleInactivateConversation}
        activeConversationId={activeConversationId}
        conversationTitle={conversationTitle}
        onConversationChange={openChat}
        borderColor={theme.palette.divider}
        bgColor={theme.palette.background.default}
        user={user}
        topOffset={topOffset}
        initialMessage={initialMessage}
        onInitialMessageSent={() => setInitialMessage(null)}
        renderAppEmbed={renderAppEmbed}
        prefillEntry={prefillEntry}
        onPrefillConsumed={() => setPrefillEntry(null)}
      />

      <CommandCenterTrigger isOpen={isOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default CommandCenterSidebar;
