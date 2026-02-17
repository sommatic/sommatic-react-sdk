import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  TextField,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Collapse,
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
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import {
  fetchEntityCollection,
  fetchMultipleEntities,
  updateEntityRecord,
  createEntityRecord,
} from '@services/utils/entityServiceAdapter';
import { WorkflowOrchestrationOperatorService, WorkflowOrchestrationTriggerService } from '@services/index';

import { styled } from '@mui/material/styles';

const StyledDrawer = styled(Drawer)({
  '& .MuiPaper-root': {
    width: 360,
    backgroundColor: '#212121',
    color: '#EAEAF0',
    borderColor: 'rgba(107, 114, 128, 0.25) !important',
  },
});

const SidebarContent = styled(Box)({
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
  },
});

const CategoryButton = styled(ListItemButton)({
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
});

const NodeButton = styled(ListItemButton)({
  paddingLeft: '16px',
  backgroundColor: '#212121',
  cursor: 'grab',
  '&:hover': { backgroundColor: '#212121' },
});

const StyledSearchField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#1F1E27',
    color: '#EAEAF0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4B5563' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6B7280' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF6F5C' },
  },
});

function FlowsNodesSidebarComponent({ open, onClose, onNodeSelect, isInitialState }) {
  // Configs

  // UI States
  const [categories, setCategories] = useState([]);
  const [openCategories, setOpenCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Component Functions
  const handleToggleCategory = (catId) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.desc.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.nodes.length > 0);

  const getCategoryIcon = (category) => {
    const normalized = category?.toLowerCase() || '';
    if (normalized.includes('http')) {
      return HttpIcon;
    }
    if (normalized.includes('ia') || normalized.includes('ai')) {
      return AIIcon;
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

  const getNodes = async () => {
    try {
      let entityResponse;

      if (isInitialState) {
        entityResponse = await fetchEntityCollection({
          service: WorkflowOrchestrationTriggerService,
          payload: {
            queryselector: 'all',
            include_status: 'active',
            query: {},
          },
        });
      } else {
        entityResponse = await fetchEntityCollection({
          service: WorkflowOrchestrationOperatorService,
          payload: {
            queryselector: 'all',
            include_status: 'active',
            query: {},
          },
        });
      }

      if (entityResponse?.result?.items) {
        const categoryMap = new Map();

        entityResponse.result.items.forEach((node) => {
          const catKey = isInitialState ? node.type || 'Trigger' : node.category || 'Uncategorized';

          if (!categoryMap.has(catKey)) {
            categoryMap.set(catKey, {
              id: catKey,
              title: catKey.charAt(0).toUpperCase() + catKey.slice(1),
              nodes: [],
            });
          }

          categoryMap.get(catKey).nodes.push({
            id: node.id,
            label: node.name,
            desc: node.description,
            icon: getCategoryIcon(catKey),
            slug: node.slug,
            ...node,
          });
        });

        const processedCategories = Array.from(categoryMap.values());
        setCategories(processedCategories);

        const initialOpenState = processedCategories.reduce(
          (acc, category) => ({
            ...acc,
            [category.id]: true,
          }),
          {},
        );
        setOpenCategories(initialOpenState);
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
    }
  };

  useEffect(() => {
    if (open) {
      getNodes();
    }
  }, [open, isInitialState]);

  return (
    <StyledDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      PaperProps={{
        className: 'd-flex flex-column border-start',
      }}
    >
      <div className="d-flex flex-column p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold text-white" sx={{ fontSize: '1.1rem' }}>
            What happens next?
          </h6>
          <IconButton onClick={onClose} size="small" sx={{ color: '#9CA3AF' }}>
            <CloseIcon fontSize="small" className="text-white" />
          </IconButton>
        </div>

        <StyledSearchField
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
          }}
        />
      </div>

      <SidebarContent className="flex-grow-1 overflow-auto">
        <List component="nav" className="p-2">
          {filteredCategories.map((category) => (
            <React.Fragment key={category.id}>
              <CategoryButton onClick={() => handleToggleCategory(category.id)} className="rounded-3 py-2">
                <ListItemText
                  primary={category.title}
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    className: 'fw-bold text-uppercase',
                    sx: { color: '#9CA3AF', fontSize: '0.75rem', letterSpacing: '0.5px' },
                  }}
                />
                {openCategories[cat.id] ? <ExpandLess sx={{ color: '#9CA3AF' }} /> : <ExpandMore sx={{ color: '#9CA3AF' }} />}
              </CategoryButton>

              <Collapse in={openCategories[cat.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {cat.nodes.map((node) => (
                    <NodeButton
                      key={node.id}
                      className="mb-1 rounded-3"
                      draggable
                      onDragStart={(event) => {
                        const payload = {
                          operatorId: node.id,
                          label: node.label,
                          category: cat.id,
                          slug: node.slug,
                          description: node.description,
                        };
                        event.dataTransfer.setData('application/som-node-operator', JSON.stringify(payload));
                        event.dataTransfer.effectAllowed = 'move';

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

                        const headerEl = document.createElement('div');
                        headerEl.style.display = 'flex';
                        headerEl.style.alignItems = 'center';
                        headerEl.style.gap = '10px';

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

                        const titleEl = document.createElement('div');
                        titleEl.innerHTML = `
                            <div style="font-weight: 700; font-size: 14px; color: #EAEAF0; font-family: Roboto, sans-serif;">${node.label}</div>
                            <div style="font-size: 12px; color: #EAEAF0; opacity: 0.8; font-family: Roboto, sans-serif;">${cat.title}</div>
                        `;
                        headerEl.appendChild(titleEl);

                        dragEl.appendChild(headerEl);

                        document.body.appendChild(dragEl);
                        event.dataTransfer.setDragImage(dragEl, 100, 48);

                        setTimeout(() => {
                          document.body.removeChild(dragEl);
                        }, 0);
                      }}
                      onClick={() => {
                        if (onNodeSelect) {
                          onNodeSelect(node);
                        }
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
                    </NodeButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}

          {filteredCategories.length === 0 && (
            <div className="p-3 text-center">
              <p sx={{ color: '#9CA3AF' }}>No nodes found for "{searchTerm}"</p>
            </div>
          )}
        </List>
      </SidebarContent>
    </StyledDrawer>
  );
}

export default FlowsNodesSidebarComponent;
