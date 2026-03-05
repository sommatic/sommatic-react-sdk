/**
 * Creates a new HITL Task.
 * @param {Object} args
 * @param {string} args.title - Short task title (the goal).
 * @param {Object} args.type - Task type object with id and name.
 * @param {Object} args.priority - Task priority object with id and name.
 * @param {Object} args.required_output - Required output definition with schema and optional ui_hint.
 * @param {Object} [args.assignee] - Optional assignee object.
 * @param {Object} [args.sla] - Optional SLA object with due_at and sla_ms.
 * @param {Object} [args.payload] - Optional context payload.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with created task result.
 */
export const action = async (args, registry) => {
  const { title, type, priority, required_output, assignee, sla, payload } = args || {};

  if (!title || !type || !priority || !required_output) {
    return { ok: false, error: { code: 'MISSING_ARGS', message: 'title, type, priority and required_output are required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const response = await taskStore.create({ title, type, priority, required_output, assignee, sla, payload });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.create',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Created task [${result?.id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'CREATE_FAILED', message: err.message } };
  }
};
