/**
 * Retrieves the detail of a specific HITL Task, including its required inputs schema.
 * @param {Object} args
 * @param {string} args.task_id - The ID of the task to retrieve.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} { task, required_inputs_schema }
 */
export const action = async (args, registry) => {
  const { task_id } = args || {};

  if (!task_id) {
    return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const response = await taskStore.getByParameters({ queryselector: 'id', search: task_id });
    const task = response?.result?.items?.[0] || response?.items?.[0];

    if (!task) {
      return { ok: false, error: { code: 'TASK_NOT_FOUND', message: `Task [${task_id}] not found` } };
    }

    return {
      ok: true,
      task,
      required_inputs_schema: task.required_inputs_schema || task.input_schema || null,
    };
  } catch (err) {
    return { ok: false, error: { code: 'FETCH_FAILED', message: err.message } };
  }
};
