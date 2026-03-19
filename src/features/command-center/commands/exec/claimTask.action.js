/**
 * Takes ownership of a HITL Task, assigning it to the current user.
 * @param {Object} args
 * @param {string} args.task_id - The ID of the task to claim.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with claim result.
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
    const user = registry?.currentUser;
    const profile = user?.payload?.profile || {};
    const claimedByName =
      profile.display_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.primary_email_address ||
      user?.identity ||
      '';

    const response = await taskStore.transition({
      id: task_id,
      transition_name: 'claim',
      payload: { claimed_by: { id: user?.identity, name: claimedByName } },
    });
    const result = response?.result || response;

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.tasks.claim',
      args,
      reversible: false,
      result,
    });

    return { ok: true, title: `Claimed task [${task_id}]`, data: result, receipt_id: receipt?.id };
  } catch (err) {
    return { ok: false, error: { code: 'CLAIM_FAILED', message: err.message } };
  }
};
