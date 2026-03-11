/**
 * Executes a semantic command published by a feature module.
 * Looks up the command by its ID in the registry and invokes its action.
 * @param {Object} args
 * @param {string} args.command_id - The ID of the command to invoke.
 * @param {Object} [args.args] - Arguments to pass to the command action.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt with command result.
 */
export const action = async (args, registry) => {
  const { command_id, args: commandArgs } = args || {};

  if (!command_id) {
    return { ok: false, error: { code: 'MISSING_COMMAND_ID', message: 'command_id is required' } };
  }

  const commands = registry?.commands || [];
  const cmdDef = commands.find((cmd) => cmd.id === command_id);

  if (!cmdDef) {
    return { ok: false, error: { code: 'COMMAND_NOT_FOUND', message: `Command [${command_id}] not found` } };
  }

  if (!cmdDef.action) {
    return { ok: false, error: { code: 'NO_ACTION', message: `Command [${command_id}] has no action defined` } };
  }

  let result;
  try {
    result = await cmdDef.action(commandArgs);
  } catch (err) {
    return { ok: false, error: { code: 'INVOKE_FAILED', message: err.message } };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.command.invoke',
    args,
    reversible: false,
    invoked_command: command_id,
    result,
  });

  return { ok: true, title: `Invoked command [${command_id}]`, result, receipt_id: receipt?.id };
};
