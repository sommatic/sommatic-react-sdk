import WorkflowOrchestrationFlowDefinitionService from '../../../../services/workflow-orchestration/control-plane/flow-design/flow-definition/flow-definition.service';

const NAVIGATOR_APP_SLUG = 'sommatic-workflow-navigator';

/**
 * Resolves a workflow definition by name within an organization, so the run can
 * be triggered from any screen (not only when the workflow is open on the page).
 * Uses the backend's name → slug → id search cascade and returns the first match
 * with its full graph, so the trigger node's example input can be derived.
 *
 * @param {string} name - Free-text workflow name the user referenced.
 * @param {string} organization_id - Org scope for the lookup.
 * @returns {Promise<Object|null>} The matched flow definition, or null.
 */
const resolveDefinitionByName = async (name, organization_id) => {
  try {
    const service = new WorkflowOrchestrationFlowDefinitionService();
    const response = await service.getByParameters({
      queryselector: 'search',
      search: name,
      organization_id,
      exclude_status: 'deleted',
      pageSize: 1,
    });
    return response?.result?.items?.[0] || null;
  } catch (err) {
    return null;
  }
};

/**
 * Resolves a workflow by intent and HANDS IT TO THE WORKFLOW NAVIGATOR APP.
 *
 * This command does NOT execute the workflow itself. The app is the executor:
 * the Command Center opens the Workflow Navigator (in command-center launch mode)
 * with the resolved run descriptor as `sdk.input`. The app then runs the workflow,
 * shows live per-node progress, and returns the result via `sdk.submitOutput()` so
 * the execution plan can continue (e.g. chain to another app). Execution provenance
 * is stamped on the run (`execution_source`) — no pre-defined Trigger artifact is
 * required, so any runnable workflow runs while staying fully attributable.
 *
 * Resolution cascade (explicit args win): `flow_definition_id`/`flow_version_id`
 * → the workflow open on screen (page-context run descriptor) → `workflow_name`
 * resolved across the organization.
 *
 * @param {Object} args
 * @param {string} [args.flow_definition_id]
 * @param {string} [args.flow_version_id]
 * @param {string} [args.workflow_name]
 * @param {Object} [args.input]
 * @param {Object} registry - Command Center registry. Exposes `currentUser`, `getSnapshot`, `pushReceipt`.
 * @returns {Promise<Object>} An `app-embed` descriptor that opens the Navigator.
 */
export const action = async (args, registry) => {
  const { input, workflow_name } = args || {};
  let { flow_definition_id, flow_version_id } = args || {};

  const organization_id = registry?.currentUser?.payload?.organization_id || '';
  const user_identity = registry?.currentUser?.identity || '';

  // Fallback 1: the workflow open on screen (e.g. "ejecuta este workflow").
  const pageRun =
    !flow_definition_id && !flow_version_id
      ? registry?.getSnapshot?.('page-context')?.payload?.run || null
      : null;
  if (pageRun?.runnable) {
    flow_definition_id = flow_definition_id || pageRun.flow_definition_id || null;
    flow_version_id = flow_version_id || pageRun.flow_version_id || null;
  }
  let resolvedInputExample = pageRun?.input_example || null;
  let resolvedName = pageRun?.name || null;

  // Fallback 2: resolve by name across the org when nothing is open on screen.
  if (!flow_definition_id && !flow_version_id && workflow_name) {
    const match = await resolveDefinitionByName(workflow_name, organization_id);
    if (match) {
      flow_definition_id = match.id || null;
      resolvedName = match.name || resolvedName;
      const triggerNode = (match.draft_nodes || []).find((node) => (node.operator_slug || '').includes('trigger'));
      resolvedInputExample = triggerNode?.config?.payload_template || resolvedInputExample;
    }
  }

  if (!flow_definition_id && !flow_version_id) {
    return { ok: false, error: { code: 'MISSING_FLOW_ID', message: 'No workflow could be resolved. Provide flow_definition_id, flow_version_id, or a workflow_name that matches one in your organization.' } };
  }

  // Caller-supplied input wins; otherwise seed with the trigger's example payload.
  const runInput = input && Object.keys(input).length > 0 ? { ...input } : { ...(resolvedInputExample || {}) };

  // Bind an uploaded file (attached in the Command Center, already in storage)
  // as the run's `source_url` — but only when the trigger actually expects one
  // and the caller didn't provide it. The example payload may carry a placeholder
  // URL, so we override it with the real attachment. This is what lets a user
  // attach a PDF and say "extrae el texto" without pasting a URL.
  const triggerExpectsSourceUrl = Object.prototype.hasOwnProperty.call(runInput, 'source_url');
  const callerProvidedSourceUrl = !!(input && input.source_url);
  if (triggerExpectsSourceUrl && !callerProvidedSourceUrl) {
    const attachments = (registry?.getActiveAttachments?.() || []).filter((file) => file && file.url);
    const latestAttachmentUrl = attachments.length ? attachments[attachments.length - 1].url : null;
    if (latestAttachmentUrl) {
      runInput.source_url = latestAttachmentUrl;
    }
  }

  // Bind the current user as assignee when the trigger expects one — workflows
  // with a HITL gate or an app handoff create a Task assigned to whoever ran it.
  // The person triggering the run from the Command Center is that assignee.
  if (Object.prototype.hasOwnProperty.call(runInput, 'assignee') && !runInput.assignee && user_identity) {
    runInput.assignee = user_identity;
  }
  if (Object.prototype.hasOwnProperty.call(runInput, 'organization_id') && !runInput.organization_id && organization_id) {
    runInput.organization_id = organization_id;
  }

  // Provenance stamped at execution time, independent of any Trigger artifact.
  const execution_source = {
    source: 'command-center',
    app_slug: NAVIGATOR_APP_SLUG,
    actor: user_identity || null,
    intent_text: workflow_name || null,
  };

  const receipt = registry.pushReceipt?.({
    command_id: 'command_center.exec.workflow.run',
    args,
    reversible: false,
  });

  // Hand the run to the Navigator app — the app executes it, streams progress,
  // and submits the result back to continue the plan.
  return {
    ok: true,
    type: 'app-embed',
    title: `Running workflow${resolvedName ? ` "${resolvedName}"` : ''}`,
    app_embed: {
      app_slug: NAVIGATOR_APP_SLUG,
      route_path: '/run',
      input_payload: {
        run: {
          flow_definition_id: flow_definition_id || null,
          flow_version_id: flow_version_id || null,
          input: runInput,
          organization_id,
          user_identity,
          execution_source,
          name: resolvedName || null,
        },
      },
      launch_mode: 'command-center',
    },
    receipt_id: receipt?.id,
  };
};
