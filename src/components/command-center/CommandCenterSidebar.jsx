import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@veripass/react-sdk';
import CommandCenterChat from './CommandCenterChat';
import CommandCenterTrigger from './CommandCenterTrigger';

const CommandCenterSidebar = ({ topOffset = 0, renderAppEmbed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [initialMessage, setInitialMessage] = useState(null);

  const theme = useTheme();
  const { user } = useAuth();

  const toggleSidebar = (value) => {
    setIsOpen(typeof value === 'boolean' ? value : !isOpen);
  };

  const openChat = (conversationId = null) => {
    if (conversationId !== undefined && conversationId !== null) {
      setActiveConversationId(conversationId);
    }
    setIsOpen(true);
  };

  React.useEffect(() => {
    const handleOpenCommandCenter = (event) => {
      const detail = event.detail || {};
      const appEmbed = detail.appEmbed;

      // Modal / fullscreen embeds are owned by the host layout (LayoutBusiness),
      // not by the chat sidebar. Only command-center embeds open the chat.
      const isSidebarEmbed =
        !appEmbed || !appEmbed.app_slug || (appEmbed.launch_mode || 'command-center') === 'command-center';

      if (!isSidebarEmbed) return;

      if (detail.initialMessage != null) {
        setInitialMessage(detail.initialMessage);
        setActiveConversationId(null);
      }

      openChat(detail.conversationId ?? null);

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
        onNewChat={() => openChat(null)}
        activeConversationId={activeConversationId}
        onConversationChange={openChat}
        borderColor={theme.palette.divider}
        bgColor={theme.palette.background.default}
        user={user}
        topOffset={topOffset}
        initialMessage={initialMessage}
        onInitialMessageSent={() => setInitialMessage(null)}
        renderAppEmbed={renderAppEmbed}
      />

      <CommandCenterTrigger isOpen={isOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default CommandCenterSidebar;
