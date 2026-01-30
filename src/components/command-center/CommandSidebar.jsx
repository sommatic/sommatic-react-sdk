import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@veripass/react-sdk';
import CommandChat from './CommandChat';
import CommandCenterTrigger from './CommandCenterTrigger';

import styled from 'styled-components';

const ContentWrapper = styled.div`
  min-width: 0;
`;

const CommandSidebar = ({ children, footerRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const theme = useTheme();
  const { user } = useAuth();

  const toggleSidebar = (value) => {
    setIsOpen(typeof value === 'boolean' ? value : !isOpen);
  };

  const openChat = (conversationId = null) => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
    setIsOpen(true);
  };

  React.useEffect(() => {
    const handleOpenCommandCenter = (event) => {
      openChat(event.detail?.conversationId);
    };

    window.addEventListener('sommatic:open-command-center', handleOpenCommandCenter);

    return () => {
      window.removeEventListener('sommatic:open-command-center', handleOpenCommandCenter);
    };
  }, []);

  return (
    <>
      <div className="d-flex flex-row flex-grow-1">
        <ContentWrapper className="d-flex flex-column flex-grow-1">{children}</ContentWrapper>

        <CommandChat
          isOpen={isOpen}
          onClose={() => toggleSidebar(false)}
          onNewChat={() => openChat(null)}
          activeConversationId={activeConversationId}
          onConversationChange={openChat}
          borderColor={theme.palette.divider}
          bgColor={theme.palette.background.default}
          user={user}
        />
      </div>

      <CommandCenterTrigger isOpen={isOpen} toggleSidebar={toggleSidebar} footerRef={footerRef} />
    </>
  );
};

export default CommandSidebar;
