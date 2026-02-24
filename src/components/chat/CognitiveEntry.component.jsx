import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '@veripass/react-sdk';
import {
  Autocomplete,
  TextField,
  Fab,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { TextEditor, serializeToMarkdown } from '@link-loom/react-sdk';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StopIcon from '@mui/icons-material/Stop';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import {
  CognitiveInfrastructureLLMProviderService,
  ConversationExecutionService,
  ConversationManagementService,
} from '@services';

import { fetchMultipleEntities, updateEntityRecord } from '@services/utils/entityServiceAdapter';

import './styles.css';

const StyledInsertDriveFileIcon = styled(InsertDriveFileIcon)`
  color: #e53935;
`;

const StyledImageIcon = styled(ImageIcon)`
  margin-right: 8px;
`;

const StyledDescriptionIcon = styled(DescriptionIcon)`
  margin-right: 8px;
`;

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
`;

const StyledCopyIconButton = styled(IconButton)`
  margin-left: 8px;
`;

const StyledAutoSelectFormControlLabel = styled(FormControlLabel)`
  margin-right: 8px;
  margin-left: 0;
`;

const StyledModelButton = styled(Button)`
  text-transform: none;
`;

const StyledMenuDivider = styled(Divider)`
  margin-top: 4px;
  margin-bottom: 4px;
`;

const StyledCopyMenu = styled(Menu)`
  & .MuiPaper-root {
    border-radius: 12px;
    margin-top: 8px;
    min-width: 180px;
  }
`;

const StyledModelMenu = styled(Menu)`
  & .MuiPaper-root {
    border-radius: 12px;
    margin-top: 8px;
  }
`;

const AttachmentPreviewContainer = styled.section.attrs({ 'aria-label': 'Attachments' })`
  gap: 8px;
  overflow-x: auto;
  padding: 8px 16px;
  padding-bottom: 0;
`;

const AttachmentCard = styled.figure`
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
  projectId,
  fullWidth = false,
  autoFocus = false,
  manualInference = false,
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
  const [isAuto, setIsAuto] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [isEmptyEntities, setIsEmptyEntities] = useState(false);

  const [anchorCopyMenu, setAnchorCopyMenu] = React.useState(null);
  const isOpenCopyMenu = Boolean(anchorCopyMenu);

  const hasAutoExecutedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const isSubmittingRef = useRef(false);

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

    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;

    if (!canSendMessage) {
      handleStop();
      isSubmittingRef.current = false;
      return;
    }

    if (!query?.trim() && attachments.length === 0) {
      isSubmittingRef.current = false;
      return;
    }

    if ((!entitySelected || manualInference) && canSendMessage) {
      let finalQuery = query;
      if (queryJson) {
        finalQuery = serializeToMarkdown(queryJson);
      }

      itemOnAction?.('cognitive-entry::on-message', {
        query: finalQuery,
        provider: modelSelected,
        attachments,
        projectId,
        conversation: entitySelected,
      });

      setQuery('');
      setQueryJson(null);
      setAttachments([]);
    } else if (entitySelected && canSendMessage) {
      itemOnAction?.('cognitive-entry::on-inference-start', query);

      executeInference();
    }

    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 300);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (file.size > 4 * 1024 * 1024) {
      alert('The file is too large (Max 4MB). Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setAttachments((prevAttachments) => [
        ...prevAttachments,
        {
          name: file.name,
          type: file.type,
          content: content,
          isImage: type === 'image',
        },
      ]);
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prevAttachments) => prevAttachments.filter((_, attachmentIndex) => attachmentIndex !== index));
  };

  const handleModelMenuClick = (event) => {
    setAnchorMenu(event.currentTarget);
  };
  const handleModelCloseMenuClick = () => {
    setAnchorMenu(null);
  };

  const handleCopyMenuClick = (event) => {
    setAnchorCopyMenu(event.currentTarget);
  };

  const handleCopyMenuClose = () => {
    setAnchorCopyMenu(null);
  };

  const getMarkdownText = () => {
    if (queryJson) {
      return serializeToMarkdown(queryJson) || '';
    }
    return query || '';
  };

  const handleCopyMarkdown = () => {
    const text = getMarkdownText();
    if (!text) {
      handleCopyMenuClose();
      return;
    }

    navigator.clipboard.writeText(text);
    handleCopyMenuClose();
  };

  const handleCopyPlainText = () => {
    let text = getMarkdownText();
    if (!text) {
      handleCopyMenuClose();
      return;
    }

    text = text
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold markers (** or __)
      .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic markers (* or _)
      .replace(/~{2}(.*?)~{2}/g, '$1') // Remove strikethrough markers (~~)
      .replace(/`{3}([\s\S]*?)`{3}/g, '$1') // Remove code block markers (```)
      .replace(/`(.+?)`/g, '$1') // Remove inline code markers (`)
      .replace(/^#+\s+/gm, '') // Remove header symbols (#)
      .replace(/^>\s+/gm, '') // Remove blockquote symbols (>)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link syntax, keep link text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Remove image syntax, keep alt text

    navigator.clipboard.writeText(text);
    handleCopyMenuClose();
  };

  const executeInference = async (overrideQuery, initialState = {}) => {
    let currentQuery = overrideQuery || query;

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const payload = {
      organization_id: authUser?.payload?.organization_id || '',
      conversation_id: entitySelected?.id || '',
      llm_provider_id: modelSelected?.id || '',
      message: { text: currentQuery },
      attachments: attachments,
      project_id: projectId,
      ...initialState,
    };

    if (isAuto) {
      const defaultProvider = providers.find((provider) => provider.is_default);
      if (defaultProvider) {
        payload.llm_provider_id = defaultProvider.id;
      }
    }

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
        itemOnAction?.('cognitive-entry::on-inference-error', { message: 'Generation stopped' });
      } else if (
        (error.response && error.response.status === 413) ||
        (error.message && error.message.toLowerCase().includes('payload too large')) ||
        (error.response && typeof error.response.data === 'string' && error.response.data.includes('PayloadTooLargeError'))
      ) {
        console.error('Payload too large:', error);
        itemOnAction?.('cognitive-entry::on-inference-error', {
          message: 'The file is too large to be processed by the server. Try sending it compressed or choose a smaller file.',
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
        service: CognitiveInfrastructureLLMProviderService,
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

    if (setCanSendMessage) {
      setCanSendMessage(true);
    }
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  const previousEntityIdRef = useRef(entitySelected?.id);

  useEffect(() => {
    if (!providers.length) {
      return;
    }

    const persistedSlug = entitySelected?.primary_llm_provider_slug;
    const isNewConversation = previousEntityIdRef.current !== entitySelected?.id;
    previousEntityIdRef.current = entitySelected?.id;

    if (!persistedSlug) {
      if (!isNewConversation && !isAuto) {
        return;
      }

      setIsAuto(true);
      const defaultProvider = providers.find((provider) => provider.is_default);

      if (defaultProvider && modelSelected?.id !== defaultProvider.id) {
        setModelSelected(defaultProvider);
      }
      return;
    }

    const targetProvider = providers.find((provider) => provider.slug === persistedSlug || provider.id === persistedSlug);

    if (!targetProvider) {
      return;
    }

    if (!isAuto && modelSelected?.id === targetProvider.id) {
      return;
    }

    setModelSelected(targetProvider);
    setIsAuto(false);
  }, [providers, entitySelected?.id, entitySelected?.primary_llm_provider_slug]);

  useEffect(() => {
    if (!entitySelected?.id || !autoExecutePrompt?.prompt || hasAutoExecutedRef.current) {
      return;
    }

    hasAutoExecutedRef.current = true;
    itemOnAction?.('cognitive-entry::on-inference-start', autoExecutePrompt.prompt);

    const executionContext = autoExecutePrompt.context || {};

    executeInference(autoExecutePrompt.prompt, executionContext);
  }, [entitySelected, autoExecutePrompt]);

  return (
    <section className="banner-search-form-wrapper">
      <form
        onSubmit={(event) => {
          handleSubmit(event);
        }}
        autoComplete="off"
        className={`banner-search-form d-flex flex-column ${fullWidth ? 'w-100 mw-100' : ''}`}
      >
        <input
          className="d-none"
          type="file"
          ref={imageInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <input
          className="d-none"
          type="file"
          ref={fileInputRef}
          accept="application/pdf,text/plain,text/csv,min,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => handleFileSelect(event, 'document')}
        />

        {attachments.length > 0 && (
          <AttachmentPreviewContainer className="d-flex">
            {attachments.map((file, index) => (
              <AttachmentCard
                key={index}
                className={`${file.isImage ? 'image-card p-0' : 'doc-card'} position-relative d-flex align-items-center`}
              >
                <div className="remove-btn" onClick={() => handleRemoveAttachment(index)}>
                  <CloseIcon fontSize="small" />
                </div>
                {file.isImage ? (
                  <img src={file.content} alt={file.name} />
                ) : (
                  <>
                    <StyledInsertDriveFileIcon />
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
              autoGrow={true}
              minRows={1}
              maxRows={6}
              toolbarOptions={['bold', 'italic', 'strike', 'code', 'list']}
              autoFocus={autoFocus}
              onSubmit={handleSubmit}
            />
          </div>
        </section>

        <section className="d-flex grow justify-content-between px-2 pb-2">
          <article>
            <IconButton aria-label="Add files" onClick={handleAddMenuClick}>
              <AddIcon />
            </IconButton>
            <StyledCopyIconButton aria-label="Copy content" onClick={handleCopyMenuClick} size="small">
              <ContentCopyIcon fontSize="small" />
            </StyledCopyIconButton>

            <StyledCopyMenu
              id="copy-menu"
              anchorEl={anchorCopyMenu}
              open={isOpenCopyMenu}
              onClose={handleCopyMenuClose}
              disableScrollLock={true}
              slotProps={{
                list: {
                  dense: true,
                },
              }}
            >
              <MenuItem onClick={handleCopyMarkdown}>Copiar Markdown</MenuItem>
              <MenuItem onClick={handleCopyPlainText}>Copiar Texto Plano</MenuItem>
            </StyledCopyMenu>
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
            <section className="d-flex align-items-center">
              {isAuto ? (
                <StyledAutoSelectFormControlLabel
                  control={
                    <Switch
                      checked={isAuto}
                      onChange={(event) => {
                        setIsAuto(event.target.checked);

                        if (event.target.checked || modelSelected) {
                          return;
                        }

                        const defaultProvider = providers.find((provider) => provider.is_default);
                        if (defaultProvider) {
                          setModelSelected(defaultProvider);
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Auto-select"
                  labelPlacement="start"
                  className="my-auto text-black-50"
                />
              ) : (
                <>
                  <StyledModelButton
                    id="demo-customized-button"
                    aria-haspopup="true"
                    variant="text"
                    disableElevation
                    size="small"
                    onClick={handleModelMenuClick}
                    endIcon={<KeyboardArrowDownIcon />}
                    className="my-auto text-black-50"
                  >
                    {modelSelected?.name || ''}
                  </StyledModelButton>
                  <StyledModelMenu
                    id="basic-menu"
                    anchorEl={anchorMenu}
                    open={isOpenMenu}
                    onClose={handleModelCloseMenuClick}
                    slotProps={{
                      list: {
                        'aria-labelledby': 'basic-button',
                        dense: true,
                        style: { minWidth: '200px' },
                      },
                    }}
                    disableScrollLock={true}
                  >
                    <MenuItem disableRipple onKeyDown={(e) => e.stopPropagation()}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isAuto}
                            onChange={(event) => {
                              setIsAuto(event.target.checked);

                              if (!event.target.checked) {
                                return;
                              }

                              const defaultProvider = providers.find((provider) => provider.is_default);
                              if (defaultProvider) {
                                setModelSelected(defaultProvider);
                              }

                              handleModelCloseMenuClick();

                              if (!entitySelected?.id) {
                                return;
                              }

                              updateEntityRecord({
                                service: ConversationManagementService,
                                payload: {
                                  id: entitySelected.id,
                                  primary_llm_provider_slug: null,
                                },
                              }).catch((err) => console.error('Failed to clear model preference', err));
                            }}
                            size="small"
                          />
                        }
                        label="Auto-select"
                        labelPlacement="start"
                        className="m-0 w-100 d-flex justify-content-between"
                      />
                    </MenuItem>

                    <StyledMenuDivider />

                    {providers.map((provider) => (
                      <MenuItem
                        key={provider.id}
                        selected={provider.id === modelSelected?.id}
                        onClick={() => {
                          setModelSelected(provider);
                          handleModelCloseMenuClick();

                          if (entitySelected?.id) {
                            updateEntityRecord({
                              service: ConversationManagementService,
                              payload: {
                                id: entitySelected.id,
                                primary_llm_provider_slug: provider.slug || provider.id,
                              },
                            }).catch((err) => console.error('Failed to update model preference', err));
                          }
                        }}
                      >
                        {provider.name || provider.model_identifier || 'Provider'}
                      </MenuItem>
                    ))}
                  </StyledModelMenu>
                </>
              )}
            </section>
            <section>
              <StyledFab
                size="small"
                aria-label={!canSendMessage ? 'stop' : 'send'}
                onClick={(event) => {
                  if (!canSendMessage) {
                    event.preventDefault();
                    handleStop();
                  }
                }}
                disabled={false}
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
