import React, { useState, useCallback } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TaskOutputForm from '../../output/TaskOutputForm.component.jsx';
import { HITL_APP_SLUG } from '../../../../constants/hitl-approval-types.js';

export default function TaskOutputTab({
  task,
  onComplete,
  onOpenApp,
  CodeEditor,
}) {
  const [outputs, setOutputs] = useState(task?.outputs || {});
  const isCompleted = task?.status?.name === 'completed';
  const isRejected = task?.status?.name === 'rejected';
  const isHitlApp = task?.execution?.app_slug === HITL_APP_SLUG;
  // The approval gate is embedded inline in TaskDetailWorkspace — don't offer to launch it as an external app.
  const hasAppBinding = !!task?.execution?.app_slug && !isHitlApp;

  const handleOutputsChange = useCallback((newOutputs) => {
    setOutputs(newOutputs);
  }, []);

  const handleComplete = useCallback(
    (finalOutputs) => {
      onComplete?.(finalOutputs);
    },
    [onComplete]
  );

  const handleOpenApp = useCallback(() => {
    onOpenApp?.({
      appSlug: task.execution.app_slug,
      launchMode: task.execution.launch_mode || 'modal',
      inputPayload: {
        task_id: task.id,
        task,
        ...(task.payload || {}),
        ...(task.execution.input_payload || {}),
      },
    });
  }, [task, onOpenApp]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
      {/* App binding: Open App button */}
      {hasAppBinding && !isCompleted && !isRejected && (
        <Box>
          <Alert severity="info" sx={{ fontSize: '0.8rem', mb: 1 }}>
            This task has an associated app for output collection.
          </Alert>
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenApp}
            sx={{ textTransform: 'none' }}
          >
            Open App: {task.execution.app_slug}
          </Button>
        </Box>
      )}

      {/* Output form (auto-generated from schema or fallback) */}
      <TaskOutputForm
        requiredOutput={task?.required_output}
        outputs={isCompleted || isRejected ? task?.outputs : outputs}
        onOutputsChange={handleOutputsChange}
        onComplete={!isCompleted && !isRejected ? handleComplete : undefined}
        isReadOnly={isCompleted || isRejected}
        CodeEditor={CodeEditor}
      />

      {/* Rejected reason */}
      {isRejected && task?.outputs?.reason && (
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Rejection reason:
          </Typography>{' '}
          {task.outputs.reason}
        </Alert>
      )}
    </Box>
  );
}
