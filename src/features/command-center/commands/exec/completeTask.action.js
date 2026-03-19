/**
 * Completes a HITL Task with the provided validated outputs.
 * @param {Object} args
 * @param {string} args.task_id - The ID of the task to complete.
 * @param {Object} args.outputs - The task outputs/results to submit.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with completion result.
 */
export const action = async (args, registry) => {
  const { task_id, outputs } = args || {};

  if (!task_id) {
    return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };
  }

  if (!outputs) {
    return { ok: false, error: { code: 'MISSING_OUTPUTS', message: 'outputs are required to complete a task' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const response = await taskStore.transition({ id: task_id, transition_name: 'complete', payload: { outputs } });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.complete',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Completed task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'COMPLETE_FAILED', message: err.message } };
  }
};
