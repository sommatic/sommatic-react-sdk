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
    const organization_id = registry?.currentUser?.payload?.organization_id;
    const user_identity = registry?.currentUser?.identity || '';

    const payload = { queryselector: 'inbox' };
    if (user_identity) payload.user_id = user_identity;
    if (status) payload.include_status = status;
    if (organization_id) payload.organization_id = organization_id;

    console.log('[listTasksInbox] payload →', JSON.stringify(payload));

    const response = await taskStore.getByParameters(payload);

    console.log('[listTasksInbox] raw response →', JSON.stringify(response));

    const tasks = response?.result?.items || response?.items || [];

    console.log('[listTasksInbox] tasks extracted →', tasks.length, tasks.map((t) => t.title || t.id));

    const summary = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status?.name,
    }));

    return { ok: true, tasks: summary, total: tasks.length };
  } catch (err) {
    return { ok: false, error: { code: 'FETCH_FAILED', message: err.message } };
  }
};
