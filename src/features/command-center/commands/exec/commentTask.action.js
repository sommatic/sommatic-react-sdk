/**
 * Adds a comment to a HITL Task (lightweight audit trail).
 * @param {Object} args
 * @param {string} args.task_id - The ID of the task to comment on.
 * @param {string} args.comment - The comment text to add.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with comment result.
 */
export const action = async (args, registry) => {
  const { task_id, comment } = args || {};

  if (!task_id) {
    return { ok: false, error: { code: 'MISSING_TASK_ID', message: 'task_id is required' } };
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    return { ok: false, error: { code: 'MISSING_COMMENT', message: 'A non-empty comment is required' } };
  }

  const taskStore = registry?.taskService;
  if (!taskStore) {
    return { ok: false, error: { code: 'NO_TASK_SERVICE', message: 'Task service is not configured' } };
  }

  try {
    const response = await taskStore.update({ id: task_id, action: 'comment', comment: comment.trim() });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.comment',
      args: { task_id, comment: comment.trim() },
      reversible: false,
      result,
    });

    return { ok: true, title: `Added comment to task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'COMMENT_FAILED', message: err.message } };
  }
};
