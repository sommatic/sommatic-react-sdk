import { useState, useCallback } from 'react';

/**
 * Hook to manage Command Center Agent interactions.
 *
 * @param {Object} config
 * @param {Array} config.availableCommands - List of command definitions available for the agent.
 * @param {Object} config.executionService - Service instance to execute LLM calls.
 * @returns {Object} { classifyIntent, isThinking, error }
 */
export const useCommandCenterAgent = ({ availableCommands = [], executionService }) => {
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
    async (userQuery, llmProviderId, conversationId = null, organizationId = null, clientContext = {}) => {
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
              };
            }),
            attachments: [],
          },
        };

        const response = await executionService.execute(envelope);

        if (response && response.success) {
          const { execution_plan, thought } = response.result;

          if (execution_plan) {
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
              return { plan: parsed.plan || [], thought: parsed.thought || '' };
            } catch (e) {
              return { plan: [] };
            }
          }

          return { plan: [] };
        } else {
          throw new Error(response?.message || 'Error communicating with the Agent.');
        }
      } catch (err) {
        console.error('[CommandCenterAgent] Error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsThinking(false);
      }
    },
    [availableCommands],
  );

  /**
   * Executes the generated plan by calling the action of each command.
   *
   * @param {Object} plan - The JSON plan object containing steps.
   * @returns {Promise<Array>} Results of step execution.
   */
  const executePlan = useCallback(
    async (plan, onProgress) => {
      if (!plan || !Array.isArray(plan)) {
        console.warn('[CommandCenterAgent] Invalid plan structure provided to executePlan', plan);
        return [];
      }

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

        await new Promise((resolve) => setTimeout(resolve, 400));

        if (step.command_id === 'reply') {
          const result = step.args;
          results.push({ command: 'reply', status: 'success', result });
          updateStepStatus(i, 'success', result);
          continue;
        }

        const cmdDef = availableCommands.find((command) => command.id === step.command_id);
        if (cmdDef && cmdDef.action) {
          try {
            const result = await cmdDef.action(step.args);
            results.push({ command: step.command_id, status: 'success', result });
            updateStepStatus(i, 'success', result);
          } catch (e) {
            console.error(`[CommandCenterAgent] Error executing ${step.command_id}:`, e);
            results.push({ command: step.command_id, status: 'error', error: e.message });
            updateStepStatus(i, 'error', null, e.message);
          }
        } else {
          console.warn(`[CommandCenterAgent] Command implementation not found for ID: ${step.command_id}`);
          results.push({ command: step.command_id, status: 'missing_implementation' });
          updateStepStatus(i, 'error', null, 'Command not found');
        }
      }
      return { results, finalPlan: currentPlanState };
    },
    [availableCommands],
  );

  return {
    classifyIntent,
    executePlan,
    isThinking,
    error,
  };
};
