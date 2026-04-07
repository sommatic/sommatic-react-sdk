/**
 * Re-calculates (re-liquida) all beneficiaries of an existing judicial settlement.
 *
 * Opens the settlements app at the sentence detail view and triggers recalculation
 * by passing a recalculate flag in the input payload.
 *
 * @param {Object} args
 * @param {string} args.sentence_id - JL ID of the sentence to recalculate.
 * @param {Object} registry         - Command Center registry.
 * @returns {Object} app-embed descriptor targeting the sentence detail with recalculate flag.
 */
export const action = async (args, registry) => {
  const { sentence_id } = args || {};

  if (!sentence_id) {
    return {
      ok: false,
      error: { code: 'MISSING_SENTENCE_ID', message: 'sentence_id is required to recalculate.' },
    };
  }

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.settlement.recalculate',
    args,
    reversible: false,
  });

  return {
    ok: true,
    type: 'app-embed',
    title: `Recalculating settlement ${sentence_id}`,
    app_embed: {
      app_slug: 'fgn-settlements',
      route_path: `/sentences/${sentence_id}`,
      input_payload: {
        mode: 'recalculate',
        sentence_id,
      },
      launch_mode: 'command-center',
    },
    receipt_id: receipt?.id,
  };
};
