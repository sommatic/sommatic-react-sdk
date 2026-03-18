import React, { useCallback, useEffect, useState } from 'react';
import { PopUp, openSnackbar } from '@link-loom/react-sdk';
import TaskDetailWorkspace from '../tasks/detail/TaskDetailWorkspace.component.jsx';
import WorkManagementTaskService from '../../services/work-management/task/task.service.js';

/**
 * TaskQuickViewOverlay
 *
 * Global, layout-level overlay that opens a task detail workspace in-place.
 * Activated by dispatching `sommatic::open-task` with { task } in detail.
 * No navigation — works from any page in the app.
 *
 * Usage:
 *   window.dispatchEvent(new CustomEvent('sommatic::open-task', { detail: { task } }));
 */
function TaskQuickViewOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState(null);

  useEffect(() => {
    const handleOpenTask = (event) => {
      const taskData = event.detail?.task;
      if (!taskData?.id) return;
      setTask(taskData);
      setIsOpen(true);
    };

    window.addEventListener('sommatic::open-task', handleOpenTask);
    return () => window.removeEventListener('sommatic::open-task', handleOpenTask);
  }, []);

  const handleTransition = useCallback(
    async (transitionName) => {
      if (!task?.id) return;

      const response = await new WorkManagementTaskService().transition({
        id: task.id,
        transition_name: transitionName,
      });

      if (!response?.success) {
        openSnackbar(`Transition failed: ${response?.message || 'Unknown error'}`, 'error');
        return;
      }

      setTask(response.result);
      openSnackbar(`Task ${transitionName} successful`, 'success');
    },
    [task]
  );

  const handleComplete = useCallback(
    async (outputs) => {
      if (!task?.id) return;

      const response = await new WorkManagementTaskService().transition({
        id: task.id,
        transition_name: 'complete',
        payload: { outputs },
      });

      if (!response?.success) {
        openSnackbar(`Complete failed: ${response?.message || 'Unknown error'}`, 'error');
        return;
      }

      setTask(response.result);
      openSnackbar('Task completed successfully', 'success');
    },
    [task]
  );

  if (!task) return null;

  return (
    <PopUp isOpen={isOpen} setIsOpen={setIsOpen}>
      <div style={{ minWidth: '640px', maxWidth: '640px', margin: '0 auto' }}>
        <div
          className="card mb-0"
          style={{
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <TaskDetailWorkspace
            task={task}
            onTransition={handleTransition}
            onComplete={handleComplete}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </div>
    </PopUp>
  );
}

export default TaskQuickViewOverlay;
