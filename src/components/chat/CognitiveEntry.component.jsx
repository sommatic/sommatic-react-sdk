import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '@veripass/react-sdk';

const VisuallyHiddenInput = styled('input')({
  display: 'none',
});

const StyledInsertDriveFileIcon = styled(InsertDriveFileIcon)`
  color: #e53935;
`;

const StyledImageIcon = styled(ImageIcon)`
  margin-right: 8px;
`;

const StyledDescriptionIcon = styled(DescriptionIcon)`
  margin-right: 8px;
`;

import { Autocomplete, TextField, Fab, IconButton, Button, Menu, MenuItem } from '@mui/material';
import { TextEditor, serializeToMarkdown } from '@link-loom/react-sdk';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StopIcon from '@mui/icons-material/Stop';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { LlmProviderService, ConversationExecutionService } from '@services';

import { fetchEntityCollection, fetchMultipleEntities, updateEntityRecord } from '@services/utils/entityServiceAdapter';

import './styles.css';

const StyledFab = styled(Fab)`
  background-color: #3a2e4f !important;
  color: white !important;

  &:hover {
    background-color: #5d4a7dff !important;
  }

  &.Mui-disabled {
    color: var(--mui-palette-action-disabled, rgba(0, 0, 0, 0.26)) !important;
    box-shadow: var(--mui-shadows-0, none) !important;
    background-color: var(--mui-palette-action-disabledBackground, rgba(0, 0, 0, 0.12)) !important;
  }
  &.Mui-disabled {
    color: var(--mui-palette-action-disabled, rgba(0, 0, 0, 0.26)) !important;
    box-shadow: var(--mui-shadows-0, none) !important;
    background-color: var(--mui-palette-action-disabledBackground, rgba(0, 0, 0, 0.12)) !important;
  }
`;

const AttachmentPreviewContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 16px;
  padding-bottom: 0;
`;

const AttachmentCard = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  padding: 4px;
  min-width: 120px;
  max-width: 200px;
  height: 60px;

  &.image-card {
    border: none;
    overflow: hidden;
    background: transparent;

    img {
      height: 60px;
      width: auto;
      border-radius: 8px;
      object-fit: cover;
    }
  }

  &.doc-card {
    padding: 8px;
    gap: 8px;

    .doc-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;

      span.fname {
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      span.ftype {
        font-size: 0.65rem;
        color: #666;
        text-transform: uppercase;
      }
    }
  }

  .remove-btn {
    position: absolute;
    top: -6px;
    right: -6px;
    background: white;
    border-radius: 50%;
    padding: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 10;

    &:hover {
      background: #eee;
    }

    svg {
      font-size: 14px;
      color: #333;
    }
  }
`;

function CognitiveEntryComponent({
  entitySelected,
  itemOnAction,
  setIsOpen,
  isPopupContext,
  canSendMessage,
  setCanSendMessage,
  autoExecutePrompt,
  projectId, // New prop
  fullWidth = false, // New prop
}) {
  // Hooks
  const { user: authUser } = useAuth();

  // Models
  const [query, setQuery] = useState('');
  const [queryJson, setQueryJson] = useState(null);
  const [providers, setProviders] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [anchorMenu, setAnchorMenu] = React.useState(null);
  const [anchorAddMenu, setAnchorAddMenu] = React.useState(null);
  const [modelSelected, setModelSelected] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isEmptyEntities, setIsEmptyEntities] = useState(false);

  const hasAutoExecutedRef = useRef(false);
  const abortControllerRef = useRef(null); // Ref for canceling requests

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Configs
  const isOpenMenu = Boolean(anchorMenu);
  const isOpenAddMenu = Boolean(anchorAddMenu);

  // Component Functions
  const handleSubmit = async (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    if (!canSendMessage) {
      handleStop();
      return;
    }

    // Prevent empty messages
    if (!query?.trim() && attachments.length === 0) {
      return;
    }

    if (!entitySelected && canSendMessage) {
      let finalQuery = query;
      if (queryJson) {
        finalQuery = serializeToMarkdown(queryJson);
      }

      itemOnAction?.('cognitive-entry::on-message', {
        query: finalQuery,
        provider: modelSelected,
        attachments,
        projectId, // Pass projectId
      });
    } else if (entitySelected && canSendMessage) {
      itemOnAction?.('cognitive-entry::on-inference-start', query);

      executeInference();
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Force UI state reset manually just in case
    // Note: The catch block in executeInference acts as the primary handler
    itemOnAction?.('cognitive-entry::on-inference-error', { message: 'Generation stopped by user' });
  };

  const handleAddMenuClick = (event) => {
    setAnchorAddMenu(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAnchorAddMenu(null);
  };

  const handleFileSelect = async (event, type) => {
    handleAddMenuClose();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Basic size validation for client-side feedback (4MB safe limit)
    if (file.size > 4 * 1024 * 1024) {
      alert('El archivo es demasiado grande (Máximo 4MB). Por favor selecciona un archivo más pequeño.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result; // Base64
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          type: file.type,
          content: content,
          isImage: type === 'image',
        },
      ]);
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModelMenuClick = (event) => {
    setAnchorMenu(event.currentTarget);
  };
  const handleModelCloseMenuClick = () => {
    setAnchorMenu(null);
  };

  const executeInference = async (overrideQuery, initialState = {}) => {
    let currentQuery = overrideQuery || query;

    // If we are sending the current user input (no override) and have JSON, convert to Markdown
    if (!overrideQuery && queryJson) {
      currentQuery = serializeToMarkdown(queryJson);
    }

    const attemptRecord = {
      record_id: `temp-${Date.now()}`,
      role: { name: 'user', title: 'User' },
      content_kind: { name: 'text', title: 'Text' },
      content: { text: currentQuery },
      metadata: { attachments: attachments },
    };
    itemOnAction?.('cognitive-entry::on-inference-attempt', attemptRecord);
    setQuery('');
    setQueryJson(null);

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Scalable solution: initialState defaults to empty. If auto-execute, accepts full context.
    const payload = {
      organization_id: authUser?.payload?.organization_id || '',
      conversation_id: entitySelected?.id || '',
      llm_provider_id: modelSelected?.id || '',
      message: { text: currentQuery },
      attachments: attachments, // Pass attachments to payload
      project_id: projectId, // Include project_id in execution
      ...initialState,
    };

    // Clear attachments UI immediately after sending
    setAttachments([]);

    try {
      const inferenceResponse = await new ConversationExecutionService().execute(payload, signal);

      if (!inferenceResponse || !inferenceResponse.success) {
        itemOnAction?.('cognitive-entry::on-inference-error', inferenceResponse);
        return;
      }

      itemOnAction?.('cognitive-entry::on-inference-success', inferenceResponse);
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        console.log('Inference canceled by user');
        itemOnAction?.('cognitive-entry::on-inference-error', { message: 'Generation stopped' });
      } else if (
        (error.response && error.response.status === 413) ||
        (error.message && error.message.toLowerCase().includes('payload too large')) ||
        (error.response && typeof error.response.data === 'string' && error.response.data.includes('PayloadTooLargeError'))
      ) {
        console.error('Payload too large:', error);
        itemOnAction?.('cognitive-entry::on-inference-error', {
          message:
            'El archivo adjunto es demasiado grande para ser procesado por el servidor. Intenta enviarlo comprimido o elige un archivo más pequeño.',
        });
      } else {
        console.error(error);
        itemOnAction?.('cognitive-entry::on-inference-error', { message: 'An unexpected error occurred' });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const initializeComponent = async () => {
    const [providers] = await fetchMultipleEntities([
      {
        service: LlmProviderService,
        payload: {
          queryselector: 'all',
          exclude_status: 'deleted',
          search: '',
          page: 1,
          pageSize: 50,
        },
      },
    ]);
    setLoading(false);

    if (!providers?.success || !providers?.result?.items?.length) {
      setIsEmptyEntities(true);
      setLoading(false);

      if (setCanSendMessage) {
        setCanSendMessage(false);
      }
      return;
    }

    const items = providers?.result?.items || [];
    setProviders(items);

    if (!modelSelected) {
      const autoProviderId = autoExecutePrompt?.context?.llm_provider_id;
      const targetProvider = autoProviderId ? items.find((p) => p.id === autoProviderId) : null;

      setModelSelected(targetProvider || items[0]);
    }

    if (setCanSendMessage) {
      setCanSendMessage(true);
    }
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (entitySelected?.id && autoExecutePrompt?.prompt && !hasAutoExecutedRef.current) {
      hasAutoExecutedRef.current = true;
      itemOnAction?.('cognitive-entry::on-inference-start', autoExecutePrompt.prompt);

      const executionContext = autoExecutePrompt.context || {};

      executeInference(autoExecutePrompt.prompt, executionContext);
    }
  }, [entitySelected, autoExecutePrompt]);

  return (
    <section className="banner-search-form-wrapper">
      <form
        onSubmit={(e) => {
          handleSubmit(e);
        }}
        autoComplete="off"
        className={`banner-search-form d-flex flex-column ${fullWidth ? 'w-100 mw-100' : ''}`}
      >
        {/* Hidden Inputs */}
        <VisuallyHiddenInput
          type="file"
          ref={imageInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <VisuallyHiddenInput
          type="file"
          ref={fileInputRef}
          accept="application/pdf,text/plain,text/csv,min,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => handleFileSelect(e, 'document')}
        />

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <AttachmentPreviewContainer>
            {attachments.map((file, index) => (
              <AttachmentCard key={index} className={file.isImage ? 'image-card p-0' : 'doc-card'}>
                <div className="remove-btn" onClick={() => handleRemoveAttachment(index)}>
                  <CloseIcon fontSize="small" />
                </div>
                {file.isImage ? (
                  <img src={file.content} alt={file.name} />
                ) : (
                  <>
                    <StyledInsertDriveFileIcon /> {/* Generic red icon */}
                    <div className="doc-info">
                      <span className="fname" title={file.name}>
                        {file.name}
                      </span>
                      <span className="ftype">{file.name.split('.').pop()}</span>
                    </div>
                  </>
                )}
              </AttachmentCard>
            ))}
          </AttachmentPreviewContainer>
        )}

        <section className="search-input">
          <div className="w-100 mw-100 overflow-hidden">
            <TextEditor
              id="chat-query-input"
              modelraw={encodeURIComponent(query)}
              onModelChange={(data) => {
                setQuery(decodeURIComponent(data.model));
                setQueryJson(data.json);
              }}
              // Chat mode configuration:
              autoGrow={true}
              minRows={1}
              maxRows={6}
              toolbarOptions={['bold', 'italic', 'strike', 'code', 'list']}
            />
          </div>
        </section>

        <section className="d-flex grow justify-content-between px-2 pb-2">
          <article>
            <IconButton aria-label="Add files" onClick={handleAddMenuClick}>
              <AddIcon />
            </IconButton>
            <Menu
              id="add-menu"
              anchorEl={anchorAddMenu}
              open={isOpenAddMenu}
              onClose={handleAddMenuClose}
              disableScrollLock={true}
            >
              <MenuItem onClick={() => imageInputRef.current.click()}>
                <StyledImageIcon fontSize="small" />
                Upload Image
              </MenuItem>
              <MenuItem onClick={() => fileInputRef.current.click()}>
                <StyledDescriptionIcon fontSize="small" />
                Upload File
              </MenuItem>
            </Menu>
          </article>
          <article className="d-flex gap-2">
            <section className="d-flex">
              <Button
                id="demo-customized-button"
                aria-haspopup="true"
                variant="text"
                disableElevation
                size="small"
                onClick={handleModelMenuClick}
                endIcon={<KeyboardArrowDownIcon />}
                className="my-auto text-black-50"
                sx={{ textTransform: 'none' }}
              >
                {modelSelected?.name || ''}
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorMenu}
                open={isOpenMenu}
                onClose={handleModelCloseMenuClick}
                slotProps={{
                  list: {
                    'aria-labelledby': 'basic-button',
                    dense: true,
                  },
                }}
                disableScrollLock={true}
              >
                {providers.map((provider) => (
                  <MenuItem
                    key={provider.id}
                    selected={provider.id === modelSelected?.id}
                    onClick={() => {
                      setModelSelected(provider);
                      handleModelCloseMenuClick();
                    }}
                  >
                    {provider.name || provider.model_identifier || 'Provider'}
                  </MenuItem>
                ))}
              </Menu>
            </section>
            <section>
              <StyledFab
                size="small"
                aria-label={!canSendMessage ? 'stop' : 'send'}
                onClick={(e) => {
                  if (!canSendMessage) {
                    e.preventDefault();
                    handleStop();
                  }
                }}
                disabled={false} // Always enabled to allow stopping
                type={!canSendMessage ? 'button' : 'submit'}
              >
                {!canSendMessage ? <StopIcon /> : <ArrowUpwardIcon />}
              </StyledFab>
            </section>
          </article>
        </section>
      </form>
    </section>
  );
}

export default CognitiveEntryComponent;
