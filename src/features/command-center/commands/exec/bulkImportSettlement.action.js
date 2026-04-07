/**
 * Opens the tabular workbench pre-configured with the beneficiary column schema
 * for bulk data entry / paste import.  The workbench output is expected to be
 * chained into fgn-settlements by the host layout.
 *
 * @param {Object} args
 * @param {string} [args.sentence_id]          - Target sentence JL ID.
 * @param {string} [args.sentence_description] - Description for the sentence.
 * @param {Object} registry                    - Command Center registry.
 * @returns {Object} app-embed descriptor for sommatic-tabular-workbench.
 */
export const action = async (args, registry) => {
  const { sentence_id, sentence_description } = args || {};

  const columns = [
    { key: 'name', label: 'Nombre completo', type: 'text', required: true },
    { key: 'id_number', label: 'Cédula', type: 'text', required: false },
    { key: 'acceptance_date', label: 'Fecha aceptación (YYYY-MM-DD)', type: 'date', required: true },
    { key: 'execution_date', label: 'Fecha ejecutoria (YYYY-MM-DD)', type: 'date', required: true },
    { key: 'turn_date', label: 'Fecha turno (YYYY-MM-DD)', type: 'date', required: true },
    { key: 'final_date', label: 'Fecha final (YYYY-MM-DD)', type: 'date', required: true },
    { key: 'base_salary_smmlv', label: 'Perjuicios morales (SMMLV)', type: 'number', required: true },
    { key: 'emerging_damages_pesos', label: 'Daño emergente (COP)', type: 'number', required: false },
    { key: 'lost_earnings_pesos', label: 'Lucro cesante (COP)', type: 'number', required: false },
    { key: 'other_damages_pesos', label: 'Otros perjuicios (COP)', type: 'number', required: false },
  ];

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.settlement.bulk_import',
    args,
    reversible: false,
  });

  return {
    ok: true,
    type: 'app-embed',
    title: 'Opening bulk import for settlements',
    app_embed: {
      app_slug: 'sommatic-tabular-workbench',
      route_path: '/workbench',
      input_payload: {
        columns,
        data: [],
        options: {
          editable: true,
          exportable: true,
          allow_add_rows: true,
          allow_delete_rows: true,
        },
        _settlement_context: {
          sentence_id: sentence_id || null,
          sentence_description: sentence_description || null,
        },
      },
      launch_mode: 'command-center',
    },
    receipt_id: receipt?.id,
  };
};
