import React, { useState, useRef, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';
import { useAuth } from '@veripass/react-sdk';
import {
  InfoOutlined,
  PersonOutline as AssigneeIcon,
  AccessTime as SlaIcon,
  OutputOutlined as OutputIcon,
  DataObject as PayloadIcon,
  Save as SaveIcon,
  TitleOutlined as TitleIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Verified as HitlIcon,
} from '@mui/icons-material';
import { APPROVAL_TYPES, HITL_APP_SLUG, APPROVAL_TYPES_BY_TASK_TYPE, HITL_EXTRAS_TEMPLATES } from '../../../constants/hitl-approval-types.js';
import HitlDynamicFields from '../create/HitlDynamicFields.component.jsx';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import { createEntityRecord, updateEntityRecord } from '@services/utils/entityServiceAdapter';
import { WorkManagementTaskService, IdentityUserManagementService } from '@services';
import { Container, openSnackbar, CodeEditor } from '@link-loom/react-sdk';

// ─── Styled components ───────────────────────────────────────────────────────

const HeaderArticle = styled.article`
  border-left: 5px solid #3a2e4f;
`;

const GraySection = styled.section`
  background-color: #f5f7f9;
`;

const TabPanel = styled.div`
  height: 325px;
  overflow-y: auto;
`;

const StyledTab = styled(Tab)`
  min-height: auto !important;
`;

const ColorDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(p) => p.color || '#546e7a'};
  display: inline-block;
  flex-shrink: 0;
`;

const LinkedEntityRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
`;

// ─── Constants ───────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  organization_id: '',
  title: '',
  details: '',
  type: null,
  priority: null,
  assignee: {
    assignee_type: 'group',
    user: { id: '', name: '' },
    group: { id: '', name: '' },
  },
  sla: {
    due_at: null,
    sla_ms: 86400000,
  },
  required_output: {
    schema: {},
    ui_hint: {},
  },
  payload: {
    summary: '',
    evidence: [],
    linked_entities: [],
    hitl: null,
  },
  execution: {
    app_slug: null,
    launch_mode: 'modal',
    input_payload: null,
  },
};


// Converts ms to a human-readable duration string
function msToHuman(ms) {
  if (!ms) return '';
  const hrs = Math.floor(ms / 3_600_000);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  return `${hrs} hour${hrs > 1 ? 's' : ''}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

function TaskManagerEditComponent({ entitySelected, onUpdatedEntity, setIsOpen, isPopupContext, onCancel }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState(() => {
    if (entitySelected) {
      return {
        ...INITIAL_STATE,
        ...entitySelected,
        organization_id: entitySelected.organization_id || user?.payload?.organization_id || '',
        assignee: {
          ...INITIAL_STATE.assignee,
          ...(entitySelected.assignee || {}),
        },
        sla: {
          ...INITIAL_STATE.sla,
          ...(entitySelected.sla || {}),
        },
        required_output: {
          ...INITIAL_STATE.required_output,
          ...(entitySelected.required_output || {}),
        },
        payload: {
          ...INITIAL_STATE.payload,
          ...(entitySelected.payload || {}),
        },
        execution: {
          ...INITIAL_STATE.execution,
          ...(entitySelected.execution || {}),
        },
      };
    }
    return {
      ...INITIAL_STATE,
      organization_id: user?.payload?.organization_id || '',
    };
  });
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [taskTypes, setTaskTypes] = useState([]);
  const [taskPriorities, setTaskPriorities] = useState([]);
  const [assignToMe, setAssignToMe] = useState(false);
  const [usersList, setUsersList] = useState([]); // Placeholder array for Autocomplete options

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Load type and priority catalogs from the backend
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [typesRes, prioritiesRes] = await Promise.all([
          new WorkManagementTaskService().getByParameters({ queryselector: 'types' }),
          new WorkManagementTaskService().getByParameters({ queryselector: 'priorities' }),
        ]);
        if (typesRes?.success) {
          setTaskTypes(typesRes.result || []);
        }
        if (prioritiesRes?.success) {
          setTaskPriorities(prioritiesRes.result || []);
        }
      } catch (error) {
        console.error('Error loading catalogs', error);
      }
    };
    loadCatalogs();
  }, []);

  // Load users for the current organization
  useEffect(() => {
    const loadUsers = async () => {
      const orgId = formData.organization_id || user?.payload?.organization_id;
      if (!orgId) {
        console.warn('No organization ID found');
        return;
      }
      try {
        const response = await new IdentityUserManagementService().getByParameters({
          queryselector: 'list',
          organization_id: orgId,
          pageSize: 100, // Fetch top 100 users for this organization
        });
        if (response?.success) {
          setUsersList(response.result?.items || response.result || []);
        }
      } catch (error) {
        console.error('Error loading users', error);
      }
    };
    loadUsers();
  }, [formData.organization_id, user?.payload?.organization_id]);

  // ─── Field setters ──────────────────────────────────────────────────────────

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setNestedField = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const setDeepField = (parent, subParent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [subParent]: { ...prev[parent][subParent], [field]: value },
      },
    }));
  };

  const handleJsonChange = (parent, field, value) => {
    try {
      const parsed = JSON.parse(value);
      setNestedField(parent, field, parsed);
    } catch (error) {
      console.error('Error parsing JSON', error);
    }
  };

  // ─── HITL type filtering ─────────────────────────────────────────────────────

  const allowedApprovalNames = APPROVAL_TYPES_BY_TASK_TYPE[formData.type?.name] || [];
  const filteredApprovalTypes = APPROVAL_TYPES.filter((a) => allowedApprovalNames.includes(a.name));

  const hitlExtras = (() => {
    const hitl = formData.payload?.hitl;
    if (!hitl) return {};
    const { approval_type, title, description, ...rest } = hitl;
    return rest;
  })();

  const setHitlExtras = (updatedExtras) => {
    setFormData((prev) => {
      const current = prev.payload?.hitl || {};
      return {
        ...prev,
        payload: {
          ...prev.payload,
          hitl: {
            approval_type: current.approval_type,
            title: current.title,
            description: current.description,
            ...updatedExtras,
          },
        },
      };
    });
  };

  // Reset HITL selection when task type changes and current approval type is no longer allowed
  useEffect(() => {
    const currentApproval = formData.payload?.hitl?.approval_type?.name;
    if (!currentApproval) return;
    const allowed = APPROVAL_TYPES_BY_TASK_TYPE[formData.type?.name] || [];
    if (!allowed.includes(currentApproval)) {
      enableHitl(null);
    }
  }, [formData.type?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Linked entities ────────────────────────────────────────────────────────

  const addLinkedEntity = () => {
    setFormData((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        linked_entities: [...prev.payload.linked_entities, { system_domain: '', system_entity: '', system_entity_id: '' }],
      },
    }));
  };

  const updateLinkedEntity = (idx, field, value) => {
    setFormData((prev) => {
      const rows = [...prev.payload.linked_entities];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, payload: { ...prev.payload, linked_entities: rows } };
    });
  };

  const removeLinkedEntity = (idx) => {
    setFormData((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        linked_entities: prev.payload.linked_entities.filter((_, i) => i !== idx),
      },
    }));
  };

  // ─── HITL helpers ───────────────────────────────────────────────────────────

  const setExecutionField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      execution: { ...(prev.execution || {}), [field]: value },
    }));
  };

  const setHitlField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        hitl: { ...(prev.payload?.hitl || {}), [field]: value },
      },
    }));
  };

  const enableHitl = (approvalType) => {
    if (!approvalType) {
      setFormData((prev) => ({
        ...prev,
        execution: { ...INITIAL_STATE.execution },
        payload: { ...prev.payload, hitl: null },
      }));
      return;
    }

    setFormData((prev) => {
      const prevHitl = prev.payload?.hitl || {};
      const isSameSubtype = prevHitl.approval_type?.name === approvalType.name;
      const extras = isSameSubtype ? {} : (HITL_EXTRAS_TEMPLATES[approvalType.name] || {});
      const carriedTitle = prevHitl.title || prev.title || '';
      const carriedDescription = prevHitl.description || prev.details || '';

      // Strip approval_type/title/description from prev extras to avoid leaking obsolete subtype fields
      const { approval_type: _at, title: _t, description: _d, ...prevExtras } = prevHitl;

      return {
        ...prev,
        execution: {
          app_slug: HITL_APP_SLUG,
          launch_mode: 'embedded',
          input_payload: prev.execution?.input_payload || null,
        },
        payload: {
          ...prev.payload,
          hitl: {
            approval_type: approvalType,
            title: carriedTitle,
            description: carriedDescription,
            ...(isSameSubtype ? prevExtras : extras),
          },
        },
      };
    });
  };

  const hitlExtrasJson = (() => {
    const hitl = formData.payload?.hitl;
    if (!hitl) return '{}';
    const { approval_type, title, description, ...extras } = hitl;
    return JSON.stringify(extras, null, 2);
  })();

  const setHitlExtrasFromJson = (value) => {
    try {
      const parsed = JSON.parse(value);
      setFormData((prev) => {
        const current = prev.payload?.hitl || {};
        return {
          ...prev,
          payload: {
            ...prev.payload,
            hitl: {
              approval_type: current.approval_type,
              title: current.title,
              description: current.description,
              ...parsed,
            },
          },
        };
      });
    } catch (error) {
      // Silently ignore — editor will keep showing invalid text until user fixes it.
    }
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!formData.organization_id) {
      openSnackbar('Organization is required.', 'warning');
      return;
    }
    if (!formData.title?.trim()) {
      openSnackbar('Title is required.', 'warning');
      return;
    }
    if (!formData.type) {
      openSnackbar('Type is required.', 'warning');
      return;
    }
    if (!formData.priority) {
      openSnackbar('Priority is required.', 'warning');
      return;
    }

    setIsLoading(true);
    let response;
    try {
      response = await updateEntityRecord({ service: WorkManagementTaskService, payload: formData });
    } finally {
      setIsLoading(false);
    }

    if (response?.success) {
      onUpdatedEntity('update', response);
      openSnackbar('Task updated successfully', 'success');
      if (onCancel) {
        onCancel();
      } else {
        setIsOpen?.(false);
      }
    } else {
      onUpdatedEntity('error', null);
      openSnackbar('Error updating task', 'error');
    }
  };

  // ─── Derived values ─────────────────────────────────────────────────────────

  const selectedType = taskTypes.find((t) => t.name === formData.type?.name);
  const borderColor = selectedType?.color || '#6c47ff';

  const dueDateValue = formData.sla?.due_at ? DateTime.fromMillis(Number(formData.sla.due_at)) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <section>
        <Container
          $size="custom"
          $isPopup={isPopupContext}
          $customSize={{ xl: '890px', lg: '890px', md: '90%', sm: '100%' }}
          className={!isPopupContext ? 'col-12' : ''}
        >
          <div className="card mb-0">
            <form onSubmit={handleSubmit}>
              {/* ── ZONE 1: White header with colored left border ── */}
              <header className="d-flex">
                <HeaderArticle className="col-12 ps-3 pe-4 pt-3 pb-1" $borderColor={borderColor}>
                  <h4 className="text-uppercase fw-bold mb-0">{entitySelected ? 'Edit Task' : 'New Task'}</h4>
                  <p className="text-muted mb-3">Edit the basic configuration of the task.</p>

                  <div className="mb-3">
                    <TextField
                      fullWidth
                      autoFocus
                      size="small"
                      label="Name"
                      value={formData.title}
                      onChange={(e) => setField('title', e.target.value)}
                      required
                    />
                  </div>
                </HeaderArticle>
              </header>

              {/* ── ZONE 2: Gray section — 2 rows × 2 cols ── */}
              <GraySection className="px-4 pt-3 pb-2">
                <div className="row">
                  {/* Row 1 */}
                  <article className="col-12 col-md-6 mb-2">
                    <TextField
                      fullWidth
                      size="small"
                      label="Organization ID"
                      value={formData.organization_id || ''}
                      onChange={(e) => setField('organization_id', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon className="text-muted" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </article>

                  <article className="col-12 col-md-6 mb-2">
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Type</InputLabel>
                      <Select
                        label="Type"
                        value={formData.type?.name || ''}
                        onChange={(e) => {
                          const t = taskTypes.find((x) => x.name === e.target.value);
                          setField('type', t || null);
                        }}
                      >
                        {taskTypes.map((t) => (
                          <MenuItem key={t.name} value={t.name}>
                            <span className="d-flex align-items-center gap-2">
                              <ColorDot color={t.color} />
                              {t.title}
                            </span>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </article>

                  {/* Row 2 */}
                  <article className="col-12 col-md-6 mb-2">
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        label="Priority"
                        value={formData.priority?.name || ''}
                        onChange={(e) => {
                          const p = taskPriorities.find((x) => x.name === e.target.value);
                          setField('priority', p || null);
                        }}
                      >
                        {taskPriorities.map((p) => (
                          <MenuItem key={p.name} value={p.name}>
                            <span className="d-flex align-items-center gap-2">
                              <ColorDot color={p.color} />
                              {p.title}
                            </span>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </article>

                  <article className="col-12 col-md-6 mb-2">
                    <FormControl fullWidth size="small">
                      <InputLabel>Assignee Type</InputLabel>
                      <Select
                        label="Assignee Type"
                        value={formData.assignee?.assignee_type || 'group'}
                        onChange={(e) => setNestedField('assignee', 'assignee_type', e.target.value)}
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="group">Group</MenuItem>
                      </Select>
                    </FormControl>
                  </article>
                </div>
              </GraySection>

              {/* ── ZONE 3: Tabs ── */}
              <aside className="px-4 mt-2">
                <div className="d-inline-block">
                  <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    textColor="primary"
                    indicatorColor="primary"
                    variant="standard"
                    className="nav nav-tabs task-create-tabs"
                  >
                    <StyledTab
                      label="GENERAL"
                      value="general"
                      icon={<InfoOutlined fontSize="small" />}
                      iconPosition="start"
                      className="border-end px-3 py-2 small fw-medium"
                      disableRipple
                    />
                    <StyledTab
                      label="DUE DATE"
                      value="sla"
                      icon={<SlaIcon fontSize="small" />}
                      iconPosition="start"
                      className="border-end px-3 py-2 small fw-medium"
                      disableRipple
                    />
                    <StyledTab
                      label="OUTPUT SCHEMA"
                      value="output"
                      icon={<OutputIcon fontSize="small" />}
                      iconPosition="start"
                      className="border-end px-3 py-2 small fw-medium"
                      disableRipple
                    />
                    <StyledTab
                      label="PAYLOAD"
                      value="payload"
                      icon={<PayloadIcon fontSize="small" />}
                      iconPosition="start"
                      className="border-end px-3 py-2 small fw-medium"
                      disableRipple
                    />
                    <StyledTab
                      label="HITL"
                      value="hitl"
                      icon={<HitlIcon fontSize="small" />}
                      iconPosition="start"
                      className="px-3 py-2 small fw-medium"
                      disableRipple
                    />
                  </Tabs>
                </div>
              </aside>

              {/* ── GENERAL Tab ── */}
              {activeTab === 'general' && (
                <TabPanel className="pt-3 px-4">
                  {/* Assignee section */}
                  <p className="small text-muted mb-2">Assignee</p>
                  {formData.assignee?.assignee_type === 'user' ? (
                    <div className="row">
                      <article className="col-12 mb-2">
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={assignToMe}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setAssignToMe(checked);
                                if (checked) {
                                  setNestedField('assignee', 'user', {
                                    identity: user?.identity || '',
                                    profile: user?.payload?.profile || {},
                                  });
                                } else {
                                  setNestedField('assignee', 'user', { identity: '', profile: {} });
                                }
                              }}
                            />
                          }
                          label={<span className="small text-muted">Assign to me</span>}
                        />
                      </article>
                      <article className="col-12 mb-3">
                        <Autocomplete
                          fullWidth
                          size="small"
                          freeSolo
                          disabled={assignToMe}
                          options={usersList}
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            const p = option.profile || option.payload?.profile || {};
                            return p.primary_email_address || p.display_name || option.identity || option.id || '';
                          }}
                          value={
                            formData.assignee?.user?.profile?.primary_email_address ||
                            formData.assignee?.user?.profile?.display_name ||
                            formData.assignee?.user?.identity ||
                            ''
                          }
                          onChange={(e, newValue) => {
                            if (typeof newValue === 'object' && newValue !== null) {
                              setNestedField('assignee', 'user', {
                                identity: newValue.identity || newValue.id || '',
                                profile: newValue.profile || newValue.payload?.profile || {},
                              });
                            } else {
                              setNestedField('assignee', 'user', {
                                ...formData.assignee?.user,
                                identity: newValue || '',
                              });
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Assigned to"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start" sx={{ pl: 1 }}>
                                      <PersonIcon className="text-muted" fontSize="small" />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </article>
                    </div>
                  ) : (
                    <div className="row">
                      <article className="col-12 col-md-6 mb-3">
                        <TextField
                          fullWidth
                          size="small"
                          label="Group ID"
                          value={formData.assignee?.group?.id || ''}
                          onChange={(e) => setDeepField('assignee', 'group', 'id', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon className="text-muted" fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </article>
                      <article className="col-12 col-md-6 mb-3">
                        <TextField
                          fullWidth
                          size="small"
                          label="Group Name"
                          value={formData.assignee?.group?.name || ''}
                          onChange={(e) => setDeepField('assignee', 'group', 'name', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon className="text-muted" fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </article>
                    </div>
                  )}

                  {/* Details section */}
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    size="small"
                    label="Details / Instructions"
                    value={formData.details}
                    onChange={(e) => setField('details', e.target.value)}
                    placeholder="Describe what the human must do and why..."
                  />
                </TabPanel>
              )}

              {/* ── SLA Tab ── */}
              {activeTab === 'sla' && (
                <TabPanel className="pt-3 px-4">
                  <p className="small text-muted mb-3">Define the service level agreement for this task.</p>
                  <div className="row mb-3">
                    <article className="col-12 col-md-6 mb-3">
                      <DateTimePicker
                        label="Due Date *"
                        value={dueDateValue}
                        onChange={(dt) => setNestedField('sla', 'due_at', dt ? String(dt.toMillis()) : null)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                      {formData.sla?.due_at && (
                        <p className="small text-muted mt-1 mb-0">
                          Timestamp: <code>{formData.sla.due_at}</code>
                        </p>
                      )}
                    </article>
                    <article className="col-12 col-md-6 mb-3">
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="SLA Duration (ms)"
                        value={formData.sla?.sla_ms || ''}
                        onChange={(e) => setNestedField('sla', 'sla_ms', parseInt(e.target.value, 10))}
                        helperText={msToHuman(formData.sla?.sla_ms)}
                      />
                    </article>
                  </div>
                </TabPanel>
              )}

              {/* ── OUTPUT SCHEMA Tab ── */}
              {activeTab === 'output' && (
                <TabPanel className="pt-3 px-4">
                  <p className="small text-muted mb-2">Define what the human must provide to complete this task.</p>
                  <strong className="d-block small mb-1">Required Output Schema</strong>
                  <div className="mb-3">
                    <CodeEditor
                      defaultValue={JSON.stringify(formData.required_output?.schema || {}, null, 2)}
                      language="json"
                      height="140px"
                      onChange={(val) => handleJsonChange('required_output', 'schema', val)}
                    />
                  </div>
                  <strong className="d-block small mb-1">UI Hint (optional)</strong>
                  <CodeEditor
                    defaultValue={JSON.stringify(formData.required_output?.ui_hint || {}, null, 2)}
                    language="json"
                    height="100px"
                    onChange={(val) => handleJsonChange('required_output', 'ui_hint', val)}
                  />
                </TabPanel>
              )}

              {/* ── PAYLOAD Tab ── */}
              {activeTab === 'payload' && (
                <TabPanel className="pt-3 px-4">
                  <div className="mb-3">
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      label="Summary"
                      value={formData.payload?.summary || ''}
                      onChange={(e) => setNestedField('payload', 'summary', e.target.value)}
                    />
                  </div>

                  <strong className="d-block small mb-1">Evidence (optional JSON array)</strong>
                  <div className="mb-3">
                    <CodeEditor
                      defaultValue={JSON.stringify(formData.payload?.evidence || [], null, 2)}
                      language="json"
                      height="90px"
                      onChange={(val) => handleJsonChange('payload', 'evidence', val)}
                    />
                  </div>

                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="small">Linked Entities</strong>
                    <button type="button" className="btn btn-sm btn-soft-primary" onClick={addLinkedEntity}>
                      <AddIcon fontSize="small" className="me-1" />
                      Add
                    </button>
                  </div>
                  {formData.payload?.linked_entities?.map((row, idx) => (
                    <LinkedEntityRow key={idx}>
                      <TextField
                        size="small"
                        placeholder="Domain"
                        value={row.system_domain}
                        onChange={(e) => updateLinkedEntity(idx, 'system_domain', e.target.value)}
                      />
                      <TextField
                        size="small"
                        placeholder="Entity"
                        value={row.system_entity}
                        onChange={(e) => updateLinkedEntity(idx, 'system_entity', e.target.value)}
                      />
                      <TextField
                        size="small"
                        placeholder="Entity ID"
                        value={row.system_entity_id}
                        onChange={(e) => updateLinkedEntity(idx, 'system_entity_id', e.target.value)}
                      />
                      <IconButton size="small" onClick={() => removeLinkedEntity(idx)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </LinkedEntityRow>
                  ))}
                  {!formData.payload?.linked_entities?.length && <p className="small text-muted">No linked entities yet.</p>}
                </TabPanel>
              )}

              {/* ── HITL Tab ── */}
              {activeTab === 'hitl' && (
                <TabPanel className="pt-3 px-4">
                  <p className="small text-muted mb-3">
                    Configure the Human Approval Gate that renders inside the task detail when the
                    assignee claims this task. Available approval types depend on the selected task type.
                  </p>

                  <div className="mb-3">
                    <FormControl fullWidth size="small">
                      <InputLabel>Approval type</InputLabel>
                      <Select
                        label="Approval type"
                        value={formData.payload?.hitl?.approval_type?.name || ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            enableHitl(null);
                            return;
                          }
                          const next = APPROVAL_TYPES.find((a) => a.name === e.target.value);
                          enableHitl(next || null);
                        }}
                      >
                        <MenuItem value="">
                          <em>None (disable HITL)</em>
                        </MenuItem>
                        {filteredApprovalTypes.map((a) => (
                          <MenuItem key={a.name} value={a.name}>
                            <span className="d-flex align-items-center gap-2">
                              <ColorDot color={a.color} />
                              {a.title}
                            </span>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>

                  <div className="mb-3">
                    <TextField
                      fullWidth
                      size="small"
                      label="HITL title"
                      value={formData.payload?.hitl?.title || ''}
                      onChange={(e) => setHitlField('title', e.target.value)}
                      disabled={!formData.payload?.hitl}
                      placeholder="Approve deletion of customer X?"
                    />
                  </div>

                  <div className="mb-3">
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      label="HITL description"
                      value={formData.payload?.hitl?.description || ''}
                      onChange={(e) => setHitlField('description', e.target.value)}
                      disabled={!formData.payload?.hitl}
                      placeholder="Context shown to the approver inside the task detail."
                    />
                  </div>

                  <div className="mb-2">
                    <HitlDynamicFields
                      approvalTypeName={formData.payload?.hitl?.approval_type?.name}
                      extras={hitlExtras}
                      onChange={setHitlExtras}
                      disabled={!formData.payload?.hitl}
                    />
                  </div>
                </TabPanel>
              )}

              {/* ── ZONE 4: Footer ── */}
              <footer className="d-flex mt-3 px-3">
                <div className="flex-grow-1 mx-2 mb-3 d-flex justify-content-between align-items-center gap-2">
                  <Button
                    onClick={() => onCancel ? onCancel() : setIsOpen?.(false)}
                    disabled={isLoading}
                    sx={{
                      color: '#6B7280',
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: '8px',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    startIcon={
                      isLoading ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      ) : (
                        <SaveIcon fontSize="small" />
                      )
                    }
                    sx={{
                      backgroundColor: '#299E9C',
                      color: '#fff',
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: '8px',
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#1F7A78', boxShadow: 'none' },
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </footer>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}

export default TaskManagerEditComponent;
