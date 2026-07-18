import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Dialog, Button, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LensBlurIcon from '@mui/icons-material/LensBlur';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import CognitiveEntryManagerComponent from '@components/chat/CognitiveEntryManager.component';
import styled, { keyframes } from 'styled-components';

export const drawerWidth = 400;

// Mirrors bsh.sommatic.client.webapp/src/constants/theme.js so the conversation
// dialogs match the platform's Delete/Inactivate modals exactly.
const THEME = {
  errorDark: '#9F1239',
  warning: '#F59E0B',
  warningDark: '#92400E',
  textSecondary: '#6B7280',
  bodyText: '#4B5563',
  linkColor: '#0d6efd',
};

const HeaderContainer = styled.div`
  border-bottom: 1px solid ${({ $borderColor }) => $borderColor};
  background-color: ${({ $bgcolor }) => $bgcolor};
`;

const FOOTER_HEIGHT = '64px';

const Spacer = styled.div`
  width: ${drawerWidth}px;
  flex-shrink: 0;
`;

const ChatContainer = styled.aside`
  width: ${drawerWidth}px;
  right: 0;
  top: ${({ $topOffset }) => $topOffset}px;
  bottom: ${({ $isFooterVisible }) => ($isFooterVisible ? FOOTER_HEIGHT : '0px')};
  z-index: 1400;
  border-left: 1px solid ${({ $borderColor }) => $borderColor};
  background-color: ${({ $bgcolor }) => $bgcolor};
  transition: all 225ms cubic-bezier(0, 0, 0.2, 1) 0ms;
  /* Match the platform UI type system (MUI theme) instead of the template
     body's Roboto — otherwise the whole panel reads as a foreign app. */
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 0.8rem;
`;

const HeaderTitle = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
`;

// The brand mark lives in the empty-state hero; once a conversation starts the
// hero goes away and the mark migrates up here with a soft entrance.
const brandMarkEnter = keyframes`
  from {
    opacity: 0;
    transform: scale(0.4);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: #7c3aed;
  animation: ${brandMarkEnter} 380ms cubic-bezier(0.34, 1.3, 0.64, 1);
`;

const segmentButtonSx = {
  flex: 1,
  minWidth: 0,
  fontSize: 11,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  fontWeight: 500,
  color: THEME.linkColor,
  borderRadius: 0,
  px: 1,
  py: 0.75,
};

const CommandCenterChat = ({
  isOpen,
  onClose,
  onNewChat,
  onDeleteConversation,
  onInactivateConversation,
  activeConversationId,
  conversationTitle,
  onConversationChange,
  borderColor,
  bgColor,
  footerSelector = '.footer-container',
  topOffset = 0,
  initialMessage = null,
  onInitialMessageSent,
  renderAppEmbed,
  prefillEntry = null,
  onPrefillConsumed,
  conversationBasePath = '/client/chat/conversation',
}) => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [busy, setBusy] = useState(false);

  const hasConversation = Boolean(activeConversationId);
  const isDeleteDialog = activeDialog === 'delete';

  const conversationUrl = (relative) => {
    const path = `${conversationBasePath}/${activeConversationId}`;
    return relative ? path : `${window.location.origin}${path}`;
  };

  const openMenu = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleCopyId = () => {
    if (activeConversationId) {
      try {
        navigator.clipboard.writeText(activeConversationId);
      } catch (error) {
        // clipboard unavailable — ignore
      }
    }
    closeMenu();
  };

  const handleCopyLink = () => {
    if (activeConversationId) {
      try {
        navigator.clipboard.writeText(conversationUrl(false));
      } catch (error) {
        // clipboard unavailable — ignore
      }
    }
    closeMenu();
  };

  const handleNewTab = () => {
    if (activeConversationId) {
      window.open(conversationUrl(true), '_blank', 'noopener');
    }
    closeMenu();
  };

  const openDialog = (dialog) => {
    setMenuAnchor(null);
    setActiveDialog(dialog);
  };

  const closeDialog = () => {
    if (busy) {
      return;
    }
    setActiveDialog(null);
  };

  const confirmDialog = async () => {
    const action = isDeleteDialog ? onDeleteConversation : onInactivateConversation;

    if (!action) {
      setActiveDialog(null);
      return;
    }

    try {
      setBusy(true);
      await action();
    } finally {
      setBusy(false);
      setActiveDialog(null);
    }
  };

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
    <>
      <Spacer />
      <ChatContainer
        className="position-fixed overflow-hidden d-flex flex-column"
        $borderColor={borderColor}
        $bgcolor={bgColor}
        $isFooterVisible={isFooterVisible}
        $topOffset={topOffset}
      >
        <HeaderContainer
          $borderColor={borderColor}
          $bgcolor={bgColor}
          className="d-flex align-items-center justify-content-between px-3 py-2"
        >
          <div className="d-flex align-items-center" style={{ gap: 8, minWidth: 0 }}>
            {hasConversation && (
              <BrandMark>
                <LensBlurIcon fontSize="small" />
              </BrandMark>
            )}
            <HeaderTitle>Command Center</HeaderTitle>
          </div>

          <div className="d-flex align-items-center" style={{ flexShrink: 0 }}>
            {hasConversation && (
              <>
                <Tooltip title="New chat" arrow>
                  <IconButton size="small" aria-label="new chat" onClick={onNewChat}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Options" arrow>
                  <IconButton size="small" aria-label="conversation options" onClick={openMenu}>
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Close center" arrow>
              <IconButton onClick={onClose} size="small" aria-label="close">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </HeaderContainer>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ zIndex: 1500 }}
          slotProps={{ paper: { sx: { minWidth: 300, borderRadius: '10px', mt: 0.5 } } }}
        >
          <Box className="d-flex align-items-stretch" sx={{ px: 0.5 }}>
            <Button onClick={handleCopyId} sx={segmentButtonSx}>
              Copy id
            </Button>
            <Divider orientation="vertical" flexItem />
            <Button onClick={handleCopyLink} sx={segmentButtonSx}>
              Copy link
            </Button>
            <Divider orientation="vertical" flexItem />
            <Button onClick={handleNewTab} sx={segmentButtonSx}>
              New tab
            </Button>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem onClick={() => openDialog('inactivate')}>
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 32 }}>
              <PowerSettingsNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }} primary="Inactivate" />
          </MenuItem>
          <MenuItem onClick={() => openDialog('delete')} sx={{ color: THEME.errorDark }}>
            <ListItemIcon sx={{ color: THEME.errorDark, minWidth: 32 }}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }} primary="Delete" />
          </MenuItem>
        </Menu>

        <Dialog
          open={Boolean(activeDialog)}
          onClose={closeDialog}
          maxWidth="sm"
          fullWidth
          sx={{ zIndex: 1500 }}
          PaperProps={{ sx: { borderRadius: '16px', maxWidth: 560 } }}
        >
          <div style={{ padding: '20px 24px 20px' }}>
            <div className="d-flex justify-content-between align-items-start" style={{ marginBottom: 8, gap: 12 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
                {isDeleteDialog ? 'Delete Conversation' : 'Inactivate Conversation'}
              </h3>
              <IconButton
                size="small"
                aria-label="close"
                onClick={closeDialog}
                disabled={busy}
                sx={{ color: 'text.secondary', mt: '-4px', mr: '-8px' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <p style={{ fontSize: 14, color: THEME.bodyText, margin: 0 }}>
              Are you sure you want to {isDeleteDialog ? 'delete' : 'inactivate'}{' '}
              <strong>{conversationTitle || 'this conversation'}</strong>? This action cannot be undone.
            </p>
            <div className="d-flex justify-content-between align-items-center" style={{ marginTop: 24 }}>
              <Button
                onClick={closeDialog}
                disabled={busy}
                sx={{ color: THEME.textSecondary, textTransform: 'none', fontWeight: 500, borderRadius: '8px' }}
              >
                Cancel
              </Button>
              {isDeleteDialog ? (
                <Button
                  onClick={confirmDialog}
                  disabled={busy}
                  variant="contained"
                  sx={{
                    backgroundColor: THEME.errorDark,
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '8px',
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#7d0e2d' },
                  }}
                >
                  Delete
                </Button>
              ) : (
                <Button
                  onClick={confirmDialog}
                  disabled={busy}
                  sx={{
                    color: THEME.warningDark,
                    backgroundColor: `${THEME.warning}15`,
                    border: `1px solid ${THEME.warning}40`,
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: `${THEME.warning}26` },
                  }}
                >
                  Inactivate
                </Button>
              )}
            </div>
          </div>
        </Dialog>

        <div className="flex-grow-1 p-0 overflow-hidden d-flex flex-column">
          <CognitiveEntryManagerComponent
            mode="sidebar"
            initialConversationId={activeConversationId}
            onConversationChange={onConversationChange}
            autoFocus={true}
            initialMessage={initialMessage}
            onInitialMessageSent={onInitialMessageSent}
            renderAppEmbed={renderAppEmbed}
            prefillEntry={prefillEntry}
            onPrefillConsumed={onPrefillConsumed}
          />
        </div>
      </ChatContainer>
    </>
  );
};

export default CommandCenterChat;
