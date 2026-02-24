import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useCommandCenterAgent } from '../hooks/useCommandCenterAgent';
import { ConversationExecutionService, ConversationManagementService } from '../../../services';
import { fetchEntityCollection } from '../../../services/utils/entityServiceAdapter';

const CommandCenterContext = createContext(null);

/**
 * Provider for the Command Center.
 * Manages the registry of context sources and integrates with the Agent.
 *
 * @param {Object} props
 * @param {Array} props.commands - List of commands available
 * @param {React.ReactNode} props.children
 * @param {Object|null} props.executionService - Instance of ConversationExecutionService
 * @param {Class|null} props.conversationManagementService - Class of ConversationManagementService
 */
export const CommandCenterProvider = ({
  commands = [],
  children,
  executionService,
  conversationManagementService,
  llmProviderService,
}) => {
  const [contextSources] = useState(new Map());
  const [inferenceProviderId, setInferenceProviderId] = useState(null);
  const [defaultProviderId, setDefaultProviderId] = useState(null);
  const [providers, setProviders] = useState([]);

  React.useEffect(() => {
    if (!llmProviderService) {
      return;
    }

    const fetchProviders = async () => {
      try {
        const response = await fetchEntityCollection({
          service: llmProviderService,
          payload: {
            queryselector: 'all',
            exclude_status: 'deleted',
            page: 1,
            pageSize: 50,
          },
        });

        if (response?.result?.items?.length) {
          const items = response.result.items;
          setProviders(items);

          let inferenceTarget = items.find((provider) => provider.is_sommatic_inference);

          if (!inferenceTarget) {
            inferenceTarget = items[0];
          }

          if (inferenceTarget) {
            setInferenceProviderId(inferenceTarget.id);
          }

          let defaultTarget = items.find((provider) => provider.is_default);

          if (!defaultTarget) {
            defaultTarget = items[0];
          }

          if (defaultTarget) {
            setDefaultProviderId(defaultTarget.id);
          }
        }
      } catch (err) {
        console.error('[CommandCenter] Failed to fetch LLM providers', err);
      }
    };

    fetchProviders();
  }, [llmProviderService]);

  const [dynamicCommands, setDynamicCommands] = useState([]);

  const allCommands = useMemo(() => [...commands, ...dynamicCommands], [commands, dynamicCommands]);

  const { classifyIntent, executePlan, isThinking, error } = useCommandCenterAgent({
    availableCommands: allCommands,
    executionService: executionService || new ConversationExecutionService(),
  });

  /**
   * Registers dynamic commands from components.
   * @param {Array} newCommands - List of commands to register
   * @returns {Function} unregister callback
   */
  const registerCommands = useCallback((newCommands) => {
    if (!newCommands || !newCommands.length) {
      console.error('Invalid commands');
      return () => {};
    }

    setDynamicCommands((prevCommands) => {
      const prevIds = new Set(prevCommands.map((command) => command.id));
      const uniqueNew = newCommands.filter((command) => !prevIds.has(command.id));
      return [...prevCommands, ...uniqueNew];
    });

    return () => {
      const idsToRemove = new Set(newCommands.map((command) => command.id));
      setDynamicCommands((prevCommands) => prevCommands.filter((command) => !idsToRemove.has(command.id)));
    };
  }, []);

  /**
   * Registers a data source from a component.
   * @param {Object} source - { id, description, getData }
   * @returns {Function} unregister callback
   */
  const registerContextSource = useCallback(
    (source) => {
      if (!source.id || !source.getData) {
        console.warn('CommandCenterProvider: Invalid context source registration', source);
        return () => {};
      }

      contextSources.set(source.id, source);

      return () => {
        contextSources.delete(source.id);
      };
    },
    [contextSources],
  );

  /**
   * Retrieves data from a specific context source.
   * @param {string} sourceId
   * @returns {any} The data returned by source.getData(), or null if not found.
   */
  const getContext = useCallback(
    (sourceId) => {
      const source = contextSources.get(sourceId);
      if (!source) {
        console.warn(`CommandCenter: Context source [${sourceId}] not found.`);
        return null;
      }
      try {
        return source.getData();
      } catch (err) {
        console.error(`CommandCenter: Error getting data from source [${sourceId}]`, err);
        return null;
      }
    },
    [contextSources],
  );

  /**
   * Main entry point for user queries (e.g. from Chat).
   * 1. Classifies intent.
   * 2. Executes the plan.
   * @param {string} userQuery
   * @param {string} conversationId
   */
  const executeIntent = useCallback(
    async (userQuery, conversationId = null, organizationId = null, callbacks = {}) => {
      const { onProgress, onPlanReceived } = callbacks;

      const clientContext = {
        route: window.location.pathname,
        sources: {},
      };

      if (!inferenceProviderId) {
        console.error('[CommandCenter] No inference provider configured.');
        return;
      }

      const classificationResult = await classifyIntent(
        userQuery,
        inferenceProviderId,
        conversationId,
        organizationId,
        clientContext,
      );

      if (providers.length > 0) {
        const planningProvider = providers.find((p) => p.id === inferenceProviderId);
        if (planningProvider) {
          if (import.meta.env.VITE_COMMAND_CENTER_DEBUG === 'true') {
            console.log(
              `%c Command Center - Planning Model: ${planningProvider.name || planningProvider.model_identifier}`,
              'background: #222; color: #bada55; font-size: 12px; padding: 4px; border-radius: 4px;',
            );
          }
        }
      }

      if (classificationResult && classificationResult.plan) {
        const { plan, thought } = classificationResult;

        if (onPlanReceived) {
          onPlanReceived({ plan, thought });
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const executionResult = await executePlan(plan, onProgress);

        let results = [];
        let finalPlan = plan;

        if (Array.isArray(executionResult)) {
          results = executionResult;
        } else if (executionResult && typeof executionResult === 'object') {
          results = executionResult.results || [];
          finalPlan = executionResult.finalPlan || plan;
        }

        return { plan: finalPlan, thought, results };
      }
      return null;
    },
    [classifyIntent, executePlan, inferenceProviderId, contextSources],
  );

  const value = useMemo(
    () => ({
      commands,
      isThinking,
      error,
      providers,
      registerContextSource,
      registerCommands,
      getContext,
      executeIntent,
      defaultProviderId,
      executionService: executionService || new ConversationExecutionService(),
      ConversationManagementService: conversationManagementService || ConversationManagementService,
    }),
    [
      commands,
      dynamicCommands,
      isThinking,
      error,
      registerContextSource,
      registerCommands,
      getContext,
      executeIntent,
      executionService,
      conversationManagementService,
      defaultProviderId,
      providers,
    ],
  );

  return <CommandCenterContext.Provider value={value}>{children}</CommandCenterContext.Provider>;
};

export const useCommandCenterContext = () => {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error('useCommandCenterContext must be used within a CommandCenterProvider');
  }
  return context;
};
