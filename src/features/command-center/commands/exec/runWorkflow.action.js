import WorkflowOrchestrationExecutionStreamService from '../../../../streams/workflow-orchestration/execution/execution-stream.service';

// Hard ceiling for how long a live-handoff subscription stays open waiting for
// the run to finish. The durable Task always carries the descriptor, so this is
// only the best-effort "open the app now" path — if the run outlives the window
// we drop the live subscription and let the Task deliver later.
const HANDOFF_SUBSCRIPTION_TTL_MS = 15 * 60 * 1000;

/**
 * Opens a self-terminating per-instance SSE subscription that watches one run
 * and, when it completes carrying an `app_handoff_descriptor`, reuses the
 * existing chain-bridge (`sommatic:open-command-center`) to open the target app
 * in the live Command Center session.
 *
 * This is the live half of the handoff's dual delivery: the worker always
 * persists the descriptor on a durable HITL Task, and additionally — when the
 * actor still has a session open — we open the app instantly here. It is
 * fire-and-forget: any failure degrades silently to the Task path.
 *
 * Skipped for version-only runs because the backend SSE channel is keyed on
 * `flow_definition_id`; those runs are still covered by the Task. All traffic
 * stays on the backend proxy stream — never the orchestrator directly.
 *
 * @param {Object} channel
 * @param {string} channel.flow_definition_id
 * @param {string} channel.user_identity
 * @param {string} channel.instance_id
 */
const subscribeForLiveHandoff = ({ flow_definition_id, user_identity, instance_id }) => {
  if (!flow_definition_id || !user_identity || !instance_id) {
    return;
  }

  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return;
  }

  const stream = new WorkflowOrchestrationExecutionStreamService();
  stream.setParams({ flow_definition_id, user_identity, instance_id });

  let closed = false;
  let timer = null;

  const cleanup = () => {
    if (closed) {
      return;
    }
    closed = true;
    clearTimeout(timer);
    stream.disconnect();
  };

  stream.on('execution-completed', (data) => {
    const descriptor = data?.result?.app_handoff_descriptor;
    if (descriptor?.app_slug) {
      window.dispatchEvent(
        new CustomEvent('sommatic:open-command-center', { detail: { appEmbed: descriptor } }),
      );
    }
    cleanup();
  });

  stream.on('execution-failed', () => {
    cleanup();
  });

  timer = setTimeout(cleanup, HANDOFF_SUBSCRIPTION_TTL_MS);

  stream.connect();
};

/**
 * Triggers a workflow run by intent (manual trigger).
 *
 * The Command Center fires and observes; it does NOT orchestrate. This action
 * only kicks off a FlowInstance through the backend proxy and returns its id so
 * the surface can subscribe to per-instance progress (SSE). All workflow
 * interaction goes through `bsh.sommatic.backend.svc` — never the orchestrator
 * directly.
 *
 * @param {Object} args
 * @param {string} [args.flow_definition_id] - Draft/definition to run (test mode).
 * @param {string} [args.flow_version_id] - Compiled version to run (prod mode). Takes priority over definition.
 * @param {Object} [args.input] - Input payload for the run.
 * @param {string} [args.execution_mode] - 'async' (default) returns immediately; 'sync' waits for the terminal result.
 * @param {Object} registry - Command Center registry. Exposes `workflowExecutionService` and `currentUser`.
 * @returns {Promise<Object>} Receipt with the created instance.
 */
export const action = async (args, registry) => {
  const { flow_definition_id, flow_version_id, input, execution_mode } = args || {};

  if (!flow_definition_id && !flow_version_id) {
    return { ok: false, error: { code: 'MISSING_FLOW_ID', message: 'flow_definition_id or flow_version_id is required' } };
  }

  const workflowService = registry?.workflowExecutionService;
  if (!workflowService) {
    return { ok: false, error: { code: 'NO_WORKFLOW_SERVICE', message: 'Workflow execution service is not configured' } };
  }

  try {
    const organization_id = registry?.currentUser?.payload?.organization_id || '';
    const user_identity = registry?.currentUser?.identity || '';

    const response = await workflowService.executeWorkflow({
      organization_id,
      flow_definition_id: flow_definition_id || null,
      flow_version_id: flow_version_id || null,
      input: input || {},
      user_identity,
      execution_mode: execution_mode || 'async',
    });

    const result = response?.result || response;
    const instance = result?.instance || null;

    if (!instance?.id) {
      return { ok: false, error: { code: 'RUN_FAILED', message: 'Workflow did not return an instance id' } };
    }

    // Live half of the handoff dual-delivery: when this run finishes with an
    // app_handoff_descriptor, open the target app in the current session. The
    // durable Task (created by the worker) is the source of truth; this is a
    // best-effort instant open that no-ops for version-only runs.
    subscribeForLiveHandoff({
      flow_definition_id: flow_definition_id || null,
      user_identity,
      instance_id: instance.id,
    });

    const receipt = registry.pushReceipt?.({
      command_id: 'command_center.exec.workflow.run',
      args,
      reversible: false,
      result,
    });

    return {
      ok: true,
      title: `Started workflow run [${instance.id}]`,
      data: { instance_id: instance.id, status: instance.status },
      receipt_id: receipt?.id,
    };
  } catch (err) {
    return { ok: false, error: { code: 'RUN_FAILED', message: err.message } };
  }
};
