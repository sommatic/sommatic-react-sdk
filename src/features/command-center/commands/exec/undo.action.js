/**
 * Attempts to revert a previous action using its receipt_id (best-effort).
 * Looks up the receipt, checks reversibility, and executes the undo handler.
 * @param {Object} args
 * @param {string} args.receipt_id - The receipt ID of the action to revert.
 * @param {Object} registry - Command Center registry.
 * @returns {Promise<Object>} Receipt for the undo operation.
 */
export const action = async (args, registry) => {
  const { receipt_id } = args || {};

  if (!receipt_id) {
    return { ok: false, error: { code: 'MISSING_RECEIPT_ID', message: 'receipt_id is required' } };
  }

  const originalReceipt = registry?.getReceipt?.(receipt_id);
  if (!originalReceipt) {
    return { ok: false, error: { code: 'RECEIPT_NOT_FOUND', message: `Receipt [${receipt_id}] not found` } };
  }

  if (!originalReceipt.reversible) {
    return {
      ok: false,
      error: { code: 'NOT_REVERSIBLE', message: `Action [${originalReceipt.command_id}] is not reversible` },
    };
  }

  const undoResult = await attemptUndo(originalReceipt, registry);
  if (!undoResult.ok) {
    return undoResult;
  }

  const undoReceipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.undo',
    args,
    reversible: false,
    original_receipt_id: receipt_id,
    original_command: originalReceipt.command_id,
  });

  return {
    ok: true,
    title: `Reverted [${originalReceipt.command_id}]`,
    data: undoResult.data,
    receipt_id: undoReceipt?.id,
  };
};

async function attemptUndo(receipt, registry) {
  const { command_id, undo_args } = receipt;

  if (command_id === 'command_center.exec.ui.open_surface' && undo_args?.surface_id) {
    const surface = registry?.getSurface?.(undo_args.surface_id);
    if (surface?.handlers?.close) {
      try {
        await surface.handlers.close();
        return { ok: true, data: { action: 'close_surface', surface_id: undo_args.surface_id } };
      } catch (err) {
        return { ok: false, error: { code: 'UNDO_FAILED', message: err.message } };
      }
    }
  }

  if (command_id === 'command_center.exec.ui.set_fields' && receipt.previous_values) {
    const surface = registry?.getSurface?.(receipt.args?.surface_id);
    if (surface?.handlers?.setFields) {
      try {
        await surface.handlers.setFields(receipt.previous_values);
        return { ok: true, data: { action: 'restore_fields', restored: receipt.previous_values } };
      } catch (err) {
        return { ok: false, error: { code: 'UNDO_FAILED', message: err.message } };
      }
    }
  }

  if (command_id === 'command_center.exec.ui.act' && undo_args?.target_ref) {
    const resolved = registry?.resolveTarget?.(undo_args.target_ref);
    if (resolved?.target?.handlers?.undo) {
      try {
        const result = await resolved.target.handlers.undo();
        return { ok: true, data: { action: 'target_undo', target_ref: undo_args.target_ref, result } };
      } catch (err) {
        return { ok: false, error: { code: 'UNDO_FAILED', message: err.message } };
      }
    }
  }

  return {
    ok: false,
    error: { code: 'NO_UNDO_STRATEGY', message: `No undo strategy available for [${command_id}]` },
  };
}
