import React from 'react';
import BoltIcon from '@mui/icons-material/Bolt';
import * as Read from './read';
import * as Exec from './exec';

const DefaultBoltIcon = React.createElement(BoltIcon);

/**
 * Returns the list of read commands.
 * @param {Object} dependencies
 * @param {Function} dependencies.getContext - Function to retrieve context by source ID.
 * @param {Object} dependencies.icons - Icon components.
 * @param {Object} dependencies.registry - Command Center registry with stores and helpers.
 * @returns {Array} List of read command definitions.
 */
export const getReadCommands = ({ getContext, icons, registry }) => [
  {
    id: 'command_center.read.scope.get',
    label: '/get-current-scope',
    description: 'Get the current scope (route, module, focus)',
    skills: {},
    action: () => Read.getCurrentScope(getContext('page-context')),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.insights.list',
    label: '/list-insights',
    description: 'List available InsightSources by scope',
    skills: {},
    action: (args) => Read.listInsights(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.insights.describe',
    label: '/describe-insight',
    description: 'View metadata + schema of an InsightSource',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        source_id: { type: 'string', description: "ID of the InsightSource to describe. Use 'page-context' for the current page." },
      },
      required: ['source_id'],
    },
    action: (args) => Read.describeInsight(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.insights.snapshot',
    label: '/snapshot-insight',
    description: 'Pull snapshot (respects TTL/cache)',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        source_id: { type: 'string', description: "ID of the InsightSource to snapshot. Use 'page-context' for the current page." },
      },
      required: ['source_id'],
    },
    action: (args) => Read.snapshotInsight(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.context.pack',
    label: '/context-pack',
    description: 'Pull multiple insights (Top-N or by IDs)',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        source_ids: { type: 'array', items: { type: 'string' }, description: 'Specific source IDs to snapshot. Leave empty to use top_n.' },
        top_n: { type: 'number', description: 'Number of top sources to snapshot when source_ids is not provided.' },
      },
    },
    action: (args) => Read.contextPack(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.page.outline',
    label: '/page-outline',
    description: "What's on the page using insights (non-DOM)",
    skills: {},
    schema: {
      type: 'object',
      properties: {
        detail_level: { type: 'string', enum: ['low', 'high'], description: "'low' returns source list only. 'high' includes payload keys and surface info." },
      },
    },
    action: (args) => Read.getPageOutline(getContext('page-context'), args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.selection.get',
    label: '/get-selection',
    description: 'Get opt-in selection (text/IDs)',
    skills: {},
    action: () => Read.getSelection(registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.focus.get',
    label: '/get-focus',
    description: 'Get active focus (entity/active panel)',
    skills: {},
    action: () => Read.getFocus(registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.ui.surfaces.list',
    label: '/list-surfaces',
    description: 'List published surfaces (modals, grids, forms)',
    skills: {},
    action: () => Read.listSurfaces(registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.ui.targets.list',
    label: '/list-targets',
    description: 'List targets of a surface',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: 'ID of the surface to inspect. Use /list-surfaces first to get available IDs.' },
      },
      required: ['surface_id'],
    },
    action: (args) => Read.listTargets(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.observe.ui',
    label: '/observe-ui',
    description: 'Discover candidate actions from instruction',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        instruction: { type: 'string', description: 'Natural language instruction describing the desired action (e.g. "select rows in the grid").' },
        surface_id: { type: 'string', description: 'Optional surface ID to limit the search scope.' },
      },
      required: ['instruction'],
    },
    action: (args) => Read.observeUi(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.extract.from_insight',
    label: '/extract-from-insight',
    description: 'Extract structured data from an InsightSource',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        source_id: { type: 'string', description: "ID of the InsightSource to extract from. Use 'page-context' for the current page." },
        schema: { type: 'object', description: 'Optional schema describing which fields to extract. If omitted, returns the full payload.' },
      },
      required: ['source_id'],
    },
    action: (args) => Read.extractFromInsight(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.extract.from_targets',
    label: '/extract-from-targets',
    description: 'Extract data from published targets',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        target_refs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of target references. Use only values from context.client.targets_by_surface (format surface_id::target_id). If the user asks for a field by name, match it to the target\'s label or id in that list.',
        },
      },
      required: ['target_refs'],
    },
    action: (args) => Read.extractFromTargets(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.debug.router_log',
    label: '/debug-router-log',
    description: 'View last N router decisions',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of entries to return. Defaults to 10.' },
      },
    },
    action: (args) => Read.debugRouterLog(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.debug.execution_log',
    label: '/debug-exec-log',
    description: 'View last N executions + receipts',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of entries to return. Defaults to 10.' },
      },
    },
    action: (args) => Read.debugExecutionLog(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.tasks.inbox',
    label: '/tasks-inbox',
    description: 'List HITL Tasks assigned to user',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: "Optional status filter (e.g. 'pending', 'claimed')." },
        limit: { type: 'number', description: 'Number of tasks to return. Defaults to 20.' },
      },
    },
    action: (args) => Read.listTasksInbox(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.tasks.detail',
    label: '/task-detail',
    description: 'View detail + required inputs schema',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID of the HITL task to retrieve.' },
      },
      required: ['task_id'],
    },
    action: (args) => Read.getTaskDetail(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.read.capabilities',
    label: '/capabilities',
    description: 'See what reading/execution is enabled on host',
    skills: {},
    action: () => Read.getCapabilities(registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
];

/**
 * Returns the list of exec commands.
 * @param {Object} dependencies
 * @param {Function} dependencies.navigate - Navigation function.
 * @param {Object} dependencies.routeMap - Map of named routes.
 * @param {Object} dependencies.icons - Icon components.
 * @param {Object} dependencies.registry - Command Center registry with stores and helpers.
 * @returns {Array} List of exec command definitions.
 */
export const getExecCommands = ({ navigate, routeMap, icons, registry }) => [
  {
    id: 'command_center.exec.ui.act',
    label: '/act-ui',
    description: 'Execute deterministic action on a target',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        target_ref: {
          type: 'string',
          description: 'Target reference. Use only values from context.client.targets_by_surface (format surface_id::target_id). Match the user\'s field or control name to the target\'s label or id in that list.',
        },
        method: { type: 'string', enum: ['click', 'fill', 'select', 'hover', 'scroll', 'toggle', 'clear'], description: 'Action method to execute on the target.' },
        arguments: { type: 'array', items: { type: 'string' }, description: 'Optional arguments for the method (e.g. value to fill).' },
      },
      required: ['target_ref', 'method'],
    },
    action: (args) => Exec.actUi(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.act_batch',
    label: '/act-batch-ui',
    description: 'Execute sequence of UI actions',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          description: 'Ordered list of UI actions to execute.',
          items: {
            type: 'object',
            properties: {
              target_ref: { type: 'string' },
              method: { type: 'string' },
              arguments: { type: 'array', items: { type: 'string' } },
            },
            required: ['target_ref', 'method'],
          },
        },
      },
      required: ['actions'],
    },
    action: (args) => Exec.actBatchUi(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.open_surface',
    label: '/open-surface',
    description: 'Open a published surface',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: 'ID of the surface to open (modal, drawer, panel).' },
        params: { type: 'object', description: 'Optional parameters to pass when opening the surface.' },
      },
      required: ['surface_id'],
    },
    action: (args) => Exec.openSurface(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.close_surface',
    label: '/close-surface',
    description: 'Close surface',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: 'ID of the surface to close.' },
      },
      required: ['surface_id'],
    },
    action: (args) => Exec.closeSurface(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.set_fields',
    label: '/set-fields',
    description: 'Set multiple fields in a FormSurface',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: 'ID of the form surface.' },
        fields: { type: 'object', description: 'Key-value pairs of field names and their new values.' },
      },
      required: ['surface_id', 'fields'],
    },
    action: (args) => Exec.setFields(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.submit_form',
    label: '/submit-form',
    description: 'Submit published form',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: 'ID of the form surface to submit.' },
      },
      required: ['surface_id'],
    },
    action: (args) => Exec.submitForm(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.apply_filter',
    label: '/apply-filter',
    description: 'Apply filters on Grid/List surface',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: "ID of the grid/list surface. Known surfaces: 'project-list-grid', 'agent-profile-list-grid', 'llm-provider-list-grid', 'cognitive-tool-list-grid', 'prompt-template-list-grid', 'external-datasource-list-grid'." },
        filter: { type: 'object', description: "Filter criteria. Supported keys: showDeleted (boolean) to show/hide deleted items." },
      },
      required: ['surface_id', 'filter'],
    },
    action: (args) => Exec.applyFilter(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.ui.select_rows',
    label: '/select-rows',
    description: 'Select rows/items',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: "ID of the grid surface. Known surfaces: 'project-list-grid', 'agent-profile-list-grid', 'llm-provider-list-grid', 'cognitive-tool-list-grid', 'prompt-template-list-grid', 'external-datasource-list-grid'." },
        row_ids: { type: 'array', items: { type: 'string' }, description: 'Array of exact row IDs to select. Use this when you know the IDs.' },
        identifiers: { type: 'array', items: { type: 'string' }, description: "Values to match when you don't know the IDs (e.g. slugs or names). Use with match_field." },
        match_field: { type: 'string', description: "Field to match identifiers against. Examples: 'slug', 'name'. Defaults to 'id'. Requires the page-context snapshot to have an items array." },
      },
      required: ['surface_id'],
    },
    action: (args) => Exec.selectRows(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.command.invoke',
    label: '/invoke-command',
    description: 'Execute semantic command published by feature',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        command_id: { type: 'string', description: 'The full ID of the command to invoke (e.g. command_center.read.capabilities).' },
        args: { type: 'object', description: 'Optional arguments to pass to the command.' },
      },
      required: ['command_id'],
    },
    action: (args) => Exec.invokeCommand(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.app.open',
    label: '/open-app',
    description: 'Open HITL App and return outputs',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        surface_id: { type: 'string', description: 'ID of the HITL App surface to open.' },
        input_data: { type: 'object', description: 'Optional initial data to pass to the app.' },
      },
      required: ['surface_id'],
    },
    action: (args) => Exec.openApp(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.navigate',
    label: '/navigate',
    description: 'Navigate to a specific route within the application based on the known routes skill.',
    app: 'Command Center',
    schema: {
      type: 'object',
      properties: {
        route: {
          type: 'string',
          description: 'Target absolute path (e.g. /admin/projects)',
        },
      },
      required: ['route'],
    },
    skills: {
      routes: routeMap,
    },
    action: (args) => Exec.navigate(args, navigate),
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.clipboard.copy',
    label: '/copy',
    description: 'Copy an artifact to clipboard',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Text or stringified JSON to copy to the clipboard.' },
      },
      required: ['content'],
    },
    action: (args) => Exec.copyToClipboard(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.tasks.claim',
    label: '/claim-task',
    description: 'Take ownership of a HITL Task',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID of the task to claim.' },
      },
      required: ['task_id'],
    },
    action: (args) => Exec.claimTask(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.tasks.complete',
    label: '/complete-task',
    description: 'Complete task with validated outputs',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID of the task to complete.' },
        outputs: { type: 'object', description: 'Key-value outputs required by the task schema.' },
      },
      required: ['task_id', 'outputs'],
    },
    action: (args) => Exec.completeTask(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.tasks.comment',
    label: '/comment-task',
    description: 'Add comment to task',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID of the task to comment on.' },
        comment: { type: 'string', description: 'Comment text to add.' },
      },
      required: ['task_id', 'comment'],
    },
    action: (args) => Exec.commentTask(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.tasks.create',
    label: '/create-task',
    description: 'Create a new HITL Task',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short task title (the goal).' },
        type: { type: 'object', description: 'Task type object with id and name (approval, data_completion, review, resolution, delegation).' },
        priority: { type: 'object', description: 'Task priority object with id and name (low, medium, high, critical).' },
        required_output: { type: 'object', description: 'Required output definition with schema and optional ui_hint.' },
        assignee: { type: 'object', description: 'Optional. Assignee object with assignee_type (user|group) and user or group reference.' },
        sla: { type: 'object', description: 'Optional. SLA object with due_at (Unix ms string) and sla_ms (duration in ms).' },
        payload: { type: 'object', description: 'Optional. Context payload with summary, evidence[] and linked_entities[].' },
      },
      required: ['title', 'type', 'priority', 'required_output'],
    },
    action: (args) => Exec.createTask(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.tasks.transition',
    label: '/task-transition',
    description: 'Apply a lifecycle transition to a Task (assign, claim, start, complete, reject, invalidate, expire)',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID of the task to transition.' },
        transition_name: { type: 'string', enum: ['assign', 'claim', 'start', 'complete', 'reject', 'invalidate', 'expire'], description: 'Transition to apply.' },
        payload: { type: 'object', nullable: true, description: 'Extra data for the transition (e.g. assignee, outputs, claimed_by).' },
      },
      required: ['task_id', 'transition_name'],
    },
    action: (args) => Exec.taskTransition(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
  {
    id: 'command_center.exec.undo',
    label: '/undo',
    description: 'Attempt to revert an action',
    skills: {},
    schema: {
      type: 'object',
      properties: {
        receipt_id: { type: 'string', description: 'The receipt_id returned by the action you want to revert.' },
      },
      required: ['receipt_id'],
    },
    action: (args) => Exec.undo(args, registry),
    app: 'Command Center',
    icon: icons?.Bolt || DefaultBoltIcon,
  },
];
