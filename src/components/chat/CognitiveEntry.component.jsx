import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import ImageLightbox from './ImageLightbox.component';
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
  CircularProgress,
} from '@mui/material';
import { TextEditor, serializeToMarkdown } from '@link-loom/react-sdk';
import SlashCommandMenu from './slash-commands/SlashCommandMenu';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StopIcon from '@mui/icons-material/Stop';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import {
  CognitiveInfrastructureLLMProviderService,
  ConversationExecutionService,
  ConversationManagementService,
  CommunicationUploadService,
} from '@services';

import { fetchMultipleEntities, updateEntityRecord } from '@services/utils/entityServiceAdapter';

import './styles.css';

const StyledInsertDriveFileIcon = styled(InsertDriveFileIcon)`
  color: #6b7280;
`;

// Add ("+") menu — subtle, delicate border + soft shadow, rounded, compact text.
const StyledAddMenu = styled(Menu)`
  & .MuiPaper-root {
    margin-top: 8px;
    min-width: 244px;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    box-shadow:
      0 10px 30px rgba(17, 17, 26, 0.08),
      0 3px 10px rgba(17, 17, 26, 0.05);
    overflow: hidden;
  }

  & .MuiList-root {
    padding: 6px;
  }

  & .MuiMenuItem-root {
    border-radius: 9px;
    padding: 8px 10px;
    gap: 10px;
    font-size: 0.85rem;
    color: #1f2937;
  }

  & .MuiMenuItem-root:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

const AddMenuIconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.5);
`;

const AddMenuLabel = styled.span`
  flex: 1;
  min-width: 0;
`;

const AddMenuShortcut = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.72rem;
  color: #9ca3af;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

const SlashGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  border: 1.5px solid rgba(0, 0, 0, 0.35);
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
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

  & .MuiFormControlLabel-label {
    font-size: 0.8rem;
  }
`;

const StyledModelButton = styled(Button)`
  text-transform: none;
  font-size: 0.8rem;
`;

const StyledMenuDivider = styled(Divider)`
  margin-top: 4px;
  margin-bottom: 4px;
`;

const StyledCopyMenu = styled(Menu)`
  z-index: 1500 !important;

  & .MuiPaper-root {
    border-radius: 12px;
    margin-top: 8px;
    min-width: 180px;
  }
`;

const StyledModelMenu = styled(Menu)`
  z-index: 1500 !important;

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
  margin: 0;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  padding: 4px;
  min-width: 120px;
  max-width: 200px;
  height: 60px;

  &.image-card {
    border: none;
    background: transparent;
    min-width: 0;
    width: auto;
    max-width: 240px;

    img {
      display: block;
      height: 60px;
      width: auto;
      border-radius: 8px;
      object-fit: cover;
      cursor: zoom-in;
    }

    img.is-uploading {
      opacity: 0.45;
      cursor: default;
    }

    .img-spinner {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
      pointer-events: none;
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
    top: -7px;
    right: -7px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
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
  commandCenterCommands,
  prefillEntry = null,
  onPrefillConsumed,
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEmptyEntities, setIsEmptyEntities] = useState(false);

  const [anchorCopyMenu, setAnchorCopyMenu] = React.useState(null);
  const isOpenCopyMenu = Boolean(anchorCopyMenu);

  const hasAutoExecutedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const attachInputRef = useRef(null);
  const uploadControllersRef = useRef({});
  const slashMenuAnchorRef = useRef(null);
  const editorRef = useRef(null);
  const pendingPrefillRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearchTerm, setSlashSearchTerm] = useState('');
  const isOpenMenu = Boolean(anchorMenu);
  const isOpenAddMenu = Boolean(anchorAddMenu);

  const slashCommandsEnabled = Boolean(manualInference && commandCenterCommands?.length);

  const handleSlashCommandSelect = (command) => {
    const rawLabel = command.label || '';
    const labelForChip = rawLabel.replace(/^\/+/, '');
    const editor = editorRef.current;
    if (editor && typeof editor.commands?.insertCommandChip === 'function') {
      const text = editor.getText();
      const trimmed = text.trimEnd();
      const slashMatch = trimmed.match(/\/[^\s]*$/);
      if (slashMatch) {
        const to = editor.state.selection.from;
        const from = Math.max(0, to - slashMatch[0].length);
        editor
          .chain()
          .deleteRange({ from, to })
          .insertCommandChip({ label: labelForChip })
          .insertContent(' ')
          .run();
      } else {
        editor.chain().insertCommandChip({ label: labelForChip }).insertContent(' ').run();
      }
    } else {
      const currentText = queryJson ? serializeToMarkdown(queryJson) : (query || '');
      const trimmed = currentText.trimEnd();
      const slashMatch = trimmed.match(/\/[^\s]*$/);
      const newText = slashMatch
        ? trimmed.slice(0, trimmed.length - slashMatch[0].length) + rawLabel + ' '
        : (trimmed ? trimmed + ' ' : '') + rawLabel + ' ';
      setQuery(newText);
      setQueryJson(null);
    }
    setSlashSearchTerm('');
    setSlashMenuOpen(false);
  };

  const handleModelChange = (data) => {
    const decodedModel = data.model != null ? decodeURIComponent(data.model) : '';
    const text = data.modelText != null ? data.modelText : decodedModel;
    setQuery(decodedModel);
    setQueryJson(data.json != null ? data.json : null);
    if (slashCommandsEnabled && text !== undefined) {
      const match = /\/([^\s]*)$/.exec(String(text).trimEnd());
      if (match) {
        setSlashSearchTerm(match[1] || '');
        setSlashMenuOpen(true);
      } else {
        setSlashSearchTerm('');
        setSlashMenuOpen(false);
      }
    } else {
      setSlashMenuOpen(false);
    }
  };

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

    if (attachments.some((file) => file.isUploading)) {
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

      executeStreamingInference();
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

  const uploadAttachment = async (file, attachmentId, localPreview) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'command-center');

    const controller = new AbortController();
    uploadControllersRef.current[attachmentId] = controller;

    let response = null;
    try {
      response = await new CommunicationUploadService().uploadSingle(formData, { signal: controller.signal });
    } catch (error) {
      response = null;
    } finally {
      delete uploadControllersRef.current[attachmentId];
    }

    // User cancelled via the remove (X) button while uploading — the card is
    // already gone; just release the local preview and stop.
    if (controller.signal.aborted || response?.canceled) {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      return;
    }

    const url = response?.result?.url;

    if (!url) {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      setAttachments((prevAttachments) => prevAttachments.filter((item) => item.id !== attachmentId));
      alert(`The file "${file.name}" could not be uploaded. Please try again.`);
      return;
    }

    setAttachments((prevAttachments) =>
      prevAttachments.map((item) => (item.id === attachmentId ? { ...item, content: url, isUploading: false } : item)),
    );

    // The local object URL is no longer displayed once the remote URL is in;
    // release it after the swap has painted to avoid a flash.
    if (localPreview) {
      setTimeout(() => URL.revokeObjectURL(localPreview), 1000);
    }
  };

  const handleFileSelect = async (event) => {
    handleAddMenuClose();
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const stamp = Date.now();
    const newAttachments = files.map((file, offset) => {
      const isImage = (file.type || '').startsWith('image/');
      return {
        id: `${file.name}-${stamp}-${offset}`,
        name: file.name,
        type: file.type,
        content: null,
        isImage,
        localPreview: isImage ? URL.createObjectURL(file) : null,
        isUploading: true,
      };
    });

    setAttachments((prevAttachments) => [...prevAttachments, ...newAttachments]);

    await Promise.all(
      newAttachments.map((attachment, offset) => uploadAttachment(files[offset], attachment.id, attachment.localPreview)),
    );
  };

  const handleRemoveAttachment = (index) => {
    const removed = attachments[index];

    if (removed?.isUploading) {
      uploadControllersRef.current[removed.id]?.abort();
    }

    if (removed?.localPreview) {
      URL.revokeObjectURL(removed.localPreview);
    }

    setAttachments((prevAttachments) => prevAttachments.filter((_, attachmentIndex) => attachmentIndex !== index));
  };

  const handleInsertSlash = () => {
    handleAddMenuClose();
    const editor = editorRef.current;
    if (editor?.chain) {
      editor.chain().focus().insertContent('/').run();
    } else {
      setQuery((prev) => (prev ? `${prev} /` : '/'));
    }
    if (slashCommandsEnabled) {
      setSlashSearchTerm('');
      setSlashMenuOpen(true);
    }
  };

  const handleAttachShortcut = (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'u') {
      return;
    }
    event.preventDefault();
    attachInputRef.current?.click();
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
      const defaultProvider =
        providers.find(
          (provider) =>
            provider.is_default === true ||
            String(provider.is_default).toLowerCase() === 'true' ||
            provider.is_default === 1 ||
            String(provider.is_default) === '1',
        ) || providers[0];
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

  const executeStreamingInference = async (overrideQuery, initialState = {}) => {
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
      const defaultProvider =
        providers.find(
          (provider) =>
            provider.is_default === true ||
            String(provider.is_default).toLowerCase() === 'true' ||
            provider.is_default === 1 ||
            String(provider.is_default) === '1',
        ) || providers[0];
      if (defaultProvider) {
        payload.llm_provider_id = defaultProvider.id;
      }
    }

    setAttachments([]);

    const streamingRecordId = `streaming-${Date.now()}`;

    await new ConversationExecutionService().executeStream(payload, {
      signal,
      onOpen: () => {
        itemOnAction?.('cognitive-entry::on-inference-stream-open', { record_id: streamingRecordId });
      },
      onChunk: (chunkData) => {
        itemOnAction?.('cognitive-entry::on-inference-chunk', {
          record_id: streamingRecordId,
          text: chunkData?.text || '',
        });
      },
      onDone: (donePayload) => {
        const wrappedResponse = { success: true, result: donePayload };
        itemOnAction?.('cognitive-entry::on-inference-success', wrappedResponse);
        abortControllerRef.current = null;
      },
      onError: (errorPayload) => {
        if (errorPayload?.message === 'Generation stopped by user') {
          itemOnAction?.('cognitive-entry::on-inference-error', { message: 'Generation stopped' });
        } else {
          itemOnAction?.('cognitive-entry::on-inference-error', errorPayload);
        }
        abortControllerRef.current = null;
      },
    });
  };

  const initializeComponent = async () => {
    const organizationId = authUser?.payload?.organization_id || '';

    const [providers] = await fetchMultipleEntities([
      {
        service: CognitiveInfrastructureLLMProviderService,
        payload: {
          queryselector: 'organization-id',
          exclude_status: 'deleted',
          search: organizationId,
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

    const persistedId = entitySelected?.primary_llm_provider_id;
    const isNewConversation = previousEntityIdRef.current !== entitySelected?.id;
    previousEntityIdRef.current = entitySelected?.id;

    if (!persistedId) {
      if (!isNewConversation && !isAuto) {
        return;
      }

      setIsAuto(true);
      const defaultProvider =
        providers.find(
          (provider) =>
            provider.is_default === true ||
            String(provider.is_default).toLowerCase() === 'true' ||
            provider.is_default === 1 ||
            String(provider.is_default) === '1',
        ) || providers[0];

      if (defaultProvider && modelSelected?.id !== defaultProvider.id) {
        setModelSelected(defaultProvider);
      }
      return;
    }

    const targetProvider = providers.find((provider) => provider.id === persistedId);

    if (!targetProvider) {
      return;
    }

    if (!isAuto && modelSelected?.id === targetProvider.id) {
      return;
    }

    setModelSelected(targetProvider);
    setIsAuto(false);
  }, [providers, entitySelected?.id, entitySelected?.primary_llm_provider_id]);

  useEffect(() => {
    if (!entitySelected?.id || !autoExecutePrompt?.prompt || hasAutoExecutedRef.current) {
      return;
    }

    hasAutoExecutedRef.current = true;
    itemOnAction?.('cognitive-entry::on-inference-start', autoExecutePrompt.prompt);

    const executionContext = autoExecutePrompt.context || {};

    executeStreamingInference(autoExecutePrompt.prompt, executionContext);
  }, [entitySelected, autoExecutePrompt]);

  const insertPrefillChip = (value) => {
    const trimmed = String(value).trim();
    const chipMatch = /^\[\/?([^\]]+)\]\s*(.*)$/.exec(trimmed);
    const label = chipMatch ? chipMatch[1].trim() : trimmed.replace(/^\/+/, '').trim();
    const tail = chipMatch ? chipMatch[2] : '';
    const editor = editorRef.current;
    const hasInsertCommandChip = typeof editor?.commands?.insertCommandChip === 'function';
    if (hasInsertCommandChip) {
      const chain = editor.chain().focus().insertCommandChip({ label }).insertContent(' ');
      if (tail) {
        chain.insertContent(tail);
      }
      chain.run();
      return;
    }
    const fallback = `/${label}${tail ? ` ${tail}` : ' '}`;
    setQuery((prev) => (prev ? `${prev} ${fallback}` : fallback));
    setQueryJson(null);
  };

  useEffect(() => {
    if (!prefillEntry) {
      return;
    }
    // Consume the prop right away so the parent clears its state and we don't
    // depend on `onPrefillConsumed` identity for this effect to re-run.
    if (editorReady) {
      insertPrefillChip(prefillEntry);
      onPrefillConsumed?.();
      return;
    }
    pendingPrefillRef.current = prefillEntry;
    onPrefillConsumed?.();
  }, [prefillEntry, editorReady]);

  useEffect(() => {
    if (!editorReady || !pendingPrefillRef.current) {
      return;
    }
    const value = pendingPrefillRef.current;
    pendingPrefillRef.current = null;
    insertPrefillChip(value);
  }, [editorReady]);

  return (
    <section className="banner-search-form-wrapper">
      <form
        onSubmit={(event) => {
          handleSubmit(event);
        }}
        onKeyDown={handleAttachShortcut}
        autoComplete="off"
        className={`banner-search-form d-flex flex-column ${fullWidth ? 'w-100 mw-100' : ''}`}
      >
        <input className="d-none" type="file" multiple ref={attachInputRef} onChange={handleFileSelect} />

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
                  <>
                    <img
                      src={file.content || file.localPreview}
                      alt={file.name}
                      className={file.isUploading ? 'is-uploading' : ''}
                      onClick={() => file.content && setPreviewUrl(file.content)}
                    />
                    {file.isUploading && (
                      <span className="img-spinner">
                        <CircularProgress size={22} thickness={4} sx={{ color: '#7c3aed' }} />
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <StyledInsertDriveFileIcon />
                    <div className="doc-info">
                      <span className="fname" title={file.name}>
                        {file.name}
                      </span>
                      <span className="ftype">
                        {file.isUploading ? 'Uploading…' : file.name.split('.').pop()}
                      </span>
                    </div>
                  </>
                )}
              </AttachmentCard>
            ))}
          </AttachmentPreviewContainer>
        )}

        <section className="search-input" ref={slashMenuAnchorRef}>
          <div className="w-100 mw-100 overflow-hidden">
            <TextEditor
              id="chat-query-input"
              modelraw={encodeURIComponent(query)}
              onModelChange={handleModelChange}
              onEditorReady={(editor) => {
                editorRef.current = editor;
                setEditorReady(true);
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

        {slashCommandsEnabled && (
          <SlashCommandMenu
            open={slashMenuOpen}
            anchorEl={slashMenuAnchorRef.current}
            commands={commandCenterCommands || []}
            searchTerm={slashSearchTerm}
            onClose={() => { setSlashMenuOpen(false); setSlashSearchTerm(''); }}
            onSelectCommand={handleSlashCommandSelect}
          />
        )}

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
              <MenuItem onClick={handleCopyMarkdown}>Copy Markdown</MenuItem>
              <MenuItem onClick={handleCopyPlainText}>Copy Plain Text</MenuItem>
            </StyledCopyMenu>
            <StyledAddMenu
              id="add-menu"
              anchorEl={anchorAddMenu}
              open={isOpenAddMenu}
              onClose={handleAddMenuClose}
              disableScrollLock={true}
              // The Command Center sidebar (<aside>) is z-index 1400; MUI's
              // default menu z-index (1300) renders behind it. Lift above it.
              sx={{ zIndex: (theme) => theme.zIndex.modal + 200 }}
            >
              <MenuItem onClick={() => attachInputRef.current?.click()}>
                <AddMenuIconWrap>
                  <AttachFileRoundedIcon fontSize="small" />
                </AddMenuIconWrap>
                <AddMenuLabel>Add files or photos</AddMenuLabel>
                <AddMenuShortcut>⌘U</AddMenuShortcut>
              </MenuItem>
              {slashCommandsEnabled && (
                <MenuItem onClick={handleInsertSlash}>
                  <AddMenuIconWrap>
                    <SlashGlyph>/</SlashGlyph>
                  </AddMenuIconWrap>
                  <AddMenuLabel>Slash commands</AddMenuLabel>
                  <AddMenuShortcut>/</AddMenuShortcut>
                </MenuItem>
              )}
            </StyledAddMenu>
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

                        if (event.target.checked) {
                          return;
                        }

                        const defaultProvider =
                          providers.find(
                            (provider) =>
                              provider.is_default === true ||
                              String(provider.is_default).toLowerCase() === 'true' ||
                              provider.is_default === 1 ||
                              String(provider.is_default) === '1',
                          ) || providers[0];

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
                    {modelSelected?.name || modelSelected?.model_identifier || ''}
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
                      <StyledAutoSelectFormControlLabel
                        control={
                          <Switch
                            checked={isAuto}
                            onChange={(event) => {
                              setIsAuto(event.target.checked);

                              if (!event.target.checked) {
                                return;
                              }

                              const defaultProvider =
                                providers.find(
                                  (provider) =>
                                    provider.is_default === true ||
                                    String(provider.is_default).toLowerCase() === 'true' ||
                                    provider.is_default === 1 ||
                                    String(provider.is_default) === '1',
                                ) || providers[0];
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
                                  primary_llm_provider_id: null,
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
                                primary_llm_provider_id: provider.id,
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
                disabled={canSendMessage && attachments.some((file) => file.isUploading)}
                type={!canSendMessage ? 'button' : 'submit'}
              >
                {!canSendMessage ? <StopIcon /> : <ArrowUpwardIcon />}
              </StyledFab>
            </section>
          </article>
        </section>
      </form>

      <ImageLightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </section>
  );
}

export default CognitiveEntryComponent;
