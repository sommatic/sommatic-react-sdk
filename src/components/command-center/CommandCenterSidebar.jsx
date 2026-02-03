import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@veripass/react-sdk';
import CommandCenterChat from './CommandCenterChat';
import CommandCenterTrigger from './CommandCenterTrigger';

const CommandCenterSidebar = () => {
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
      <CommandCenterChat
        isOpen={isOpen}
        onClose={() => toggleSidebar(false)}
        onNewChat={() => openChat(null)}
        activeConversationId={activeConversationId}
        onConversationChange={openChat}
        borderColor={theme.palette.divider}
        bgColor={theme.palette.background.default}
        user={user}
      />

      <CommandCenterTrigger isOpen={isOpen} toggleSidebar={toggleSidebar} />
    </>
  );
};

export default CommandCenterSidebar;
