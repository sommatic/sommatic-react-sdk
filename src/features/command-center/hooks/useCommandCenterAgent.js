import { useState, useCallback } from 'react';

/**
 * Hook to manage Command Center Agent interactions.
 *
 * @param {Object} config
 * @param {Array} config.availableCommands - List of command definitions available for the agent.
 * @param {Object} config.executionService - Service instance to execute LLM calls.
 * @param {Function} config.onRouterDecision - Callback to log router classification decisions.
 * @param {Function} config.onExecutionComplete - Callback to log command execution results.
 * @returns {Object} { classifyIntent, executePlan, isThinking, error }
 */
export const useCommandCenterAgent = ({
  availableCommands = [],
  executionService,
  onRouterDecision,
  onExecutionComplete,
}) => {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Classifies the user's natural language query into a structured plan.
   *
   * @param {string} userQuery - The text input from the user.
   * @param {string} llmProviderId - The ID of the LLM provider to use (must be sommatic_inference).
   * @param {string} conversationId - (Optional) Context for conversation history.
   * @returns {Promise<Object|null>} The parsed JSON plan or null on error.
   */
  const classifyIntent = useCallback(
    async (userQuery, llmProviderId, conversationId = null, organizationId = null, clientContext = {}, callbacks = {}) => {
      const { onThoughtChunk, onStreamOpen } = callbacks;
      setIsThinking(true);
      setError(null);

      try {
        if (!llmProviderId) {
          throw new Error('No LLM Provider ID provided for inference.');
        }
        if (!executionService) {
          throw new Error('No Execution Service provided to Agent.');
        }

        const envelope = {
          type: 'command-center.request',
          organization_id: organizationId,
          context: {
            session_id: conversationId,
            client: clientContext,
          },
          payload: {
            user_prompt: userQuery,
            llm_provider_id: llmProviderId,
            conversation_id: conversationId,
            tool_definitions: availableCommands.map((cmd) => {
              const { id, label, description, app, schema } = cmd;
              return {
                id: String(id),
                label: String(label),
                description: String(description),
                app: app ? String(app) : undefined,
                schema: schema ? JSON.parse(JSON.stringify(schema)) : undefined,
                skills: cmd.skills ? JSON.parse(JSON.stringify(cmd.skills)) : {},
              };
            }),
            attachments: [],
          },
        };

        let response;

        if (typeof executionService.executeStream === 'function') {
          const innerResult = await new Promise((resolve, reject) => {
            executionService
              .executeStream(envelope, {
                onOpen: () => {
                  onStreamOpen?.();
                },
                onChunk: (chunkData) => {
                  onThoughtChunk?.(chunkData?.text || '');
                },
                onDone: (payload) => resolve(payload),
                onError: (err) => reject(new Error(err?.message || 'Streaming error')),
              })
              .catch(reject);
          });
          // The streaming 'done' event sends the inner result object directly
          // (without the success envelope). Normalize it to match execute() shape.
          response = { success: true, result: innerResult };
        } else {
          response = await executionService.execute(envelope);
        }

        if (!response || !response.success) {
          throw new Error(response?.message || 'Error communicating with the Agent.');
        }

        const { execution_plan, thought } = response.result;

        // Only honor execution_plan when it actually carries steps. Some backend
        // responses include an empty array alongside a plain-text output when the
        // model decided to answer directly; an `if (execution_plan)` check is
        // truthy for `[]` and would discard that text.
        if (Array.isArray(execution_plan) && execution_plan.length > 0) {
          onRouterDecision?.({
            user_prompt: userQuery,
            plan: execution_plan,
            thought,
            provider_id: llmProviderId,
          });
          return { plan: execution_plan, thought };
        }

        const outputText = response.result?.output?.content?.text || response.result?.output?.text;

        if (outputText) {
          try {
            const cleanedOutput = outputText
              .replace(/```json/g, '')
              .replace(/```/g, '')
              .trim();
            const parsed = JSON.parse(cleanedOutput);
            const result = { plan: parsed.plan || [], thought: parsed.thought || '' };
            onRouterDecision?.({
              user_prompt: userQuery,
              plan: result.plan,
              thought: result.thought,
              provider_id: llmProviderId,
              parsed_from_output: true,
            });
            return result;
          } catch (e) {
            // Plain-text reply from the model. Synthesize a single `reply` step so
            // the manager runs the reply-only synthesis path and the user sees the
            // response rendered in the chat. Flag it so the manager can render the
            // text directly without a second backend round-trip — re-streaming the
            // raw user message would re-enter a model whose history is poisoned by
            // previous synthesis prompts and yield generic answers.
            const syntheticPlan = [{ command_id: 'reply', args: { text: outputText.trim() } }];
            onRouterDecision?.({
              user_prompt: userQuery,
              plan: syntheticPlan,
              provider_id: llmProviderId,
              synthesized_from_plain_text: true,
            });
            return { plan: syntheticPlan, thought: '', isPlainTextReply: true };
          }
        }

        return { plan: [] };
      } catch (err) {
        console.error('[CommandCenterAgent] Error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsThinking(false);
      }
    },
    [availableCommands, onRouterDecision],
  );

  /**
   * Executes the generated plan by calling the action of each command.
   *
   * @param {Object} plan - The JSON plan object containing steps.
   * @param {Function} onProgress - Callback for step progress updates.
   * @returns {Promise<Object>} Results of step execution.
   */
  const executePlan = useCallback(
    async (plan, onProgress) => {
      if (!plan || !Array.isArray(plan)) {
        console.warn('[CommandCenterAgent] Invalid plan structure provided to executePlan', plan);
        return [];
      }

      // Delay after UI-affecting commands so React can commit updates and mount (e.g. modal + form surface).
      const DELAY_AFTER_OPEN_SURFACE_MS = 700;
      const DELAY_AFTER_SET_FIELDS_MS = 350;
      const STEP_START_DELAY_MS = 300;

      const results = [];
      let currentPlanState = plan.map((step) => ({ ...step, status: step.status || 'pending' }));

      const updateStepStatus = (index, status, result = null, error = null) => {
        currentPlanState = currentPlanState.map((step, idx) => {
          if (idx === index) {
            return { ...step, status, result, error };
          }
          return step;
        });
        if (onProgress) {
          onProgress([...currentPlanState]);
        }
      };

      if (onProgress) {
        onProgress([...currentPlanState]);
      }

      for (let i = 0; i < plan.length; i++) {
        const step = plan[i];

        updateStepStatus(i, 'running');

        await new Promise((resolve) => setTimeout(resolve, STEP_START_DELAY_MS));

        if (step.command_id === 'reply') {
          const result = step.args;
          results.push({ command: 'reply', status: 'success', result });
          updateStepStatus(i, 'success', result);
          continue;
        }

        const cmdDef = availableCommands.find((command) => command.id === step.command_id);
        if (cmdDef && cmdDef.action) {
          try {
            if (import.meta.env.VITE_COMMAND_CENTER_DEBUG === 'true') {
              console.log(`[Command Center] Executing command: ${step.command_id}`, step.args);
            }
            const result = await cmdDef.action(step.args);
            if (import.meta.env.VITE_COMMAND_CENTER_DEBUG === 'true') {
              console.log(`[Command Center] Command result (${step.command_id}):`, result);
            }
            results.push({ command: step.command_id, status: 'success', result });
            updateStepStatus(i, 'success', result);

            onExecutionComplete?.({
              command_id: step.command_id,
              args: step.args,
              status: 'success',
              result,
            });

            // Allow UI to settle after commands that open or change forms so the next step sees the updated DOM/registry.
            const cmdId = step.command_id || '';
            if (cmdId.includes('open_surface') || cmdId.endsWith('.open_surface')) {
              await new Promise((resolve) => setTimeout(resolve, DELAY_AFTER_OPEN_SURFACE_MS));
            } else if (cmdId.includes('set_fields') || cmdId.endsWith('.set_fields')) {
              await new Promise((resolve) => setTimeout(resolve, DELAY_AFTER_SET_FIELDS_MS));
            }
          } catch (e) {
            console.error(`[CommandCenterAgent] Error executing ${step.command_id}:`, e);
            results.push({ command: step.command_id, status: 'error', result: null, error: e.message });
            updateStepStatus(i, 'error', null, e.message);

            onExecutionComplete?.({
              command_id: step.command_id,
              args: step.args,
              status: 'error',
              error: e.message,
            });
          }
        } else {
          console.warn(`[CommandCenterAgent] Command implementation not found for ID: ${step.command_id}`);
          results.push({ command: step.command_id, status: 'missing_implementation', result: null });
          updateStepStatus(i, 'error', null, 'Command not found');

          onExecutionComplete?.({
            command_id: step.command_id,
            args: step.args,
            status: 'missing_implementation',
          });
        }
      }
      return { results, finalPlan: currentPlanState };
    },
    [availableCommands, onExecutionComplete],
  );

  return {
    classifyIntent,
    executePlan,
    isThinking,
    error,
  };
};
