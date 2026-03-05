/**
 * Lists HITL Tasks assigned to the current user.
 * Queries the task store/service for pending and in-progress tasks.
 * @param {Object} args
 * @param {string} [args.status] - Filter by task status (e.g. 'pending', 'in_progress', 'completed').
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} { tasks: Array }
 */
export const action = async (args, registry) => {
  const { status } = args || {};
  const taskStore = registry?.taskService;

  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const payload = { queryselector: 'list' };
    if (status) {
      payload.status = status;
    }

    const response = await taskStore.get(payload);
    const tasks = response?.result?.items || response?.items || [];

    return { ok: true, tasks };
  } catch (err) {
    return { ok: false, error: { code: 'FETCH_FAILED', message: err.message } };
  }
};
