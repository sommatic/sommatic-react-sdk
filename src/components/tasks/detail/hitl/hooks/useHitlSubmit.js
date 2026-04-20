import { useState, useCallback } from 'react';
import WorkManagementTaskService from '../../../../../services/work-management/task/task.service.js';
import { openSnackbar } from '@link-loom/react-sdk';

export default function useHitlSubmit({ taskId, onComplete, currentUser, taskIsClaimed }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitDecision = useCallback(
    async (decision, outputPayload) => {
      if (!taskId) return;

      const transitionName = decision === 'rejected' ? 'reject' : 'complete';

      setIsSubmitting(true);
      setError(null);

      // If the task hasn't been claimed yet, pass the caller's identity so the
      // backend auto-claims as part of the complete/reject transition.
      const payload = { outputs: outputPayload };
      if (!taskIsClaimed && currentUser?.id) {
        payload.claimed_by = {
          id: currentUser.id,
          name: currentUser.name || currentUser.id,
        };
      }

      try {
        const response = await new WorkManagementTaskService().transition({
          id: taskId,
          transition_name: transitionName,
          payload,
        });

        if (!response?.success) {
          const message = response?.message || 'Unknown error';
          setError(message);
          openSnackbar(`Decision failed: ${message}`, 'error');
          return;
        }

        openSnackbar(
          `Task ${transitionName === 'reject' ? 'rejected' : 'completed'} successfully`,
          'success',
        );
        onComplete?.(response.result);
      } catch (err) {
        setError(err.message);
        openSnackbar(`Error: ${err.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [taskId, onComplete, currentUser, taskIsClaimed],
  );

  return { submitDecision, isSubmitting, error };
}
