/**
 * Applies a lifecycle transition to a HITL Task.
 * Covers: assign, claim, start, complete, reject, invalidate, expire.
 * @param {Object} args
 * @param {string} args.task_id - ID of the task to transition.
 * @param {string} args.transition_name - Transition to apply (assign|claim|start|complete|reject|invalidate|expire).
 * @param {Object} [args.payload] - Extra data for the transition (e.g. assignee, outputs, reason).
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with transition result.
 */
export const action = async (args, registry) => {
  const { task_id, transition_name, payload } = args || {};

  if (!task_id || !transition_name) {
    return { ok: false, error: { code: 'MISSING_ARGS', message: 'task_id and transition_name are required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const response = await taskStore.transition({ id: task_id, transition_name, payload });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.transition',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Transition '${transition_name}' applied to task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'TRANSITION_FAILED', message: err.message } };
  }
};
