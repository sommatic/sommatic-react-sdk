// FlowsManagerComponent.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useNodeConnections,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Science as ScienceIcon,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  PowerSettingsNew as PowerIcon,
  Delete as DeleteIcon,
  MoreHoriz as MoreHorizIcon,
  Webhook as WebhookIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Http as HttpIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  SmartToy as AIIcon,
  Merge as MergeIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import FlowsToolbarComponent from './toolbar/FlowsToolbar.component';
import FlowsNodesSidebarComponent from './sidebar/FlowsNodesSidebar.component';
import FlowsNodeConfigModalComponent from './flow-node-config/FlowsNodeConfigModal.component';
import FlowVersionsHistoryModalComponent from './history-modal/FlowVersionsHistoryModal.component';
import { openSnackbar } from '@link-loom/react-sdk';

// Additional Styled Components for Main Layout
const FlowMainContainer = styled('div').attrs({ className: 'position-relative overflow-hidden' })({
  height: 'calc(100vh - 240px)',
  borderRadius: '8px',
});

const EmptyStateIconWrapper = styled('div').attrs({
  className: 'd-flex align-items-center justify-content-center',
})(({ theme, $isSaving }) => ({
  width: 120,
  height: 120,
  border: '2px dashed #555',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  transition: 'all 0.2s',
  cursor: $isSaving ? 'default' : 'pointer',
  borderRadius: '8px',
  marginBottom: '16px',
  '&:hover': {
    borderColor: $isSaving ? '#555' : '#FF6F5C',
    backgroundColor: $isSaving ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 111, 92, 0.1)',
  },
}));

const EmptyStateTitle = styled('h6').attrs({ className: 'm-0' })({
  color: '#000000',
  fontWeight: 600,
});

const EmptyStateAction = styled('button').attrs({
  className: 'bg-transparent border-0 p-0',
})(({ $isSaving }) => ({
  color: $isSaving ? '#666' : '#FF6F5C',
  cursor: $isSaving ? 'default' : 'pointer',
  textDecoration: 'underline',
  marginTop: '4px',
  fontSize: '0.875rem',
  '&:hover': {
    color: $isSaving ? '#666' : '#E65A4B',
  },
}));

import {
  fetchEntityCollection,
  fetchMultipleEntities,
  updateEntityRecord,
  createEntityRecord,
  fetchEntityRecord,
} from '@services/utils/entityServiceAdapter';
import {
  FgnClassificatorService,
  WorkflowOrchestrationFlowDefinitionService,
  WorkflowOrchestrationFlowVersionService,
} from '@services/index';

// ------------------ Styled Components ------------------
import { styled } from '@mui/material/styles';

const EdgeLabelContainer = styled('div')(({ labelX, labelY }) => ({
  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
  pointerEvents: 'all',
  zIndex: 1002,
}));

const StyledEdgeButton = styled('button').attrs({
  className: 'border-0 d-flex align-items-center justify-content-center',
})({
  width: 24,
  height: 24,
  background: '#4B5563',
  borderRadius: '4px',
  color: 'white',
  cursor: 'pointer',
  padding: 0,
  '&:hover': {
    opacity: 0.9,
  },
});

const NodeArticle = styled('article', {
  shouldForwardProp: (prop) =>
    prop !== '$disabled' && prop !== '$selected' && prop !== '$isTrigger' && prop !== '$bg' && prop !== '$border',
}).attrs({ className: 'position-relative d-flex align-items-center justify-content-center' })(
  ({ theme, $disabled, $selected, $isTrigger, $bg, $border }) => ({
    width: 100,
    height: 100,
    backgroundColor: $bg,
    border: $border,
    borderRadius: $isTrigger ? '8px 50px 50px 8px' : undefined,
    transition: 'all 0.2s ease-in-out',
  }),
);

const StyledMiniMap = styled(MiniMap)({
  bottom: 72,
  right: 12,
});

const EdgeInteractivePath = styled('path')({
  cursor: 'pointer',
  pointerEvents: 'all',
});

const HoverArea = styled('div')({
  top: -50,
  height: 50,
  zIndex: 999,
});

const ConnectorContainer = styled('div')({
  right: -64,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'auto',
});

const ConnectorLine = styled('div')({
  width: 32,
  height: 3,
  background: '#999',
});

const NodeImage = styled('img')({
  width: 48,
  height: 48,
  objectFit: 'contain',
});

const NodeIconWrapper = styled('div')(({ theme, $color }) => ({
  fontSize: 48,
  color: $color,
  '& svg': {
    fontSize: 48,
  },
}));

const NodeTitle = styled('strong').attrs({
  className: 'd-block text-nowrap overflow-hidden text-truncate',
})(({ theme, $top }) => ({
  position: 'absolute',
  top: $top,
  left: '50%',
  transform: 'translateX(-50%)',
  color: '#374151',
  fontSize: '13px',
  fontWeight: 600,
  maxWidth: 150,
  pointerEvents: 'none',
}));

const NodeSubtitle = styled('small').attrs({
  className: 'd-block text-nowrap overflow-hidden text-truncate',
})(({ theme, $top }) => ({
  position: 'absolute',
  top: $top,
  left: '50%',
  transform: 'translateX(-50%)',
  color: '#9CA3AF',
  fontSize: '11px',
  maxWidth: 150,
  pointerEvents: 'none',
}));

const EmptyStateContainer = styled('div')({
  zIndex: 10,
});

const StyledAddNodeIcon = styled(AddIcon)({
  fontSize: 20,
});

const StyledEmptyStateIcon = styled(AddIcon)({
  fontSize: 40,
  color: '#9E9E9E',
});

const NodeActionsMenu = styled('menu').attrs({ className: 'd-flex list-unstyled' })({
  position: 'absolute',
  top: -48,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#2A2A2A',
  border: '1px solid #6B7280',
  zIndex: 1000,
  width: 'max-content',
  gap: '4px',
  padding: '4px',
  margin: 0,
  borderRadius: '4px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '& > li': {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
});

const AddNodeButton = styled('button').attrs({
  className: 'd-flex align-items-center justify-content-center',
})({
  width: 32,
  height: 32,
  background: '#2A2A2A',
  border: '2px solid #6B7280',
  color: '#E5E7EB',
  cursor: 'pointer',
  borderRadius: '4px',
  padding: 0,
  '&:hover': {
    borderColor: '#9CA3AF',
    color: '#F3F4F6',
  },
});

const StyledBaseEdge = styled(BaseEdge)(({ theme, $stroke, $strokeWidth }) => ({
  cursor: 'pointer',
  pointerEvents: 'none',
  stroke: $stroke,
  strokeWidth: $strokeWidth,
}));

// ------------------ Custom Edge (Interactive) ------------------
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) {
  const { onEdgeSplit, onEdgeDelete } = data || {};
  const [isHovered, setIsHovered] = React.useState(false);
  const hoverTimeoutRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = selected || isHovered ? '#F87171' : '#999';
  const edgeWidth = selected || isHovered ? 4 : 4; // Always thick

  return (
    <>
      <StyledBaseEdge path={edgePath} markerEnd={markerEnd} style={style} $stroke={edgeColor} $strokeWidth={edgeWidth} />
      <EdgeInteractivePath
        d={edgePath}
        fill="none"
        stroke="rgba(255,0,0,0.001)"
        strokeWidth={20}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {(selected || isHovered) && (
        <EdgeLabelRenderer>
          <EdgeLabelContainer
            labelX={labelX}
            labelY={labelY}
            className="nodrag nopan position-absolute d-flex gap-1"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <StyledEdgeButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEdgeSplit) {
                  onEdgeSplit(id);
                }
              }}
              title="Add Node"
              aria-label="Add Node"
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </StyledEdgeButton>
            <StyledEdgeButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEdgeDelete) {
                  onEdgeDelete(id);
                }
              }}
              title="Delete Connection"
              aria-label="Delete Connection"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </StyledEdgeButton>
          </EdgeLabelContainer>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const customEdgeTypes = {
  custom: CustomEdge,
};

// ------------------ Compact Tile Node (square-ish) ------------------
function TileNode({ data, id, selected }) {
  const {
    title,
    subtitle,
    Icon,
    iconColor = '#F59E0B',
    imageSrc,
    emphasis = false,
    extraHandles,
    onAddClick,
    onDelete,
  } = data || {};

  const connections = useNodeConnections({
    handleType: 'source',
    handleId: 'out',
    nodeId: id,
  });
  const hasOutgoingConnection = connections.length > 0;

  const disabled = !!data?.disabled;

  const [isHovered, setIsHovered] = React.useState(false);

  const size = 100;

  const HIDDEN_HANDLE = {
    width: 0,
    height: 0,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    pointerEvents: 'none',
  };

  const isTrigger =
    (title && title.toLowerCase().includes('trigger')) ||
    (subtitle && subtitle.toLowerCase().includes('trigger')) ||
    (data.slug && data.slug.toLowerCase().includes('trigger'));

  const bg = disabled ? '#4A4A4A' : '#3A3A3A';
  const border = selected ? '4px solid #9CA3AF' : '2px solid #6B7280';
  const iconFilter = disabled ? 'grayscale(1) opacity(.5)' : 'none';

  return (
    <>
      <NodeArticle
        $isTrigger={isTrigger}
        $disabled={disabled}
        $selected={selected}
        $bg={bg}
        $border={border}
        className={!isTrigger ? 'shadow-sm rounded-3' : 'shadow-sm'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isTrigger && <Handle id="in" type="target" position={Position.Left} />}
        <Handle id="out" type="source" position={Position.Right} />

        {isHovered && (
          <>
            <HoverArea className="position-absolute w-100" />
            <NodeActionsMenu>
              {[
                { Icon: PlayArrowIcon, title: 'Execute', onClick: () => {} },
                { Icon: PowerIcon, title: 'Enable/Disable', onClick: () => {} },
                {
                  Icon: DeleteIcon,
                  title: 'Delete',
                  onClick: (e) => {
                    e.stopPropagation();
                    onDelete && onDelete(id);
                  },
                },
                { Icon: MoreHorizIcon, title: 'More', onClick: () => {} },
              ].map(({ Icon, title, onClick }, index) => (
                <li key={index}>
                  <button
                    type="button"
                    className="btn btn-sm d-flex align-items-center justify-content-center p-0 rounded-circle border-0 bg-transparent text-secondary"
                    style={{ width: 24, height: 24 }}
                    onClick={onClick}
                    title={title}
                    aria-label={title}
                    onMouseEnter={(e) => e.currentTarget.classList.replace('text-secondary', 'text-light')}
                    onMouseLeave={(e) => e.currentTarget.classList.replace('text-light', 'text-secondary')}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </button>
                </li>
              ))}
            </NodeActionsMenu>
          </>
        )}

        {!hasOutgoingConnection && (
          <ConnectorContainer className="position-absolute d-flex align-items-center">
            <ConnectorLine />
            <AddNodeButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddClick) {
                  onAddClick(id);
                }
              }}
              aria-label="Add Node Connection"
            >
              <StyledAddNodeIcon />
            </AddNodeButton>
          </ConnectorContainer>
        )}

        {extraHandles?.severityTop && <Handle id="severity" type="source" position={Position.Top} style={HIDDEN_HANDLE} />}
        {extraHandles?.internalBottom && <Handle id="internal" type="source" position={Position.Bottom} style={HIDDEN_HANDLE} />}

        <div style={{ filter: iconFilter }}>
          {imageSrc ? (
            <NodeImage src={imageSrc} alt={title || 'node'} />
          ) : Icon ? (
            <NodeIconWrapper $color={disabled ? '#6B7280' : iconColor}>
              <Icon />
            </NodeIconWrapper>
          ) : null}
        </div>
      </NodeArticle>

      <NodeTitle className="text-center d-block text-truncate" $top={size + 8}>
        {title}
      </NodeTitle>

      {subtitle && (
        <NodeSubtitle className="text-center d-block text-truncate" $top={size + 26}>
          {subtitle}
        </NodeSubtitle>
      )}
    </>
  );
}

// ------------------ Graph ------------------
const initialNodes = [];

const edgeBase = {
  type: 'custom',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#999', width: 8, height: 8 },
  style: { stroke: '#999', strokeWidth: 4 },
};

const initialEdges = [];

// ------------------ Styled Components for Overlay ------------------
const OverlayContainer = styled('aside').attrs({ className: 'position-absolute' })({
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 1050,
});

const StyledTabsContainer = styled('nav')({
  position: 'absolute',
  top: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#4f5359',
  borderColor: 'rgba(0,0,0,0.25)',
  pointerEvents: 'auto',
  borderRadius: '8px',
  padding: '4px',
});

const StyledTitle = styled('h3')({
  fontWeight: 800,
  marginTop: '4px',
  color: '#fff',
  fontSize: '1.5rem',
  marginBottom: '8px',
});

const StyledSubtitle = styled('small').attrs({ className: 'd-block' })({
  opacity: 0.7,
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
});

const StyledFloatingButton = styled('button').attrs({
  className: 'd-flex align-items-center justify-content-center',
})(({ theme, $bgcolor, $hovercolor, $shadow, $top, $right, $bottom, $left }) => ({
  position: 'absolute',
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '1px solid rgba(107, 114, 128, 0.25)',
  cursor: 'pointer',
  pointerEvents: 'auto',
  backgroundColor: $bgcolor || '#2B2A33',
  color: '#EAEAF0',
  boxShadow: $shadow || 'none',
  transition: 'all 0.2s ease-in-out',
  zIndex: 10,
  top: $top,
  right: $right,
  bottom: $bottom,
  left: $left,
  '&:hover': {
    backgroundColor: $hovercolor || '#33323C',
    boxShadow: $shadow ? `0 8px 22px ${$shadow}` : 'none',
  },
}));

const ExecuteButton = styled('button').attrs({
  className: 'position-absolute border-0 d-flex align-items-center fw-bold',
})(({ $disabled }) => ({
  left: '50%',
  bottom: 10,
  transform: 'translateX(-50%)',
  pointerEvents: 'auto',
  backgroundColor: $disabled ? '#B91C1C' : '#EF4444',
  color: 'white',
  textTransform: 'capitalize',
  borderRadius: '8px',
  padding: '8px 24px',
  boxShadow: '0 8px 20px rgba(239,68,68,0.35)',
  gap: '8px',
  cursor: $disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: $disabled ? '#B91C1C' : '#DC2626',
    boxShadow: '0 10px 22px rgba(239,68,68,0.45)',
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 0,
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minHeight: 0,
    minWidth: 0,
    padding: theme.spacing(0.6, 1.25),
    margin: theme.spacing(0, 0.25),
    fontSize: 12,
    textTransform: 'none',
    color: '#C9CFD6',
    borderRadius: theme.shape.borderRadius,
    '&.Mui-selected': {
      backgroundColor: '#2B2F36',
      color: '#EAEAF0',
      fontWeight: 700,
    },
    '&:not(.Mui-selected)': {
      backgroundColor: 'transparent',
    },
  },
}));

// ------------------ Overlay (n8n-like controls) ------------------
function FlowOverlay({ onExecute, onAdd, disabled }) {
  return (
    <OverlayContainer aria-hidden>
      <StyledTabsContainer className="shadow-sm border">
        <StyledTabs value={0} variant="standard">
          <Tab disableRipple label="Editor" />
          <Tab disableRipple label="Executions" />
          <Tab disableRipple label="Evaluations" />
        </StyledTabs>
      </StyledTabsContainer>

      <StyledFloatingButton type="button" onClick={onAdd} aria-label="Add" $top={12} $right={12}>
        <AddIcon fontSize="small" />
      </StyledFloatingButton>

      <StyledFloatingButton
        type="button"
        aria-label="AI Assistant"
        $bgcolor="#7C3AED"
        $hovercolor="#6D28D9"
        $shadow="rgba(124,58,237,0.45)"
        $right={16}
        $bottom={16}
      >
        <AutoAwesomeIcon fontSize="small" />
      </StyledFloatingButton>

      <ExecuteButton type="button" disabled={disabled} onClick={onExecute} aria-label="Execute flow">
        <ScienceIcon />
        {disabled ? 'Executing…' : 'Execute flow'}
      </ExecuteButton>
    </OverlayContainer>
  );
}

const StyledResultCard = styled('article')({
  padding: '1rem',
  borderRadius: '0.5rem',
  backgroundColor: '#1f1f26',
  color: 'white',
});

const StyledChip = styled(Chip)({
  marginTop: '8px',
  backgroundColor: '#2b2b33',
  color: '#fff',
  '& .MuiChip-label': {
    paddingLeft: 8,
    paddingRight: 8,
  },
});

const StyledLinearProgressBig = styled(LinearProgress)({
  height: 10,
  borderRadius: 5,
});

const StyledLinearProgressSmall = styled(LinearProgress)({
  height: 6,
  borderRadius: 4,
  backgroundColor: '#e5e7eb',
});

function ClassificationResultDialog({ open, onClose, result }) {
  const probs = result?.probabilities ?? {};
  const entries = Object.entries(probs);
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topLabel, topScore] = sorted[0] || ['—', 0];
  const others = sorted.slice(1, 6);
  const pct = (x) => Math.round((x || 0) * 100);
  const subcat = result?.subcategory && result.subcategory !== 'null' ? result.subcategory : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Classification result by AI</DialogTitle>
      <DialogContent dividers>
        <section className="row g-3">
          <div className="col-12 col-md-7">
            <StyledResultCard>
              <StyledSubtitle>Selected category</StyledSubtitle>
              <StyledTitle>{result?.category || '—'}</StyledTitle>

              {subcat && <StyledChip size="small" label={`Subcategoría: ${subcat}`} />}

              <div className="mt-3">
                <StyledLinearProgressBig variant="determinate" value={pct(topScore)} />
                <small className="d-block mt-1">
                  Confidence: <b>{pct(topScore)}%</b>
                </small>
              </div>

              {result?.notes && (
                <div className="mt-3">
                  <StyledSubtitle>Notes</StyledSubtitle>
                  <p className="mb-0 small">{result.notes}</p>
                </div>
              )}
            </StyledResultCard>
          </div>

          <div className="col-12 col-md-5">
            <article className="p-3 rounded-2 bg-white text-dark">
              <StyledSubtitle className="text-dark">Other categories</StyledSubtitle>
              <div className="d-flex flex-column gap-2 mt-2">
                {others.length ? (
                  others.map(([name, score]) => (
                    <div key={name}>
                      <div className="d-flex justify-content-between small">
                        <span>{name}</span>
                        <span>{pct(score)}%</span>
                      </div>
                      <StyledLinearProgressSmall variant="determinate" value={pct(score)} />
                    </div>
                  ))
                ) : (
                  <p className="text-muted small mb-0">No relevant alternatives were found.</p>
                )}
              </div>

              <hr className="my-3" />

              <StyledSubtitle className="text-dark">Routing suggestions</StyledSubtitle>
              <div className="d-flex flex-wrap gap-1 mt-2">
                {(result?.routing_hints?.length ? result.routing_hints : ['SGDEA – Standard Radication']).map((hint) => (
                  <Chip key={hint} label={hint} size="small" />
                ))}
              </div>
            </article>
          </div>
        </section>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function FlowsContent({ flowId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeTypes = useMemo(() => ({ tile: TileNode }), []);
  const edgeTypes = useMemo(() => customEdgeTypes, []);
  const { getViewport, screenToFlowPosition, setViewport } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isNodesSidebarOpen, setNodesSidebarOpen] = useState(false);
  const [selectedNodeConfig, setSelectedNodeConfig] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [flowResponse, setFlowResponse] = useState({});
  const [isResultOpen, setResultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [sourceNodeForConnection, setSourceNodeForConnection] = useState(null);

  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const getCategoryIcon = (category) => {
    const normalized = category?.toLowerCase() || '';
    if (
      normalized.includes('ia') ||
      normalized.includes('ai') ||
      normalized.includes('gpt') ||
      normalized.includes('llm') ||
      normalized.includes('gemini') ||
      normalized.includes('claude') ||
      normalized.includes('generate')
    )
      return AIIcon;
    if (normalized.includes('http')) {
      return HttpIcon;
    }
    if (normalized.includes('email')) {
      return EmailIcon;
    }
    if (normalized.includes('schedule')) {
      return ScheduleIcon;
    }
    if (normalized.includes('webhook')) {
      return WebhookIcon;
    }
    if (normalized.includes('db') || normalized.includes('storage')) {
      return StorageIcon;
    }
    if (normalized.includes('filter')) {
      return FilterIcon;
    }
    if (normalized.includes('merge')) {
      return MergeIcon;
    }
    return CodeIcon;
  };

  const handleOpenDialog = () => {
    if (isDirty) {
      openSnackbar('Please save changes before executing the flow.', 'warning');
      return;
    }
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [versions, setVersions] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [history, setHistory] = useState({ past: [], future: [] });
  const dragStartSnapshot = useRef(null);

  const takeSnapshot = useCallback(
    (overrideState = null) => {
      const stateToSave = overrideState || { nodes, edges };
      setHistory((prev) => {
        const newPast = [...prev.past, stateToSave];
        if (newPast.length > 50) {
          newPast.shift();
        }
        return {
          past: newPast,
          future: [],
        };
      });
    },
    [nodes, edges],
  );

  const undo = useCallback(() => {
    if (history.past.length === 0) {
      return;
    }

    const previousState = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    setNodes(previousState.nodes.map((node) => ({ ...node })));
    setEdges(previousState.edges.map((edge) => ({ ...edge })));
    setIsDirty(true);

    setHistory({
      past: newPast,
      future: [{ nodes, edges }, ...history.future],
    });
  }, [history, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (history.future.length === 0) {
      return;
    }

    const nextState = history.future[0];
    const newFuture = history.future.slice(1);

    setNodes(nextState.nodes.map((node) => ({ ...node })));
    setEdges(nextState.edges.map((edge) => ({ ...edge })));
    setIsDirty(true);

    setHistory({
      past: [...history.past, { nodes, edges }],
      future: newFuture,
    });
  }, [history, nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        event.preventDefault();
      } else if ((event.ctrlKey || event.metaKey) && key === 'y') {
        redo();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const significantChanges = changes.filter((c) => c.type !== 'dimensions' && c.type !== 'select');
      if (significantChanges.length > 0) {
        setIsDirty(true);
      }
    },
    [onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      const significantChanges = changes.filter((c) => c.type !== 'select');
      if (significantChanges.length > 0) {
        setIsDirty(true);
      }
    },
    [onEdgesChange],
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (flowId) {
      fetchFlowData(flowId);
    }
  }, [flowId]);

  const fetchFlowData = async (id) => {
    setIsLoading(true);
    try {
      const response = await fetchEntityRecord({
        service: WorkflowOrchestrationFlowDefinitionService,
        payload: { id },
      });

      if (response && response.result) {
        const result = response.result;
        const flow = result.items && result.items.length > 0 ? result.items[0] : result;

        if (flow && flow.id) {
          setCurrentFlow(flow);
          restoreFlowState(flow);
        } else {
          console.warn('Flow loaded but has no ID or items empty', flow);
        }
      }
    } catch (error) {
      console.error('Error fetching flow:', error);
      openSnackbar('Error loading flow definition', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const onEdgeSplit = useCallback(
    (edgeId) => {
      const edge = edges.find((edge) => edge.id === edgeId);
      if (!edge) {
        return;
      }

      setSourceNodeForConnection(`EDGE_SPLIT:${edgeId}`);
      setNodesSidebarOpen(true);
    },
    [edges],
  );

  const onEdgeDelete = useCallback(
    (edgeId) => {
      takeSnapshot();
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setIsDirty(true);
    },
    [takeSnapshot, setEdges],
  );

  const fetchFlowVersions = async (flowId) => {
    try {
      const service = new WorkflowOrchestrationFlowVersionService();
      const response = await service.getByParameters({
        queryselector: 'flow-definition-id',
        search: flowId,
        exclude_status: 'deleted',
      });

      let sorted = [];
      if (response && response.result && response.result.items) {
        sorted = response.result.items.sort((dateA, dateB) => {
          const versionA = parseInt(dateA.version || 0);
          const versionB = parseInt(dateB.version || 0);
          if (versionA !== versionB) {
            return versionB - versionA;
          }

          const getTime = (date) => {
            if (!date) {
              return 0;
            }
            if (date.timestamp) {
              date = date.timestamp;
            }
            let dateTime = new Date(date);
            if (isNaN(dateTime.getTime())) {
              dateTime = new Date(+date);
            }
            return isNaN(dateTime.getTime()) ? 0 : dateTime.getTime();
          };

          const sortedDateA = getTime(dateA.created);
          const sortedDateB = getTime(dateB.created);
          return sortedDateB - sortedDateA;
        });
        setVersions(sorted);
      } else {
        console.error('No versions found or empty response', response);
      }
      return sorted;
    } catch (error) {
      console.error('Error fetching versions', error);
      return [];
    }
  };

  useEffect(() => {
    if (flowId) {
      fetchFlowVersions(flowId);
    }
  }, [flowId]);

  const handleRestoreVersion = useCallback(
    (version) => {
      if (!version || !version.graph) {
        openSnackbar('Invalid version data', 'error');
        return;
      }
      const unwrap = (obj) => {
        if (!obj) {
          return obj;
        }
        if (obj._value !== undefined) {
          return unwrap(obj._value);
        }
        if (Array.isArray(obj)) {
          return obj.map(unwrap);
        }
        if (typeof obj === 'object') {
          const clean = {};
          for (const key in obj) {
            clean[key] = unwrap(obj[key]);
          }
          return clean;
        }
        return obj;
      };

      const cleanGraph = unwrap(version.graph);

      const restoredNodes = (cleanGraph.nodes || [])
        .filter((node) => {
          if (!node.node_id) {
            console.warn('Skipping node without ID:', node);
          }
          return node.node_id;
        })
        .map((node) => {
          const icon = getCategoryIcon(node.operator_slug || node.label);

          return {
            id: node.node_id,
            type: 'tile',
            position: node.config?.position || { x: 0, y: 0 },
            data: {
              ...node.config,
              title: node.label,
              slug: node.operator_slug,
              Icon: icon,
              iconColor: node.config?.iconColor || '#F59E0B',
              onAddClick: handleAddClick,
              onDelete: handleDeleteNode,
            },
          };
        });

      const restoredEdges = (cleanGraph.edges || []).map((edge, index) => ({
        id: edge.id || `restored_edge_${index}`,
        source: edge.from?.node_id,
        target: edge.to?.node_id,
        sourceHandle: edge.from?.port || 'out',
        targetHandle: edge.to?.port || 'in',
        type: 'custom',
        data: { onEdgeSplit: onEdgeSplit, onEdgeDelete: onEdgeDelete },
      }));

      setNodes(restoredNodes);
      setEdges(restoredEdges);
      setIsDirty(true);

      openSnackbar(`Restored version v${version.version}`, 'success');
    },
    [takeSnapshot, setNodes, setEdges, onEdgeSplit, onEdgeDelete],
  );

  const restoreFlowState = (flow) => {
    if (!flow) {
      return;
    }

    const restoredNodes = (flow.draft_nodes || []).map((node) => {
      const id = node.node_id || node.id;
      const operatorSlug = node.operator_slug || node.type || node.params?.slug || 'code';
      const label = node.label || node.params?.title || id;
      const description = node.description || node.params?.description;

      let position = { x: 0, y: 0 };
      if (flow.editor_state?.node_positions && flow.editor_state.node_positions[id]) {
        position = flow.editor_state.node_positions[id];
      } else if (node.params?.position) {
        position = node.params.position;
      }

      const configData = node.config || node.params || {};

      const rootProps = {
        organization_id: node.organization_id,
        operator_version: node.operator_version,
        input_contract: node.input_contract,
        output_contract: node.output_contract,
        ports: node.ports,
        policies: node.policies,
        timeout_ms: node.timeout_ms,
        retry_policy: node.retry_policy,
        worker_pool_key: node.worker_pool_key,
        primary_agent_profile_id: node.primary_agent_profile_id,
        agent_profile_ids: node.agent_profile_ids,
        prompt_template_id: node.prompt_template_id,
        cognitive_tool_ids: node.cognitive_tool_ids,
        datasource_id: node.datasource_id,
        memory_store_id: node.memory_store_id,
        connector_id: node.connector_id,
      };

      return {
        id: id,
        type: 'tile',
        position: position,
        data: {
          ...configData,
          ...rootProps,
          title: label,
          slug: operatorSlug,
          description: description,
          Icon: getCategoryIcon(node.params?.subtitle || node.params?.category || operatorSlug),
          onAddClick: handleAddClick,
          onDelete: handleDeleteNode,
        },
      };
    });

    setNodes(restoredNodes);

    const restoredEdges = (flow.draft_edges || []).map((edge, index) => ({
      id: edge.id,
      source: edge.from?.node_id,
      sourceHandle: edge.from?.port,
      target: edge.to?.node_id,
      targetHandle: edge.to?.port,
      type: 'custom',
      data: { onEdgeSplit, onEdgeDelete },
    }));

    setEdges(restoredEdges);

    if (flow.editor_state) {
      const { zoom, pan_x, pan_y } = flow.editor_state;
      if (typeof zoom === 'number' && typeof pan_x === 'number') {
        setViewport({ x: pan_x, y: pan_y, zoom });
      }
    }
  };

  const handleProcess = () => {
    setDialogOpen(false);
    setIsLoading(true);
    getClassification();
  };

  const handleSaveFlow = async (metaData) => {
    setIsSaving(true);
    const safeMetaData = metaData && !metaData.nativeEvent && !metaData.preventDefault ? metaData : {};

    const viewport = getViewport();

    const nodePositions = {};

    const draftNodes = nodes.map((node) => {
      const {
        onAddClick,
        onDelete,
        Icon,
        title,
        slug,
        description,
        organization_id,
        operator_version,
        input_contract,
        output_contract,
        ports,
        policies,
        timeout_ms,
        retry_policy,
        worker_pool_key,
        primary_agent_profile_id,
        agent_profile_ids,
        prompt_template_id,
        cognitive_tool_ids,
        datasource_id,
        memory_store_id,
        connector_id,
        ...restConfig
      } = node.data || {};

      nodePositions[node.id] = node.position;
      return {
        node_id: node.id,
        operator_slug: slug || node.type || 'unknown',
        label: title || node.id,
        description: description,

        organization_id,
        operator_version,
        input_contract,
        output_contract,
        ports: ports || [],
        policies,
        timeout_ms,
        retry_policy,
        worker_pool_key,
        primary_agent_profile_id,
        agent_profile_ids,
        prompt_template_id,
        cognitive_tool_ids,
        datasource_id,
        memory_store_id,
        connector_id,

        config: restConfig,
      };
    });
    const draftEdges = edges.map((edge) => ({
      id: edge.id,
      from: {
        node_id: edge.source,
        port: edge.sourceHandle || 'out',
      },
      to: {
        node_id: edge.target,
        port: edge.targetHandle || 'in',
      },
    }));

    const flowPayload = {
      ...(currentFlow || {}),
      draft_nodes: draftNodes,
      draft_edges: draftEdges,
      editor_state: {
        zoom: viewport.zoom,
        pan_x: viewport.x,
        pan_y: viewport.y,
        node_positions: nodePositions,
      },
      ...safeMetaData,
    };

    if (!flowPayload.organization_id) {
      flowPayload.organization_id = 'org_default';
    }

    try {
      let response;
      if (flowPayload.id) {
        response = await updateEntityRecord({
          service: WorkflowOrchestrationFlowDefinitionService,
          payload: flowPayload,
        });
      } else {
        response = await createEntityRecord({
          service: WorkflowOrchestrationFlowDefinitionService,
          payload: flowPayload,
        });
      }

      if (response && response.success) {
        openSnackbar('Flow saved successfully', 'success');
        setIsDirty(false);
        if (response.result) {
          setCurrentFlow(response.result);
        }
      } else {
        openSnackbar('Error saving flow', 'error');
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      openSnackbar('Exception saving flow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getClassification = async () => {
    if (!inputText) {
      return;
    }

    const entityResponse = await fetchEntityCollection({
      service: FgnClassificatorService,
      payload: {
        queryselector: 'text',
        query: {
          search: inputText,
        },
      },
    });
    setIsLoading(false);

    if (!entityResponse?.success || !entityResponse.result) {
      return;
    }

    setFlowResponse(entityResponse.result);
    setInputText('');
    setResultOpen(true);
  };

  const handleAddClick = useCallback((nodeId) => {
    setSourceNodeForConnection(nodeId);
    setNodesSidebarOpen(true);
  }, []);
  const handleDeleteNode = useCallback(
    (nodeId) => {
      takeSnapshot();
      setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
      setEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      setIsDirty(true);
    },
    [setNodes, setEdges, selectedNodeId, takeSnapshot],
  );

  const handleNodeDoubleClick = useCallback((event, node) => {
    setSelectedNodeConfig(node);
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData('application/som-node-operator');
      if (!raw) {
        return;
      }

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        console.warn('Invalid node operator payload', raw, error);
        return;
      }

      const { operatorId, label, category, slug, description } = payload || {};

      let position;

      if (sourceNodeForConnection) {
        if (typeof sourceNodeForConnection === 'string' && sourceNodeForConnection.startsWith('EDGE_SPLIT:')) {
          const edgeId = sourceNodeForConnection.split('EDGE_SPLIT:')[1];
          const edgeToSplit = edges.find((edge) => edge.id === edgeId);
          const sourceNode = nodes.find((node) => node.id === edgeToSplit?.source);
          const targetNode = nodes.find((node) => node.id === edgeToSplit?.target);

          if (sourceNode && targetNode) {
            position = {
              x: (sourceNode.position.x + targetNode.position.x) / 2,
              y: (sourceNode.position.y + targetNode.position.y) / 2,
            };
          } else {
            position = screenToFlowPosition({
              x: event.clientX - 50,
              y: event.clientY - 50,
            });
          }
        } else {
          const sourceNode = nodes.find((node) => node.id === sourceNodeForConnection);
          if (sourceNode) {
            position = {
              x: sourceNode.position.x + 250,
              y: sourceNode.position.y,
            };
          } else {
            position = screenToFlowPosition({
              x: event.clientX - 50,
              y: event.clientY - 50,
            });
          }
        }
      } else {
        position = screenToFlowPosition({
          x: event.clientX - 50,
          y: event.clientY - 50,
        });
      }

      const newNode = {
        id: crypto.randomUUID(),
        type: 'tile',
        position,
        data: {
          title: label,
          subtitle: category,
          slug: slug,
          description: description,
          operatorId: operatorId,
          iconColor: '#A78BFA',
          Icon: getCategoryIcon(category),
          onAddClick: handleAddClick,
          onDelete: handleDeleteNode,
        },
      };

      takeSnapshot();
      setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })).concat({ ...newNode, selected: true }));
      setSelectedNodeId(newNode.id);
      setIsDirty(true);

      if (sourceNodeForConnection) {
        if (typeof sourceNodeForConnection === 'string' && sourceNodeForConnection.startsWith('EDGE_SPLIT:')) {
          const edgeId = sourceNodeForConnection.split('EDGE_SPLIT:')[1];
          const edgeToSplit = edges.find((edge) => edge.id === edgeId);

          if (edgeToSplit) {
            setEdges((edges) => {
              const filtered = edges.filter((edge) => edge.id !== edgeId);

              const edge1 = {
                id: `e-${edgeToSplit.source}-${newNode.id}`,
                source: edgeToSplit.source,
                target: newNode.id,
                ...edgeBase,
                data: { onEdgeSplit, onEdgeDelete },
              };
              const edge2 = {
                id: `e-${newNode.id}-${edgeToSplit.target}`,
                source: newNode.id,
                target: edgeToSplit.target,
                ...edgeBase,
                data: { onEdgeSplit, onEdgeDelete },
              };

              return filtered.concat([edge1, edge2]);
            });
          }
        } else {
          const newEdge = {
            id: `e-${sourceNodeForConnection}-${newNode.id}`,
            source: sourceNodeForConnection,
            sourceHandle: 'out',
            target: newNode.id,
            targetHandle: 'in',
            ...edgeBase,
            data: { onEdgeSplit, onEdgeDelete },
          };
          setEdges((eds) => eds.concat(newEdge));
        }

        setSourceNodeForConnection(null);
      }
    },
    [
      screenToFlowPosition,
      setNodes,
      setEdges,
      sourceNodeForConnection,
      nodes,
      handleAddClick,
      handleDeleteNode,
      onEdgeSplit,
      onEdgeDelete,
    ],
  );

  const onConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((edges) => addEdge({ ...params, ...edgeBase, data: { onEdgeSplit, onEdgeDelete } }, edges));
      setIsDirty(true);
    },
    [setEdges, onEdgeSplit, onEdgeDelete, takeSnapshot],
  );

  const onNodeDragStart = useCallback(() => {
    dragStartSnapshot.current = { nodes, edges };
  }, [nodes, edges]);

  const onNodeDragStop = useCallback(() => {
    if (dragStartSnapshot.current) {
      takeSnapshot(dragStartSnapshot.current);
      dragStartSnapshot.current = null;
    }
  }, [takeSnapshot]);

  const handlePublishFlow = async () => {
    let currentVersions = versions;
    if (flowId) {
      currentVersions = await fetchFlowVersions(flowId);
    }

    if (isDirty) {
      await handleSaveFlow();
    }

    if (!currentFlow || !currentFlow.id) {
      openSnackbar('Cannot publish unsaved flow', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (nodes.length === 0) {
        openSnackbar('Cannot publish empty flow (no nodes detected)', 'warning');
        return;
      }

      const nodePositions = {};
      const draftNodes = nodes.map((node) => {
        const { onAddClick, onDelete, Icon, title, slug, description, ...restConfig } = node.data || {};
        nodePositions[node.id] = node.position;
        const configWithPos = { ...restConfig, position: node.position };

        return {
          node_id: node.id,
          operator_slug: slug || node.type || 'unknown',
          label: title || node.id,
          config: configWithPos,
        };
      });

      const draftEdges = edges.map((edge) => ({
        id: edge.id,
        from: { node_id: edge.source, port: edge.sourceHandle || 'out' },
        to: { node_id: edge.target, port: edge.targetHandle || 'in' },
      }));

      const maxVersion = currentVersions.reduce((max, version) => {
        const vNum = parseInt(version.version || 0);
        return vNum > max ? vNum : max;
      }, 0);
      const nextVersion = maxVersion + 1;

      const payload = {
        organization_id: currentFlow.organization_id || 'org_default',
        flow_definition_id: currentFlow.id,
        flow_slug: currentFlow.slug,
        version: nextVersion.toString(),
        name: `${currentFlow.name} v${nextVersion}`,
        description: 'Published version from FlowsManager',
        graph: {
          nodes: draftNodes,
          edges: draftEdges,
        },
        trigger_ids: currentFlow.trigger_ids,
        default_trigger_id: currentFlow.default_trigger_id,
        is_default: true,
      };

      const response = await createEntityRecord({
        service: WorkflowOrchestrationFlowVersionService,
        payload: payload,
      });

      if (response && response.success) {
        openSnackbar(`Flow v${nextVersion} published successfully`, 'success');
        fetchFlowVersions(currentFlow.id);
      } else {
        openSnackbar('Error publishing flow', 'error');
      }
    } catch (error) {
      console.error('Publish error:', error);
      openSnackbar('Exception publishing flow', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <FlowsToolbarComponent
            flow={currentFlow}
            onSave={handleSaveFlow}
            onPublish={handlePublishFlow}
            isSaving={isSaving}
            isDirty={isDirty}
            history={history}
            onUndo={undo}
            onRedo={redo}
            versions={versions}
            onRestore={handleRestoreVersion}
            onSettings={() => setIsSettingsOpen(true)}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onFlowChange={(updated) => {
              setCurrentFlow(updated);
              setIsDirty(true);
            }}
            onDuplicate={async () => {
              if (!currentFlow) {
                return;
              }
              try {
                const newName = `${currentFlow.name} (Copy)`;
                const newSlug = `${currentFlow.slug || 'flow'}-copy-${Date.now()}`;
                const payload = {
                  ...currentFlow,
                  id: undefined,
                  name: newName,
                  slug: newSlug,
                  created_at: undefined,
                  updated_at: undefined,
                };

                const response = await createEntityRecord({
                  service: WorkflowOrchestrationFlowDefinitionService,
                  payload: payload,
                });

                if (response && response.success && response.result) {
                  openSnackbar('Flow duplicated successfully', 'success');
                  const newId = response.result.id;
                  window.open(`/client/flow-design/flow-definition/management/${newId}`, '_blank');
                } else {
                  openSnackbar('Error duplicating flow', 'error');
                }
              } catch (error) {
                console.error('Duplicate error:', error);
                openSnackbar('Exception duplicating flow', 'error');
              }
            }}
            onDownload={() => {
              if (!currentFlow) {
                return;
              }
              try {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentFlow, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute('href', dataStr);
                downloadAnchorNode.setAttribute('download', `${currentFlow.slug || 'flow'}.json`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              } catch (e) {
                console.error('Download error', e);
                openSnackbar('Error downloading flow', 'error');
              }
            }}
            onRename={async (data) => {
              if (!currentFlow || !data) {
                return;
              }
              try {
                const updatedLocal = {
                  ...currentFlow,
                  name: data.name,
                  description: data.description,
                };
                setCurrentFlow(updatedLocal);

                const payload = {
                  id: currentFlow.id,
                  name: data.name,
                  description: data.description,
                };

                const response = await updateEntityRecord({
                  service: WorkflowOrchestrationFlowDefinitionService,
                  payload: payload,
                });

                if (response && response.success) {
                  openSnackbar('Flow updated successfully', 'success');

                  if (response.result) {
                    const merged = {
                      ...updatedLocal,
                      ...response.result,
                      tags: response.result.tags || updatedLocal.tags,
                      category: response.result.category || updatedLocal.category,
                    };
                    setCurrentFlow(merged);
                  }
                } else {
                  openSnackbar('Error renaming flow', 'error');
                }
              } catch (e) {
                console.error('Rename error', e);
                openSnackbar('Error renaming flow', 'error');
              }
            }}
            onImportFile={async (fileData) => {
              try {
                if (!fileData || !fileData.draft_nodes) {
                  openSnackbar('Invalid flow file', 'warning');
                  return;
                }

                let maxX = 0;
                nodes.forEach((node) => {
                  if (node.position.x > maxX) {
                    maxX = node.position.x;
                  }
                });
                const startX = nodes.length > 0 ? maxX + 300 : 0;

                const idMap = {};

                const newNodes = [];
                (fileData.draft_nodes || []).forEach((node) => {
                  const isTrigger =
                    (node.label && node.label.toLowerCase().includes('trigger')) ||
                    (node.operator_slug && node.operator_slug.toLowerCase().includes('trigger'));

                  if (isTrigger) {
                    return;
                  }

                  const oldId = node.node_id || node.id;
                  const newId = crypto.randomUUID();
                  idMap[oldId] = newId;

                  let originalPos = { x: 0, y: 0 };
                  if (fileData.editor_state?.node_positions && fileData.editor_state.node_positions[oldId]) {
                    originalPos = fileData.editor_state.node_positions[oldId];
                  } else if (node.params?.position) {
                    originalPos = node.params.position;
                  }

                  const operatorSlug = node.operator_slug || node.type || node.params?.slug || 'code';
                  const label = node.label || node.params?.title || newId;
                  const description = node.description || node.params?.description;

                  const configData = node.config || node.params || {};
                  const rootProps = {
                    organization_id: node.organization_id,
                    operator_version: node.operator_version,
                    input_contract: node.input_contract,
                    output_contract: node.output_contract,
                    ports: node.ports,
                    policies: node.policies,
                    timeout_ms: node.timeout_ms,
                    retry_policy: node.retry_policy,
                    worker_pool_key: node.worker_pool_key,
                    primary_agent_profile_id: node.primary_agent_profile_id,
                    agent_profile_ids: node.agent_profile_ids,
                    prompt_template_id: node.prompt_template_id,
                    cognitive_tool_ids: node.cognitive_tool_ids,
                    datasource_id: node.datasource_id,
                    memory_store_id: node.memory_store_id,
                    connector_id: node.connector_id,
                  };

                  newNodes.push({
                    id: newId,
                    type: 'tile',
                    position: { x: originalPos.x + startX, y: originalPos.y },
                    data: {
                      ...configData,
                      ...rootProps,
                      title: label,
                      slug: operatorSlug,
                      description: description,
                      Icon: getCategoryIcon(n.params?.subtitle || n.params?.category || operatorSlug),
                      onAddClick: handleAddClick,
                      onDelete: handleDeleteNode,
                    },
                  });
                });

                const newEdges = [];
                (fileData.draft_edges || []).forEach((edge) => {
                  const sourceId = edge.from?.node_id || edge.source;
                  const targetId = edge.to?.node_id || edge.target;
                  if (idMap[sourceId] && idMap[targetId]) {
                    newEdges.push({
                      id: crypto.randomUUID(),
                      source: idMap[sourceId],
                      sourceHandle: edge.from?.port || edge.sourceHandle,
                      target: idMap[targetId],
                      targetHandle: edge.to?.port || edge.targetHandle,
                      type: 'custom',
                      data: { onEdgeSplit, onEdgeDelete },
                    });
                  }
                });

                takeSnapshot();
                setNodes((prevNodes) => [...prevNodes, ...newNodes]);
                setEdges((prevEdges) => [...prevEdges, ...newEdges]);
                setIsDirty(true);
                openSnackbar(`Imported ${newNodes.length} nodes from file`, 'success');
              } catch (error) {
                console.error('Import error', error);
                openSnackbar('Error importing file', 'error');
              }
            }}
          />
        </div>

        <div className="col-sm-12">
          <FlowMainContainer ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={(event, node) => setSelectedNodeId(node.id)}
              onNodeDoubleClick={handleNodeDoubleClick}
              onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.35 }}
              defaultEdgeOptions={{
                type: 'custom',
                markerEnd: { type: MarkerType.ArrowClosed, color: '#999', width: 8, height: 8 },
                style: { stroke: '#999', strokeWidth: 4 },
              }}
              snapToGrid
              snapGrid={[16, 16]}
              proOptions={{ hideAttribution: true }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodesDraggable={!isSaving}
              nodesConnectable={!isSaving}
              elementsSelectable={!isSaving}
            >
              <Background variant="dots" gap={20} size={1} />
              <StyledMiniMap pannable zoomable />
              <Controls />
            </ReactFlow>

            {nodes.length === 0 && (
              <EmptyStateContainer className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                <EmptyStateIconWrapper role="button" $isSaving={isSaving} onClick={() => !isSaving && setNodesSidebarOpen(true)}>
                  <StyledEmptyStateIcon />
                </EmptyStateIconWrapper>
                <EmptyStateTitle>Add first step...</EmptyStateTitle>
                <EmptyStateAction
                  type="button"
                  $isSaving={isSaving}
                  disabled={isSaving}
                  onClick={() => !isSaving && setNodesSidebarOpen(true)}
                >
                  or start from a template
                </EmptyStateAction>
              </EmptyStateContainer>
            )}

            <FlowOverlay onExecute={handleOpenDialog} onAdd={() => setNodesSidebarOpen(true)} disabled={isLoading || isSaving} />
          </FlowMainContainer>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{ onExited: () => setInputText('') }}
      >
        <DialogTitle>Execute flow</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Input"
            placeholder="Paste or write a test text here…"
            multiline
            rows={10}
            fullWidth
            value={inputText || ''}
            onChange={(e) => setInputText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleProcess} variant="contained">
            Process
          </Button>
        </DialogActions>
      </Dialog>
      <ClassificationResultDialog open={isResultOpen} onClose={() => setResultOpen(false)} result={flowResponse} />

      <FlowsNodesSidebarComponent
        open={isNodesSidebarOpen}
        isInitialState={nodes.length === 0}
        onClose={() => {
          setNodesSidebarOpen(false);
          setSourceNodeForConnection(null);
        }}
        onNodeSelect={(node) => {
          let clientX = 0;
          let clientY = 0;

          if (reactFlowWrapper.current) {
            const { top, left, width, height } = reactFlowWrapper.current.getBoundingClientRect();
            clientX = left + width / 2;
            clientY = top + height / 2;
          }

          const syntheticEvent = {
            preventDefault: () => {},
            clientX,
            clientY,
            dataTransfer: {
              getData: () =>
                JSON.stringify({
                  operatorId: node.id,
                  label: node.label,
                  category: node.category,
                  slug: node.slug,
                  description: node.description,
                }),
            },
          };
          onDrop(syntheticEvent);
          setNodesSidebarOpen(false);
          setSelectedNodeConfig(node);
        }}
      />

      <FlowsNodeConfigModalComponent
        open={!!selectedNodeConfig}
        node={selectedNodeConfig}
        onClose={() => setSelectedNodeConfig(null)}
        onSave={(data) => {
          setNodes((nodes) =>
            nodes.map((node) => {
              if (node.id === selectedNodeConfig.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    ...data,
                  },
                };
              }
              return node;
            }),
          );
          setIsDirty(true);
          openSnackbar('Node configuration updated', 'info');
          setSelectedNodeConfig(null);
        }}
      />

      <FlowVersionsHistoryModalComponent
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        versions={versions}
        onRestore={handleRestoreVersion}
      />

      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Flow Settings</DialogTitle>
        <DialogContent dividers>
          {currentFlow && (
            <FlowDefinitionManager
              entitySelected={currentFlow}
              mode="edit"
              setIsOpen={setIsSettingsOpen}
              isPopupContext={true}
              hideOpenEditor={true}
              onUpdatedEntity={(action, response) => {
                if (response && response.success && response.result) {
                  setCurrentFlow((prev) => ({ ...prev, ...response.result }));
                  openSnackbar('Flow updated successfully', 'success');
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FlowsManagerComponent({ flowId }) {
  return (
    <ReactFlowProvider>
      <FlowsContent flowId={flowId} />
    </ReactFlowProvider>
  );
}

export default FlowsManagerComponent;
