import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PopUp, openSnackbar } from '@link-loom/react-sdk';
import { useAuth } from '@veripass/react-sdk';
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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState(null);

  // Build a canonical { id, name } for the HAG to auto-claim when the current
  // user approves/rejects a task that wasn't claimed yet. Same cascade used by
  // TaskManagerManager + TaskManagerTransition for consistency.
  const currentUser = useMemo(() => {
    if (!user?.identity) return null;
    const profile = user?.payload?.profile || {};
    const name =
      profile.display_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.primary_email_address ||
      user.identity;
    return { id: user.identity, name };
  }, [user]);

  useEffect(() => {
    const handleOpenTask = async (event) => {
      const taskData = event.detail?.task;
      if (!taskData?.id) return;

      // Open immediately with whatever the event carried so the UI feels responsive.
      setTask(taskData);
      setIsOpen(true);

      // Re-fetch the task from the backend to make sure we have the full,
      // up-to-date entity — notification payloads can be stale or partial
      // (e.g. missing required_output.schema, which the HAG needs to render
      // the Required outputs section).
      try {
        const response = await new WorkManagementTaskService().getByParameters({
          queryselector: 'id',
          search: taskData.id,
        });
        const fresh = response?.result?.items?.[0];
        if (fresh?.id) setTask(fresh);
      } catch (_) {
        // best effort — keep the notification-provided task if refetch fails
      }
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

  const handleOpenApp = useCallback(({ appSlug, launchMode, inputPayload }) => {
    if (!appSlug) return;

    window.dispatchEvent(
      new CustomEvent('sommatic:open-command-center', {
        detail: {
          appEmbed: {
            app_slug: appSlug,
            route_path: '/',
            launch_mode: launchMode || 'modal',
            input_payload: inputPayload || {},
          },
        },
      }),
    );

    setIsOpen(false);
  }, []);

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

  // Called by the embedded HAG panel after it transitions the task via
  // useHitlSubmit. Updates local state and re-broadcasts a task-notification
  // event so any open task lists re-render.
  const handleHitlComplete = useCallback((updatedTask) => {
    if (!updatedTask) return;
    setTask(updatedTask);
    window.dispatchEvent(
      new CustomEvent('sommatic::task-notification', {
        detail: {
          kind: updatedTask.status?.name === 'rejected' ? 'rejected' : 'completed',
          task: updatedTask,
        },
      }),
    );
  }, []);

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
            onOpenApp={handleOpenApp}
            onClose={() => setIsOpen(false)}
            currentUser={currentUser}
            onHitlComplete={handleHitlComplete}
          />
        </div>
      </div>
    </PopUp>
  );
}

export default TaskQuickViewOverlay;
