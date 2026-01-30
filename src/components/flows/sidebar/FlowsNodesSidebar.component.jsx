import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  Webhook as WebhookIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Http as HttpIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  SmartToy as AIIcon,
  Merge as MergeIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { fetchEntityCollection, fetchMultipleEntities, updateEntityRecord, createEntityRecord } from "@services/utils/entityServiceAdapter";
import { WorkflowOperatorService, WorkflowTriggerService } from "@services/index";

function FlowsNodesSidebarComponent({ open, onClose, onNodeSelect, isInitialState }) {
  // Configs

  // UI States
  const [categories, setCategories] = useState([]);
  const [openCategories, setOpenCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Component Functions
  const handleToggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n =>
      n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.desc.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.nodes.length > 0);

  const getCategoryIcon = (category) => {
    const normalized = category?.toLowerCase() || '';
    if (normalized.includes('http')) return HttpIcon;
    if (normalized.includes('ia') || normalized.includes('ai')) return AIIcon;
    if (normalized.includes('email')) return EmailIcon;
    if (normalized.includes('schedule')) return ScheduleIcon;
    if (normalized.includes('webhook')) return WebhookIcon;
    if (normalized.includes('db') || normalized.includes('storage')) return StorageIcon;
    if (normalized.includes('filter')) return FilterIcon;
    if (normalized.includes('merge')) return MergeIcon;
    return CodeIcon;
  };

  const getNodes = async () => {
    try {
      let entityResponse;

      if (isInitialState) {
        // Fetch Triggers
        entityResponse = await fetchEntityCollection({
          service: WorkflowTriggerService,
          payload: {
            queryselector: "all",
            include_status: "active", // assuming triggers also have active status
            query: {},
          },
        });
      } else {
        // Fetch Operators
        entityResponse = await fetchEntityCollection({
          service: WorkflowOperatorService,
          payload: {
            queryselector: "all",
            include_status: "active",
            query: {},
          },
        });
      }

      if (entityResponse?.result?.items) {
        const categoryMap = new Map();

        entityResponse.result.items.forEach(node => {
          // For triggers, use 'type' as category. For operators, use 'category' field.
          const catKey = isInitialState ? (node.type || 'Trigger') : (node.category || 'Uncategorized');

          if (!categoryMap.has(catKey)) {
            categoryMap.set(catKey, {
              id: catKey,
              title: catKey.charAt(0).toUpperCase() + catKey.slice(1),
              nodes: []
            });
          }

          categoryMap.get(catKey).nodes.push({
            id: node.id,
            label: node.name,
            desc: node.description,
            icon: getCategoryIcon(catKey), // Icon logic might need tweak for trigger types if they differ from operator categories
            slug: node.slug, // Ensure slug is passed for both
            ...node
          });
        });

        const processedCategories = Array.from(categoryMap.values());
        setCategories(processedCategories);

        // Open all categories by default
        const initialOpenState = processedCategories.reduce((acc, cat) => ({
          ...acc,
          [cat.id]: true
        }), {});
        setOpenCategories(initialOpenState);
      }
    } catch (error) {
      console.error("Error fetching nodes:", error);
    }
  };

  useEffect(() => {
    // Re-fetch whenever openness or initialState changes
    if (open) {
      getNodes();
    }
  }, [open, isInitialState]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      PaperProps={{
        className: "d-flex flex-column border-start",
        sx: {
          width: 360,
          backgroundColor: '#212121',
          color: '#EAEAF0',
          borderColor: 'rgba(107, 114, 128, 0.25) !important'
        }
      }}
    >
      <div className="d-flex flex-column p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <Typography variant="h6" className="fw-bold text-white" sx={{ fontSize: '1.1rem' }}>
            What happens next?
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: '#9CA3AF' }}>
            <CloseIcon fontSize="small" className="text-white" />
          </IconButton>
        </div>

        <TextField
          fullWidth
          placeholder="Search nodes..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9CA3AF' }} fontSize="small" />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#1F1E27',
              color: '#EAEAF0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B7280' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF6F5C' },
            }
          }}
        />
      </div>

      {/* List Content */}
      <Box
        className="flex-grow-1 overflow-auto"
        sx={{
          // Custom Scrollbar Styles
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#4B5563',
            borderRadius: '4px',
            border: `2px solid #212121`,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#6B7280',
          }
        }}
      >
        <List component="nav" className="p-2">
          {filteredCategories.map((cat) => (
            <React.Fragment key={cat.id}>
              <ListItemButton
                onClick={() => handleToggleCategory(cat.id)}
                className="rounded-3 py-2"
                sx={{
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <ListItemText
                  primary={cat.title}
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    className: "fw-bold text-uppercase",
                    sx: { color: '#9CA3AF', fontSize: '0.75rem', letterSpacing: '0.5px' }
                  }}
                />
                {openCategories[cat.id] ? <ExpandLess sx={{ color: '#9CA3AF' }} /> : <ExpandMore sx={{ color: '#9CA3AF' }} />}
              </ListItemButton>

              <Collapse in={openCategories[cat.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {cat.nodes.map((node) => (
                    <ListItemButton
                      key={node.id}
                      className="mb-1 rounded-3"
                      sx={{
                        pl: 2,
                        backgroundColor: '#212121',
                        '&:hover': { backgroundColor: '#212121' },
                        cursor: 'grab'
                      }}
                      draggable
                      onDragStart={(event) => {
                        const payload = {
                          operatorId: node.id,
                          label: node.label,
                          category: cat.id,
                          slug: node.slug,
                          description: node.description
                        };
                        event.dataTransfer.setData('application/som-node-operator', JSON.stringify(payload));
                        event.dataTransfer.effectAllowed = 'move';

                        // Custom Drag Preview to fix "transparent/weird" look
                        // Create a temporary element that looks like the TileNode
                        const dragEl = document.createElement('div');
                        dragEl.style.width = '200px';
                        dragEl.style.height = '96px';
                        dragEl.style.backgroundColor = '#2B2A33';
                        dragEl.style.border = '1px solid #7C3AED55';
                        dragEl.style.borderRadius = '12px';
                        dragEl.style.display = 'flex';
                        dragEl.style.flexDirection = 'column';
                        dragEl.style.justifyContent = 'center';
                        dragEl.style.padding = '10px 12px';
                        dragEl.style.gap = '8px';
                        dragEl.style.boxShadow = '0 6px 18px rgba(124,58,237,0.25)';
                        dragEl.style.position = 'absolute';
                        dragEl.style.top = '-1000px';
                        dragEl.style.left = '-1000px';
                        dragEl.style.zIndex = '9999';
                        dragEl.style.pointerEvents = 'none'; // Essential

                        // Icon Header
                        const headerEl = document.createElement('div');
                        headerEl.style.display = 'flex';
                        headerEl.style.alignItems = 'center';
                        headerEl.style.gap = '10px';

                        // Clone icon from current target
                        const originalIcon = event.currentTarget.querySelector('svg');
                        if (originalIcon) {
                          const iconContainer = document.createElement('div');
                          iconContainer.style.width = '36px';
                          iconContainer.style.height = '36px';
                          iconContainer.style.borderRadius = '10px';
                          iconContainer.style.backgroundColor = '#1F1E27';
                          iconContainer.style.border = '1px solid #00000033';
                          iconContainer.style.display = 'grid';
                          iconContainer.style.placeItems = 'center';

                          const iconClone = originalIcon.cloneNode(true);
                          iconClone.style.color = '#A78BFA'; // Default color
                          iconClone.style.width = '20px';
                          iconClone.style.height = '20px';
                          iconContainer.appendChild(iconClone);
                          headerEl.appendChild(iconContainer);
                        }

                        // Title
                        const titleEl = document.createElement('div');
                        titleEl.innerHTML = `
                            <div style="font-weight: 700; font-size: 14px; color: #EAEAF0; font-family: Roboto, sans-serif;">${node.label}</div>
                            <div style="font-size: 12px; color: #EAEAF0; opacity: 0.8; font-family: Roboto, sans-serif;">${cat.title}</div>
                        `;
                        headerEl.appendChild(titleEl);

                        dragEl.appendChild(headerEl);

                        document.body.appendChild(dragEl);
                        event.dataTransfer.setDragImage(dragEl, 100, 48);

                        // Cleanup
                        setTimeout(() => {
                          document.body.removeChild(dragEl);
                        }, 0);
                      }}
                      onClick={() => {
                        if (onNodeSelect) onNodeSelect(node);
                        onClose();
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <node.icon sx={{ color: '#FF6F5C' }} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={node.label}
                        secondary={node.desc}
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500, color: '#EAEAF0' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem', color: '#9CA3AF' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}

          {filteredCategories.length === 0 && (
            <div className="p-3 text-center">
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                No nodes found for "{searchTerm}"
              </Typography>
            </div>
          )}
        </List>
      </Box>

    </Drawer>
  );
}

export default FlowsNodesSidebarComponent;
