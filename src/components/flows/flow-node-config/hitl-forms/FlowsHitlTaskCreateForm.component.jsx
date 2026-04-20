import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Person as PersonIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useAuth } from '@veripass/react-sdk';
import WorkManagementTaskService from '../../../../services/work-management/task/task.service.js';
import IdentityUserManagementService from '../../../../services/identity/user/user-management.service.js';

const labelSx = { color: '#9E9E9E', fontSize: '0.78rem', mb: 0.5, display: 'block' };

// Dark-theme overrides so MUI inputs read well on the node config modal background.
const inputSx = {
  '& .MuiInputBase-root': { backgroundColor: '#212121', color: '#E0E0E0' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
  '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.24)',
  },
  '& .MuiInputLabel-root': { color: '#9E9E9E' },
  '& .MuiSvgIcon-root': { color: '#9E9E9E' },
  '& .MuiAutocomplete-endAdornment .MuiSvgIcon-root': { color: '#9E9E9E' },
};

const ColorDot = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: color || '#546e7a',
      marginRight: 8,
      flexShrink: 0,
    }}
  />
);

export default function FlowsHitlTaskCreateForm({ config = {}, onChange }) {
  const { user } = useAuth();

  const [taskTypes, setTaskTypes] = useState([]);
  const [taskPriorities, setTaskPriorities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [assignToMe, setAssignToMe] = useState(false);

  const orgId = config.organization_id || user?.payload?.organization_id || '';

  const setField = (field, value) => onChange({ ...config, [field]: value });

  // Load type / priority catalogs from backend
  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, prioritiesRes] = await Promise.all([
          new WorkManagementTaskService().getByParameters({ queryselector: 'types' }),
          new WorkManagementTaskService().getByParameters({ queryselector: 'priorities' }),
        ]);
        if (typesRes?.success) setTaskTypes(typesRes.result || []);
        if (prioritiesRes?.success) setTaskPriorities(prioritiesRes.result || []);
      } catch (e) {
        // silent — form remains usable with empty catalogs
      }
    };
    load();
  }, []);

  // Load users of the current organization
  useEffect(() => {
    const load = async () => {
      if (!orgId) return;
      try {
        const response = await new IdentityUserManagementService().getByParameters({
          queryselector: 'list',
          organization_id: orgId,
          pageSize: 100,
        });
        if (response?.success) {
          setUsersList(response.result?.items || response.result || []);
        }
      } catch (e) {
        // silent — assignee autocomplete will still accept free-text input
      }
    };
    load();
  }, [orgId]);

  const selectedType = useMemo(
    () => taskTypes.find((t) => t.name === config.type?.name) || null,
    [taskTypes, config.type?.name],
  );
  const selectedPriority = useMemo(
    () => taskPriorities.find((p) => p.name === config.priority?.name) || null,
    [taskPriorities, config.priority?.name],
  );

  // Assignee value: a users list item, a plain string (email/identity), or null.
  const assigneeValue = useMemo(() => {
    if (!config.assignee) return null;
    const match = usersList.find(
      (u) =>
        u.identity === config.assignee ||
        u.id === config.assignee ||
        u.profile?.primary_email_address === config.assignee,
    );
    return match || config.assignee;
  }, [usersList, config.assignee]);

  const handleAssignToMe = (checked) => {
    setAssignToMe(checked);
    if (checked) {
      const identity = user?.identity || user?.payload?.profile?.primary_email_address || '';
      setField('assignee', identity);
    } else {
      setField('assignee', '');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        pb: 8, // extra bottom padding so last field is never cut off
      }}
    >
      <Box>
        <Typography sx={labelSx}>Organization ID</Typography>
        <TextField
          fullWidth
          size="small"
          value={config.organization_id || ''}
          onChange={(e) => setField('organization_id', e.target.value)}
          placeholder="Leave empty to use auth.organization_id"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BusinessIcon sx={{ color: '#9E9E9E', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Task Title *</Typography>
        <TextField
          fullWidth
          size="small"
          value={config.title || ''}
          onChange={(e) => setField('title', e.target.value)}
          sx={inputSx}
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Description</Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
          value={config.description || ''}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Detailed instructions for the assignee"
          sx={inputSx}
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Task Type *</Typography>
        <Autocomplete
          fullWidth
          size="small"
          options={taskTypes}
          value={selectedType}
          onChange={(e, newValue) => setField('type', newValue || null)}
          getOptionLabel={(option) => option?.title || ''}
          isOptionEqualToValue={(opt, val) => opt?.name === val?.name}
          renderOption={(props, option) => (
            <li {...props} key={option.name}>
              <span className="d-flex align-items-center">
                <ColorDot color={option.color} />
                {option.title}
              </span>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select task type"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    {selectedType && (
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <ColorDot color={selectedType.color} />
                      </InputAdornment>
                    )}
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={inputSx}
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Priority *</Typography>
        <Autocomplete
          fullWidth
          size="small"
          options={taskPriorities}
          value={selectedPriority}
          onChange={(e, newValue) => setField('priority', newValue || null)}
          getOptionLabel={(option) => option?.title || ''}
          isOptionEqualToValue={(opt, val) => opt?.name === val?.name}
          renderOption={(props, option) => (
            <li {...props} key={option.name}>
              <span className="d-flex align-items-center">
                <ColorDot color={option.color} />
                {option.title}
              </span>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select priority"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    {selectedPriority && (
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <ColorDot color={selectedPriority.color} />
                      </InputAdornment>
                    )}
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={inputSx}
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Assignee *</Typography>
        <FormControlLabel
          sx={{ mb: 0.5, '& .MuiFormControlLabel-label': { color: '#E0E0E0', fontSize: '0.82rem' } }}
          control={
            <Checkbox
              size="small"
              checked={assignToMe}
              onChange={(e) => handleAssignToMe(e.target.checked)}
              sx={{ color: '#9E9E9E', '&.Mui-checked': { color: '#FF6F5C' } }}
            />
          }
          label="Assign to me"
        />
        <Autocomplete
          fullWidth
          size="small"
          freeSolo
          disabled={assignToMe}
          options={usersList}
          value={assigneeValue}
          onChange={(e, newValue) => {
            if (typeof newValue === 'object' && newValue !== null) {
              const identity =
                newValue.identity ||
                newValue.id ||
                newValue.profile?.primary_email_address ||
                '';
              setField('assignee', identity);
            } else {
              setField('assignee', newValue || '');
            }
          }}
          onInputChange={(e, newInput, reason) => {
            if (reason === 'input') setField('assignee', newInput);
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            const p = option?.profile || option?.payload?.profile || {};
            return p.primary_email_address || p.display_name || option?.identity || option?.id || '';
          }}
          renderOption={(props, option) => {
            const p = option?.profile || option?.payload?.profile || {};
            const label =
              p.primary_email_address ||
              p.display_name ||
              option?.identity ||
              option?.id ||
              '';
            return (
              <li {...props} key={option?.identity || option?.id || label}>
                {label}
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={assignToMe ? 'Using current user' : 'Search users...'}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start" sx={{ pl: 1 }}>
                      <PersonIcon sx={{ color: '#9E9E9E', fontSize: 18 }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={inputSx}
        />
      </Box>

      <Box>
        <Typography sx={labelSx}>Due date (ISO 8601)</Typography>
        <TextField
          fullWidth
          size="small"
          value={config.due_at || ''}
          onChange={(e) => setField('due_at', e.target.value)}
          placeholder="2026-05-15T14:00:00.000Z"
          sx={inputSx}
        />
      </Box>

      <FormControlLabel
        sx={{ '& .MuiFormControlLabel-label': { color: '#E0E0E0', fontSize: '0.85rem' } }}
        control={
          <Checkbox
            size="small"
            checked={!!config.reminders}
            onChange={(e) => setField('reminders', e.target.checked)}
            sx={{ color: '#9E9E9E', '&.Mui-checked': { color: '#FF6F5C' } }}
          />
        }
        label="Enable reminders"
      />

      <FormControlLabel
        sx={{ '& .MuiFormControlLabel-label': { color: '#E0E0E0', fontSize: '0.85rem' } }}
        control={
          <Checkbox
            size="small"
            checked={!!config.has_hag}
            onChange={(e) => setField('has_hag', e.target.checked)}
            sx={{ color: '#9E9E9E', '&.Mui-checked': { color: '#FF6F5C' } }}
          />
        }
        label="Has Human Approval (requires downstream Human Approval Gate node)"
      />
    </Box>
  );
}
