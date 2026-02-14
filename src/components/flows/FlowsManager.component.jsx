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
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import FlowsToolbarComponent from './toolbar/FlowsToolbar.component';
import FlowsNodesSidebarComponent from './sidebar/FlowsNodesSidebar.component';
import FlowsNodeConfigModalComponent from './flow-node-config/FlowsNodeConfigModal.component';
// import FlowDefinitionManager from "./flow-definition/quick-actions/manager/FlowDefinitionManager";
import FlowVersionsHistoryModalComponent from './history-modal/FlowVersionsHistoryModal.component';
import { openSnackbar } from '@link-loom/react-sdk';

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
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
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

  // Red color when selected, otherwise gray
  const edgeColor = selected || isHovered ? '#F87171' : '#999';
  const edgeWidth = selected || isHovered ? 4 : 4; // Always thick

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          cursor: 'pointer',
          pointerEvents: 'none',
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(255,0,0,0.001)"
        strokeWidth={20}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Buttons show when selected or hovered */}
      {(selected || isHovered) && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1002, // Above nodes (1000)
            }}
            className="nodrag nopan position-absolute d-flex gap-1"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="btn btn-sm d-flex align-items-center justify-content-center p-0"
              style={{
                width: 24,
                height: 24,
                background: '#4B5563', // Darker gray
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onEdgeSplit) onEdgeSplit(id);
              }}
              title="Add Node"
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
            <button
              className="btn btn-sm d-flex align-items-center justify-content-center p-0"
              style={{
                width: 24,
                height: 24,
                background: '#4B5563',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onEdgeDelete) onEdgeDelete(id);
              }}
              title="Delete Connection"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Custom Edge Types
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

  // Use hook to detect connections stability
  const connections = useNodeConnections({
    handleType: 'source',
    handleId: 'out',
    nodeId: id,
  });
  const hasOutgoingConnection = connections.length > 0;

  const disabled = !!data?.disabled;

  const [isHovered, setIsHovered] = React.useState(false);

  // n8n-style: square nodes
  const size = 100;

  const HIDDEN_HANDLE = {
    width: 0,
    height: 0,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    pointerEvents: 'none',
  };

  // Detect if this is a Trigger node
  const isTrigger =
    (title && title.toLowerCase().includes('trigger')) ||
    (subtitle && subtitle.toLowerCase().includes('trigger')) ||
    (data.slug && data.slug.toLowerCase().includes('trigger'));

  // n8n color scheme
  const bg = disabled ? '#4A4A4A' : '#3A3A3A';
  const border = selected ? '4px solid #9CA3AF' : '2px solid #6B7280'; // Thicker, lighter border when selected
  const iconFilter = disabled ? 'grayscale(1) opacity(.F5)' : 'none';

  // Trigger Style: D-shape (flat left, rounded right)
  const borderRadius = isTrigger ? '8px 50px 50px 8px' : undefined; // undefined falls back to bootstrap class if not set here, but we invoke it locally or override class

  return (
    <>
      {/* Main node container */}
      <div
        className={`position-relative d-flex align-items-center justify-content-center shadow-sm ${!isTrigger ? 'rounded-3' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: size,
          height: size,
          background: bg,
          border: border,
          borderRadius: borderRadius,
        }}
      >
        {/* Only show Input handle if NOT a Trigger */}
        {!isTrigger && <Handle id="in" type="target" position={Position.Left} />}
        <Handle id="out" type="source" position={Position.Right} />

        {/* Hover toolbar - n8n style */}
        {isHovered && (
          <>
            {/* Invisible bridge to keep hover active in the gap */}
            <div
              style={{
                position: 'absolute',
                top: -50,
                left: 0,
                width: '100%',
                height: 50,
                background: 'transparent',
                zIndex: 999,
              }}
            />
            <div
              className="position-absolute d-flex gap-1 p-1 shadow rounded-2"
              style={{
                top: -48, // Moved down slightly
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#2A2A2A',
                border: '1px solid #6B7280',
                zIndex: 1000,
                width: 'max-content',
              }}
            >
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
                <button
                  key={index}
                  className="btn btn-sm d-flex align-items-center justify-content-center p-0 rounded-circle border-0 bg-transparent text-secondary"
                  style={{
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                  }}
                  onClick={onClick}
                  title={title}
                  onMouseEnter={(e) => e.currentTarget.classList.replace('text-secondary', 'text-light')}
                  onMouseLeave={(e) => e.currentTarget.classList.replace('text-light', 'text-secondary')}
                >
                  <Icon sx={{ fontSize: 16 }} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* n8n-style add button - only show when no outgoing connection */}
        {!hasOutgoingConnection && (
          <div
            className="position-absolute d-flex align-items-center"
            style={{
              right: -64,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'auto',
            }}
          >
            {/* Connection line */}
            <div
              style={{
                width: 32,
                height: 3,
                background: '#999',
              }}
            />
            {/* Add button - square with border */}
            <button
              className="btn btn-sm d-flex align-items-center justify-content-center p-0 rounded-2"
              style={{
                width: 32,
                height: 32,
                background: '#2A2A2A',
                border: '2px solid #6B7280',
                color: '#E5E7EB',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onAddClick) onAddClick(id);
              }}
            >
              <AddIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        )}

        {extraHandles?.severityTop && <Handle id="severity" type="source" position={Position.Top} style={HIDDEN_HANDLE} />}
        {extraHandles?.internalBottom && <Handle id="internal" type="source" position={Position.Bottom} style={HIDDEN_HANDLE} />}

        {/* Icon only - centered */}
        <div style={{ filter: iconFilter }}>
          {imageSrc ? (
            <img src={imageSrc} alt={title || 'node'} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : Icon ? (
            <Icon style={{ fontSize: 48, color: disabled ? '#6B7280' : iconColor }} />
          ) : null}
        </div>
      </div>

      {/* Label below node */}
      <div
        className="position-absolute text-center"
        style={{
          top: size + 8,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#374151',
          fontSize: '13px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          pointerEvents: 'none',
        }}
      >
        {title}
      </div>

      {/* Subtitle below title if exists */}
      {subtitle && (
        <div
          className="position-absolute text-center"
          style={{
            top: size + 26,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#9CA3AF',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
          }}
        >
          {subtitle}
        </div>
      )}
    </>
  );
}

// ------------------ Graph ------------------
const initialNodes = [];

const edgeBase = {
  type: 'custom', // Use custom edge by default for base
  markerEnd: { type: MarkerType.ArrowClosed, color: '#999', width: 8, height: 8 },
  style: { stroke: '#999', strokeWidth: 4 },
};

const initialEdges = [];

// ------------------ Overlay (n8n-like controls) ------------------
function FlowOverlay({ onExecute, onAdd, disabled }) {
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1050 }} aria-hidden>
      {/* Tabs */}
      <Box
        className="rounded-2 border px-1 py-1 mt-2"
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4f5359',
          borderColor: 'rgba(0,0,0,0.25)',
          pointerEvents: 'auto',
        }}
      >
        <Tabs
          value={0}
          variant="standard"
          TabIndicatorProps={{ style: { display: 'none' } }}
          sx={{
            minHeight: 0,
            '& .MuiTab-root': {
              minHeight: 0,
              minWidth: 0,
              px: 1.25,
              py: 0.6,
              mx: 0.25,
              fontSize: 12,
              textTransform: 'none',
              color: '#C9CFD6',
              borderRadius: 1,
            },
            '& .MuiTab-root.Mui-selected': {
              bgcolor: '#2B2F36',
              color: '#EAEAF0',
              fontWeight: 700,
            },
            '& .MuiTab-root:not(.Mui-selected)': {
              bgcolor: 'transparent',
            },
          }}
        >
          <Tab disableRipple label="Editor" />
          <Tab disableRipple label="Ejecuciones" />
          <Tab disableRipple label="Evaluaciones" />
        </Tabs>
      </Box>

      {/* FAB “+” */}
      <Fab
        size="small"
        aria-label="Añadir"
        onClick={onAdd}
        className="shadow-none rounded-2"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          pointerEvents: 'auto',
          bgcolor: '#2B2A33',
          color: '#EAEAF0',
          border: '1px solid #6B728040',
          '&:hover': { bgcolor: '#33323C' },
        }}
      >
        <AddIcon fontSize="small" />
      </Fab>

      {/* FAB “IA” */}
      <Fab
        size="small"
        aria-label="Asistente IA"
        className="rounded-2 shadow"
        sx={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          pointerEvents: 'auto',
          bgcolor: '#7C3AED',
          color: '#FFFFFF',
          '&:hover': { bgcolor: '#6D28D9', boxShadow: '0 8px 22px rgba(124,58,237,0.45)' },
        }}
      >
        <AutoAwesomeIcon fontSize="small" />
      </Fab>

      {/* Execute button */}
      <Button
        variant="contained"
        startIcon={<ScienceIcon />}
        aria-label="Ejecutar flujo"
        disabled={disabled}
        onClick={onExecute}
        className="rounded-2 px-3 py-1 shadow fw-bold text-white text-capitalize"
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 10,
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          bgcolor: disabled ? '#B91C1C' : '#EF4444',
          boxShadow: '0 8px 20px rgba(239,68,68,0.35)',
          '&:hover': {
            bgcolor: '#DC2626',
            boxShadow: '0 10px 22px rgba(239,68,68,0.45)',
          },
        }}
      >
        {disabled ? 'Ejecutando…' : 'Ejecutar flujo'}
      </Button>
    </Box>
  );
}

function ClassificationResultDialog({ open, onClose, result }) {
  const probs = result?.probabilities ?? {};
  const entries = Object.entries(probs);
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topLabel, topScore] = sorted[0] || ['—', 0];
  const others = sorted.slice(1, 6); // mostramos top-5 restantes
  const pct = (x) => Math.round((x || 0) * 100);
  const subcat = result?.subcategory && result.subcategory !== 'null' ? result.subcategory : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Resultado de clasificación por IA</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 2 }}>
          {/* Panel izquierdo: categoría elegida */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#1f1f26', color: '#fff' }}>
            <Typography variant="overline" sx={{ opacity: 0.7 }}>
              Categoría seleccionada
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#fff' }}>
              {result?.category || '—'}
            </Typography>

            {subcat && <Chip size="small" label={`Subcategoría: ${subcat}`} sx={{ mt: 1, bgcolor: '#2b2b33', color: '#fff' }} />}

            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={pct(topScore)} sx={{ height: 10, borderRadius: 5 }} />
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                Confianza: <b>{pct(topScore)}%</b>
              </Typography>
            </Box>

            {result?.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="overline" sx={{ opacity: 0.7 }}>
                  Notas
                </Typography>
                <Typography variant="body2">{result.notes}</Typography>
              </Box>
            )}
          </Box>

          {/* Panel derecho: otras categorías + enrutamiento */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="overline">Otras categorías</Typography>
            <Stack spacing={1.25} sx={{ mt: 1 }}>
              {others.length ? (
                others.map(([name, score]) => (
                  <Box key={name}>
                    <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{name}</span>
                      <span>{pct(score)}%</span>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={pct(score)}
                      sx={{ height: 6, borderRadius: 4, bgcolor: '#e5e7eb' }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hubo alternativas relevantes.
                </Typography>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="overline">Sugerencias de enrutamiento</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {(result?.routing_hints?.length ? result.routing_hints : ['SGDEA – Radicación estándar']).map((h) => (
                <Chip key={h} label={h} size="small" />
              ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
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

  // Dialog + input + loading
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isNodesSidebarOpen, setNodesSidebarOpen] = useState(false);
  const [selectedNodeConfig, setSelectedNodeConfig] = useState(null); // Node to configure
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [flowResponse, setFlowResponse] = useState({});
  const [isResultOpen, setResultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-connection state
  const [sourceNodeForConnection, setSourceNodeForConnection] = useState(null);

  // Selection state
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
    if (normalized.includes('http')) return HttpIcon;
    if (normalized.includes('email')) return EmailIcon;
    if (normalized.includes('schedule')) return ScheduleIcon;
    if (normalized.includes('webhook')) return WebhookIcon;
    if (normalized.includes('db') || normalized.includes('storage')) return StorageIcon;
    if (normalized.includes('filter')) return FilterIcon;
    if (normalized.includes('merge')) return MergeIcon;
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

  // Versions State
  const [versions, setVersions] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // ------------------ Undo / Redo State ------------------
  const [history, setHistory] = useState({ past: [], future: [] });
  const dragStartSnapshot = useRef(null);

  const takeSnapshot = useCallback(
    (overrideState = null) => {
      const stateToSave = overrideState || { nodes, edges };
      setHistory((prev) => {
        // Avoid duplicates if possible, though strict PBI just says "differs from previous".
        // We will blindly push for now as per plan, relying on triggers to be correct.
        // Optimization: Check if stateToSave is same as last past state?
        // For now, simplicity.

        const newPast = [...prev.past, stateToSave];
        if (newPast.length > 50) newPast.shift(); // Limit stack size
        return {
          past: newPast,
          future: [],
        };
      });
    },
    [nodes, edges],
  );

  const undo = useCallback(() => {
    // Check if we have history
    if (history.past.length === 0) return;

    const previousState = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    // Apply State (Side Effect)
    setNodes(previousState.nodes.map((n) => ({ ...n }))); // Deep clone to force re-render if refs strictly compared?
    // Actually React Flow nodes are objects. Creating new array is usually enough.
    // But to be safe let's clone.
    setEdges(previousState.edges.map((e) => ({ ...e })));
    setIsDirty(true);

    setHistory({
      past: newPast,
      future: [{ nodes, edges }, ...history.future],
    });
  }, [history, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const nextState = history.future[0];
    const newFuture = history.future.slice(1);

    // Apply State
    setNodes(nextState.nodes.map((n) => ({ ...n })));
    setEdges(nextState.edges.map((e) => ({ ...e })));
    setIsDirty(true);

    setHistory({
      past: [...history.past, { nodes, edges }],
      future: newFuture,
    });
  }, [history, nodes, edges, setNodes, setEdges]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Avoid triggering when in inputs (Node Inspector handled by modal isolation mostly, but check target)
      if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;

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

  // Wrap setNodes/setEdges to track changes
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Filter out changes that shouldn't trigger a dirty state (selection, dimensions)
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
      // Filter out selection changes
      const significantChanges = changes.filter((c) => c.type !== 'select');
      if (significantChanges.length > 0) {
        setIsDirty(true);
      }
    },
    [onEdgesChange],
  );

  // Warn on exit if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Load Flow Data
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
        // The backend returns a paginated structure { items: [...] } for getByParameters
        const result = response.result;
        const flow = result.items && result.items.length > 0 ? result.items[0] : result;

        // Validation: Ensure we actually got an object with an ID
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

  // Callback when splitting an edge to add a node
  const onEdgeSplit = useCallback(
    (edgeId) => {
      // 1. Find the edge
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;

      // 2. We trigger the add node flow, but specifically for this edge
      // Ideally we would calculate the midpoint and open sidebar
      // For now, let's open sidebar and track the 'replace edge' intent
      setSourceNodeForConnection(`EDGE_SPLIT:${edgeId}`);
      setNodesSidebarOpen(true);
    },
    [edges],
  );

  // Callback for deleting an edge
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
        // Sort desc by version or created_at
        sorted = response.result.items.sort((a, b) => {
          // Try numeric version compare first
          const vA = parseInt(a.version || 0);
          const vB = parseInt(b.version || 0);
          if (vA !== vB) return vB - vA;

          // Fallback to date (safety check for undefined)
          const getTime = (d) => {
            if (!d) return 0;
            if (d.timestamp) d = d.timestamp; // Handle nested structure
            let dt = new Date(d);
            if (isNaN(dt.getTime())) dt = new Date(+d);
            return isNaN(dt.getTime()) ? 0 : dt.getTime();
          };

          const dateA = getTime(a.created);
          const dateB = getTime(b.created);
          return dateB - dateA;
        });
        setVersions(sorted);
        console.log('Versions fetched:', sorted);
      } else {
        console.log('No versions found or empty response', response);
      }
      return sorted;
    } catch (e) {
      console.error('Error fetching versions', e);
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
      // Helper to strip LinkLoom SDK _value wrappers
      const unwrap = (obj) => {
        if (!obj) return obj;
        if (obj._value !== undefined) return unwrap(obj._value);
        if (Array.isArray(obj)) return obj.map(unwrap);
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
      console.log('Restoring Version GRAPH (CLEAN):', cleanGraph);

      // Restore Nodes
      const restoredNodes = (cleanGraph.nodes || [])
        .filter((n) => {
          if (!n.node_id) console.warn('Skipping node without ID:', n);
          return n.node_id;
        })
        .map((n) => {
          // Map back 'config' to 'data' and restore position
          // Reconstruct missing UI helpers like Icon/colors
          const icon = getCategoryIcon(n.operator_slug || n.label);

          return {
            id: n.node_id,
            type: 'tile',
            position: n.config?.position || { x: 0, y: 0 },
            data: {
              ...n.config,
              title: n.label,
              slug: n.operator_slug,
              Icon: icon,
              iconColor: n.config?.iconColor || '#F59E0B',
              // Pass required callback refs
              onAddClick: handleAddClick,
              onDelete: handleDeleteNode,
            },
          };
        });

      // Restore Edges
      const restoredEdges = (cleanGraph.edges || []).map((e, index) => ({
        id: e.id || `restored_edge_${index}`,
        source: e.from?.node_id,
        target: e.to?.node_id,
        sourceHandle: e.from?.port || 'out',
        targetHandle: e.to?.port || 'in',
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
    if (!flow) return;

    // 1. Restore Nodes
    // Backend: draft_nodes = [{ id, type, params: { position: {x,y}, ... } }]
    // We expect position in params based on commonly used patterns, or at top level if schema changed.
    // Based on save logic to be implemented, we will store x,y in params or editor_state.
    // Let's assume standard React Flow persistence: x,y often stored in specific fields for the node.
    // NOTE: The current backend structure likely stores x/y in 'params' or assumes auto-layout if missing.
    // Let's try to find position in params first.

    const restoredNodes = (flow.draft_nodes || []).map((n) => {
      // 1. Resolve ID and basic metadata
      const id = n.node_id || n.id;
      const operatorSlug = n.operator_slug || n.type || n.params?.slug || 'code';
      const label = n.label || n.params?.title || id;
      const description = n.description || n.params?.description;

      // 2. Resolve Position: Look in editor_state.node_positions first, then legacy params
      let position = { x: 0, y: 0 };
      if (flow.editor_state?.node_positions && flow.editor_state.node_positions[id]) {
        position = flow.editor_state.node_positions[id];
      } else if (n.params?.position) {
        position = n.params.position;
      }

      // 3. Resolve Configuration Data & Root Properties
      // New schema: fields are at root. Legacy: params contained everything.
      const configData = n.config || n.params || {};

      // Extract other root properties if present
      const rootProps = {
        organization_id: n.organization_id,
        operator_version: n.operator_version,
        input_contract: n.input_contract,
        output_contract: n.output_contract,
        ports: n.ports,
        policies: n.policies,
        timeout_ms: n.timeout_ms,
        retry_policy: n.retry_policy,
        worker_pool_key: n.worker_pool_key,
        primary_agent_profile_id: n.primary_agent_profile_id,
        agent_profile_ids: n.agent_profile_ids,
        prompt_template_id: n.prompt_template_id,
        cognitive_tool_ids: n.cognitive_tool_ids,
        datasource_id: n.datasource_id,
        memory_store_id: n.memory_store_id,
        connector_id: n.connector_id,
      };

      return {
        id: id,
        type: 'tile', // Forcing 'tile' as it's the main visual type used here
        position: position,
        data: {
          ...configData, // Spread config first (lowest priority)
          ...rootProps, // Spread root props (highest priority in data, but will be stripped on save)
          title: label,
          slug: operatorSlug,
          description: description,
          // Fix: Restore Icon from subtitle (category) first, fallback to slug
          Icon: getCategoryIcon(n.params?.subtitle || n.params?.category || operatorSlug),
          onAddClick: handleAddClick,
          onDelete: handleDeleteNode,
        },
      };
    });

    setNodes(restoredNodes);

    // 2. Restore Edges
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

    // 3. Restore Viewport
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
    // Sanitize metaData: If called via onClick, it receives an Event object which creates circular references.
    const safeMetaData = metaData && !metaData.nativeEvent && !metaData.preventDefault ? metaData : {};

    const viewport = getViewport();

    const nodePositions = {};

    // 1. Map Nodes (React Flow -> Backend strictly typed NodeDefinitionModel)
    // 1. Map Nodes (React Flow -> Backend strictly typed NodeDefinitionModel)
    const draftNodes = nodes.map((n) => {
      // Destructure to remove frontend-only handlers and components (Icon) from persistence
      const {
        onAddClick,
        onDelete,
        Icon,
        title,
        slug,
        description,
        // Root properties to extract
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
        // Rest is config
        ...restConfig
      } = n.data || {};

      // Store position in editor state map
      nodePositions[n.id] = n.position;

      // Construct strict NodeDefinitionModel
      return {
        node_id: n.id,
        operator_slug: slug || n.type || 'unknown',
        label: title || n.id,
        description: description,

        // Root fields
        organization_id,
        operator_version,
        input_contract,
        output_contract,
        ports: ports || [], // Default ports if null
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

        // Config: Specific operator configuration.
        config: restConfig,
      };
    });

    // 2. Map Edges (React Flow -> Backend)
    const draftEdges = edges.map((e) => ({
      id: e.id,
      from: {
        node_id: e.source,
        port: e.sourceHandle || 'out',
      },
      to: {
        node_id: e.target,
        port: e.targetHandle || 'in',
      },
    }));

    // 3. Construct Payload
    // Merge existing flow data with new graph data
    const flowPayload = {
      ...(currentFlow || {}),
      // Update with new graph data
      draft_nodes: draftNodes,
      draft_edges: draftEdges,
      editor_state: {
        zoom: viewport.zoom,
        pan_x: viewport.x,
        pan_y: viewport.y,
        // New: Store all positions here
        node_positions: nodePositions,
      },
      // If metaData provided (e.g. from a settings modal), override
      ...safeMetaData,
    };

    // Ensure critical fields are present if this is a new flow (fallback)
    if (!flowPayload.organization_id) flowPayload.organization_id = 'org_default'; // Should come from context really

    console.log('Saving flow payload:', flowPayload);

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
        // Update local state version if needed
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

  // Handle add button click on nodes
  const handleAddClick = useCallback((nodeId) => {
    setSourceNodeForConnection(nodeId);
    setNodesSidebarOpen(true);
  }, []);

  // Handle node deletion
  const handleDeleteNode = useCallback(
    (nodeId) => {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Also remove connected edges
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
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
      if (!raw) return;

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        console.warn('Invalid node operator payload', raw, error);
        return;
      }

      const { operatorId, label, category, slug, description } = payload || {};

      // Calculate position
      let position;

      if (sourceNodeForConnection) {
        if (typeof sourceNodeForConnection === 'string' && sourceNodeForConnection.startsWith('EDGE_SPLIT:')) {
          // Handle edge split position: midpoint
          const edgeId = sourceNodeForConnection.split('EDGE_SPLIT:')[1];
          const edgeToSplit = edges.find((e) => e.id === edgeId);
          const sourceNode = nodes.find((n) => n.id === edgeToSplit?.source);
          const targetNode = nodes.find((n) => n.id === edgeToSplit?.target);

          if (sourceNode && targetNode) {
            position = {
              x: (sourceNode.position.x + targetNode.position.x) / 2,
              y: (sourceNode.position.y + targetNode.position.y) / 2,
            };
          } else {
            // Fallback if nodes not found (shouldn't happen)
            position = screenToFlowPosition({
              x: event.clientX - 50,
              y: event.clientY - 50,
            });
          }
        } else {
          // Auto-connect mode: place node to the right of source
          const sourceNode = nodes.find((n) => n.id === sourceNodeForConnection);
          if (sourceNode) {
            position = {
              x: sourceNode.position.x + 250, // Fixed distance to the right
              y: sourceNode.position.y,
            };
          } else {
            // Fallback if source not found
            position = screenToFlowPosition({
              x: event.clientX - 50, // Half of node size (100/2)
              y: event.clientY - 50, // Half of node size (100/2)
            });
          }
        }
      } else {
        // Normal DnD mode - center on cursor
        position = screenToFlowPosition({
          x: event.clientX - 50, // Half of node size (100/2)
          y: event.clientY - 50, // Half of node size (100/2)
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
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat({ ...newNode, selected: true }));
      setSelectedNodeId(newNode.id);
      setIsDirty(true);

      // Auto-create edge if in auto-connect mode
      if (sourceNodeForConnection) {
        if (typeof sourceNodeForConnection === 'string' && sourceNodeForConnection.startsWith('EDGE_SPLIT:')) {
          // Handle edge split
          const edgeId = sourceNodeForConnection.split('EDGE_SPLIT:')[1];
          const edgeToSplit = edges.find((e) => e.id === edgeId);

          if (edgeToSplit) {
            // Remove old edge & add two new edges atomically
            setEdges((eds) => {
              const filtered = eds.filter((e) => e.id !== edgeId);

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
          // Normal auto-connect
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

        setSourceNodeForConnection(null); // Clear source
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

  // Removed the useEffect that was causing render trashing by modifying nodes/edges on every change

  const onConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, ...edgeBase, data: { onEdgeSplit, onEdgeDelete } }, eds));
      setIsDirty(true);
    },
    [setEdges, onEdgeSplit, onEdgeDelete, takeSnapshot],
  );

  const onNodeDragStart = useCallback(() => {
    // Capture state BEFORE drag begins
    dragStartSnapshot.current = { nodes, edges };
  }, [nodes, edges]);

  const onNodeDragStop = useCallback(() => {
    // Commit the PRE-DRAG state to history
    // Only if we have a snapshot (safety check)
    if (dragStartSnapshot.current) {
      takeSnapshot(dragStartSnapshot.current);
      dragStartSnapshot.current = null;
    }
  }, [takeSnapshot]);

  const handlePublishFlow = async () => {
    let currentVersions = versions;
    if (flowId) {
      // Fetch latest versions to calculate next number correctly
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
      // 1. Prepare FlowVersion Payload
      // We map the CURRENT nodes/edges to the backend format, similar to save
      // But we wrap it in a FlowVersion structure

      if (nodes.length === 0) {
        openSnackbar('Cannot publish empty flow (no nodes detected)', 'warning');
        return;
      }

      const nodePositions = {};
      const draftNodes = nodes.map((n) => {
        const { onAddClick, onDelete, Icon, title, slug, description, ...restConfig } = n.data || {};
        nodePositions[n.id] = n.position;
        // Inject position into config to ensure it persists in version
        const configWithPos = { ...restConfig, position: n.position };

        return {
          node_id: n.id,
          operator_slug: slug || n.type || 'unknown',
          label: title || n.id,
          config: configWithPos,
          // Note: In a real implementation we would map all root props too
        };
      });

      const draftEdges = edges.map((e) => ({
        id: e.id,
        from: { node_id: e.source, port: e.sourceHandle || 'out' },
        to: { node_id: e.target, port: e.targetHandle || 'in' },
      }));

      console.log('Publishing draftNodes:', draftNodes);

      // Calculate next version
      const maxVersion = currentVersions.reduce((max, v) => {
        const vNum = parseInt(v.version || 0);
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
        // Defaults
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
        // Update local versions list immediately
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
              if (!currentFlow) return;
              try {
                // 1. Prepare payload
                const newName = `${currentFlow.name} (Copy)`;
                const newSlug = `${currentFlow.slug || 'flow'}-copy-${Date.now()}`;
                const payload = {
                  ...currentFlow,
                  id: undefined, // Create new
                  name: newName,
                  slug: newSlug,
                  created_at: undefined,
                  updated_at: undefined,
                };

                // 2. Create in DB
                const response = await createEntityRecord({
                  service: WorkflowOrchestrationFlowDefinitionService,
                  payload: payload,
                });

                if (response && response.success && response.result) {
                  openSnackbar('Flow duplicated successfully', 'success');
                  // 3. Open in new tab
                  const newId = response.result.id;
                  // Correct route as per user request
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
              if (!currentFlow) return;
              try {
                // Get current state to ensure Wysiwyg accuracy if wanted,
                // but requirement says "literally the object ... as in BD".
                // So we use currentFlow which is loaded/saved.
                // If user has unsaved changes, they might expect them?
                // "tal cual como esta en BD" implies SAVED state.
                // But usually users expect what they see.
                // Let's stick to "tal cual como esta en BD" -> currentFlow (which is mostly synced, but maybe stale if isDirty).
                // If isDirty, prompt save? "tal cual como esta en BD" is strong.
                // We will download 'currentFlow' state.

                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentFlow, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute('href', dataStr);
                downloadAnchorNode.setAttribute('download', `${currentFlow.slug || 'flow'}.json`);
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              } catch (e) {
                console.error('Download error', e);
                openSnackbar('Error downloading flow', 'error');
              }
            }}
            onRename={async (data) => {
              // Expecting data: { name, description }
              if (!currentFlow || !data) return;
              try {
                // Optimistic update: merge new data into current flow
                const updatedLocal = {
                  ...currentFlow,
                  name: data.name,
                  description: data.description,
                };
                setCurrentFlow(updatedLocal);

                // Save to BD
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

                  // Careful state update:
                  // The backend might return a partial or joined object.
                  // If we trust our optimistic update for fields we sent, and the response for ID/dates,
                  // we should ensure we don't lose existing fields like 'tags' or 'category' if the backend response misses them.
                  if (response.result) {
                    // Start with what we have (updatedLocal which preserves tags/category)
                    // and merge backend result ON TOP, but only if backend result actually has the fields we care about.
                    // Or simpler: just use updatedLocal since we just saved exactly what we wanted for name/desc.
                    // However, we might want updated timestamps.

                    const merged = {
                      ...updatedLocal,
                      ...response.result,
                      // Force restore critical fields if missing in response but present in local
                      tags: response.result.tags || updatedLocal.tags,
                      category: response.result.category || updatedLocal.category,
                    };
                    setCurrentFlow(merged);
                  }
                } else {
                  openSnackbar('Error renaming flow', 'error');
                  // Revert if needed? usually fine to just show error.
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

                // Calculate offset to place new nodes to the right of existing ones
                let maxX = 0;
                nodes.forEach((n) => {
                  if (n.position.x > maxX) maxX = n.position.x;
                });
                const startX = nodes.length > 0 ? maxX + 300 : 0;

                // ID Mapping to prevent collisions
                const idMap = {};

                // Process Nodes
                const newNodes = [];
                (fileData.draft_nodes || []).forEach((n) => {
                  // Skip Trigger nodes
                  const isTrigger =
                    (n.label && n.label.toLowerCase().includes('trigger')) ||
                    (n.operator_slug && n.operator_slug.toLowerCase().includes('trigger'));

                  if (isTrigger) return;

                  const oldId = n.node_id || n.id;
                  const newId = crypto.randomUUID();
                  idMap[oldId] = newId;

                  // Resolve position (similar to restoreFlowState logic)
                  let originalPos = { x: 0, y: 0 };
                  if (fileData.editor_state?.node_positions && fileData.editor_state.node_positions[oldId]) {
                    originalPos = fileData.editor_state.node_positions[oldId];
                  } else if (n.params?.position) {
                    originalPos = n.params.position;
                  }

                  // config/data extraction (reusing logic from restoreFlowState basically)
                  // Resolve ID and basic metadata
                  const operatorSlug = n.operator_slug || n.type || n.params?.slug || 'code';
                  const label = n.label || n.params?.title || newId;
                  const description = n.description || n.params?.description;

                  // Config
                  const configData = n.config || n.params || {};
                  // Root fields (subset)
                  const rootProps = {
                    organization_id: n.organization_id,
                    operator_version: n.operator_version,
                    input_contract: n.input_contract,
                    output_contract: n.output_contract,
                    ports: n.ports,
                    policies: n.policies,
                    timeout_ms: n.timeout_ms,
                    retry_policy: n.retry_policy,
                    worker_pool_key: n.worker_pool_key,
                    primary_agent_profile_id: n.primary_agent_profile_id,
                    agent_profile_ids: n.agent_profile_ids,
                    prompt_template_id: n.prompt_template_id,
                    cognitive_tool_ids: n.cognitive_tool_ids,
                    datasource_id: n.datasource_id,
                    memory_store_id: n.memory_store_id,
                    connector_id: n.connector_id,
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

                // Process Edges
                const newEdges = [];
                (fileData.draft_edges || []).forEach((e) => {
                  const sourceId = e.from?.node_id || e.source;
                  const targetId = e.to?.node_id || e.target;

                  // Only add edge if both nodes were imported (excludes edges connected to Triggers that were skipped)
                  if (idMap[sourceId] && idMap[targetId]) {
                    newEdges.push({
                      id: crypto.randomUUID(),
                      source: idMap[sourceId],
                      sourceHandle: e.from?.port || e.sourceHandle,
                      target: idMap[targetId],
                      targetHandle: e.to?.port || e.targetHandle,
                      type: 'custom',
                      data: { onEdgeSplit, onEdgeDelete },
                    });
                  }
                });

                // Update State
                takeSnapshot();
                setNodes((prev) => [...prev, ...newNodes]);
                setEdges((prev) => [...prev, ...newEdges]);
                setIsDirty(true);
                openSnackbar(`Imported ${newNodes.length} nodes from file`, 'success');
              } catch (e) {
                console.error('Import error', e);
                openSnackbar('Error importing file', 'error');
              }
            }}
          />
        </div>

        <div
          ref={reactFlowWrapper}
          className="col-sm-12 overflow-hidden position-relative rounded-3"
          style={{ height: 'calc(100vh - 240px)' }}
        >
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
            <MiniMap pannable zoomable style={{ bottom: 72, right: 12 }} />
            <Controls />
          </ReactFlow>

          {nodes.length === 0 && (
            <div
              className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center"
              style={{ zIndex: 10 }}
            >
              <div
                role="button"
                onClick={() => !isSaving && setNodesSidebarOpen(true)}
                className="d-flex align-items-center justify-content-center rounded-3 mb-3 cursor-pointer"
                style={{
                  width: 120,
                  height: 120,
                  border: '2px dashed #555',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF6F5C';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 111, 92, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#555';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <AddIcon sx={{ fontSize: 40, color: '#9E9E9E' }} />
              </div>
              <Typography variant="h6" sx={{ color: '#000000', fontWeight: 600 }}>
                Add first step...
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: isSaving ? '#666' : '#FF6F5C',
                  cursor: isSaving ? 'default' : 'pointer',
                  textDecoration: 'underline',
                  mt: 0.5,
                }}
                onClick={() => !isSaving && setNodesSidebarOpen(true)}
              >
                or start from a template
              </Typography>
            </div>
          )}

          <FlowOverlay onExecute={handleOpenDialog} onAdd={() => setNodesSidebarOpen(true)} disabled={isLoading || isSaving} />
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{ onExited: () => setInputText('') }}
      >
        <DialogTitle>Ejecutar flujo</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Entrada"
            placeholder="Pegue o escriba aquí un texto de prueba…"
            multiline
            rows={10}
            fullWidth
            value={inputText || ''}
            onChange={(e) => setInputText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleProcess} variant="contained">
            Procesar
          </Button>
        </DialogActions>
      </Dialog>
      <ClassificationResultDialog open={isResultOpen} onClose={() => setResultOpen(false)} result={flowResponse} />

      {/* Nodes Sidebar */}
      <FlowsNodesSidebarComponent
        open={isNodesSidebarOpen}
        isInitialState={nodes.length === 0}
        onClose={() => {
          setNodesSidebarOpen(false);
          setSourceNodeForConnection(null); // Clear source if closing without selection
        }}
        onNodeSelect={(node) => {
          // Calculate center of the flow wrapper
          let clientX = 0;
          let clientY = 0;

          if (reactFlowWrapper.current) {
            const { top, left, width, height } = reactFlowWrapper.current.getBoundingClientRect();
            clientX = left + width / 2;
            clientY = top + height / 2;
          }

          // Trigger a synthetic drop event with the node data
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
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === selectedNodeConfig.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    ...data,
                  },
                };
              }
              return n;
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

      {/* Settings Modal - Reusing FlowDefinitionManager */}
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
