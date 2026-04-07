/**
 * Opens the FGN Settlements app with an optional pre-filled payload.
 *
 * Supports three modes:
 * - create:  opens /new-sentence with optional sentence_id, description, and beneficiaries.
 * - view:    opens /sentences/{sentence_id} to inspect an existing sentence.
 * - add_beneficiary: opens /sentences/{sentence_id} and triggers the add-beneficiary flow.
 *
 * @param {Object} args
 * @param {string} [args.mode]                 - 'create' | 'view' | 'add_beneficiary'
 * @param {string} [args.sentence_id]          - JL ID (e.g. "JL-2024-001").
 * @param {string} [args.sentence_description] - Human-readable description of the sentence.
 * @param {string} [args.route_path]           - Explicit route override.
 * @param {Array}  [args.beneficiaries]        - Pre-filled beneficiary data array.
 * @param {Object} registry                    - Command Center registry.
 * @returns {Object} app-embed descriptor.
 */
export const action = async (args, registry) => {
  const {
    mode = 'create',
    sentence_id,
    sentence_description,
    beneficiaries,
    route_path,
  } = args || {};

  const inputPayload = {};
  if (mode) inputPayload.mode = mode;
  if (sentence_id) inputPayload.sentence_id = sentence_id;
  if (sentence_description) inputPayload.sentence_description = sentence_description;
  if (Array.isArray(beneficiaries) && beneficiaries.length > 0) {
    inputPayload.beneficiaries = beneficiaries;
  }

  const resolvedRoute = route_path || resolveRoute(mode, sentence_id);

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.settlement.open',
    args,
    reversible: false,
  });

  return {
    ok: true,
    type: 'app-embed',
    title: `Opening settlements [${mode}]${sentence_id ? ` — ${sentence_id}` : ''}`,
    app_embed: {
      app_slug: 'fgn-settlements',
      route_path: resolvedRoute,
      input_payload: inputPayload,
      launch_mode: 'command-center',
    },
    receipt_id: receipt?.id,
  };
};

function resolveRoute(mode, sentenceId) {
  if (mode === 'view' && sentenceId) return `/sentences/${sentenceId}`;
  if (mode === 'add_beneficiary' && sentenceId) return `/sentences/${sentenceId}`;
  if (mode === 'create') return '/new-sentence';
  return '/';
}
