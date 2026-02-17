import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CognitiveEntryManagerComponent from '@components/chat/CognitiveEntryManager.component';
import styled from 'styled-components';

export const drawerWidth = 400;

const HeaderContainer = styled.div`
  border-bottom: 1px solid ${({ $borderColor }) => $borderColor};
  background-color: ${({ $bgcolor }) => $bgcolor};
`;

const ChatContainer = styled.aside`
  width: ${drawerWidth}px;
  flex-shrink: 0;
  position: sticky;
  top: 70px;
  height: calc(${({ $isFooterVisible }) => ($isFooterVisible ? '93vh' : '100vh')} - 70px);
  border-left: 1px solid ${({ $borderColor }) => $borderColor};
  background-color: ${({ $bgcolor }) => $bgcolor};
  display: flex;
  flex-direction: column;
  transition: all 225ms cubic-bezier(0, 0, 0.2, 1) 0ms;
`;

const CommandCenterChat = ({
  isOpen,
  onClose,
  onNewChat,
  activeConversationId,
  onConversationChange,
  borderColor,
  bgColor,
  footerSelector = '.footer-container',
}) => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footerElement = document.querySelector(footerSelector);

    if (!footerElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(footerElement);

    return () => {
      observer.unobserve(footerElement);
    };
  }, [footerSelector]);

  if (!isOpen) {
    return null;
  }

  return (
    <ChatContainer $borderColor={borderColor} $bgcolor={bgColor} $isFooterVisible={isFooterVisible}>
      <HeaderContainer
        $borderColor={borderColor}
        $bgcolor={bgColor}
        className="d-flex align-items-center justify-content-between px-3 py-2"
      >
        <h6 className="m-0">Command Center</h6>
        <div>
          <Tooltip title="New chat" arrow>
            <IconButton size="small" aria-label="new chat" onClick={onNewChat}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close center" arrow>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </HeaderContainer>

      <div className="flex-grow-1 p-0 overflow-hidden d-flex flex-column">
        <CognitiveEntryManagerComponent
          mode="sidebar"
          initialConversationId={activeConversationId}
          onConversationChange={onConversationChange}
          autoFocus={true}
        />
      </div>
    </ChatContainer>
  );
};

export default CommandCenterChat;
