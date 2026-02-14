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
  // Registry for Context Sources (data providers from components)
  // Map<string, { id, description, getData }>
  const [contextSources] = useState(new Map());
  const [inferenceProviderId, setInferenceProviderId] = useState(null);
  const [defaultProviderId, setDefaultProviderId] = useState(null);

  // Fetch available LLM providers to find the best inference model
  React.useEffect(() => {
    if (!llmProviderService) return;

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

          // 1. Find Inference Model (Fast/Cheap)
          // Priority 1: Explicitly marked as inference model
          let inferenceTarget = items.find((p) => p.is_sommatic_inference);

          // Priority 2: GPT models (usually faster/cheaper in this context)
          if (!inferenceTarget) inferenceTarget = items.find((p) => p.provider_name?.toLowerCase().includes('gpt'));

          // Priority 3: First available
          if (!inferenceTarget) inferenceTarget = items[0];

          if (inferenceTarget) {
            console.log(`[CommandCenter] Selected Inference Provider: ${inferenceTarget.name} (${inferenceTarget.id})`);
            setInferenceProviderId(inferenceTarget.id);
          }

          // 2. Find Default Model (Smart/Capable) - For Synthesis
          let defaultTarget = items.find((p) => p.is_default);

          // Priority 2: Claude models (usually better context window/reasoning)
          if (!defaultTarget) defaultTarget = items.find((p) => p.provider_name?.toLowerCase().includes('claude'));

          if (defaultTarget) {
            console.log(`[CommandCenter] Selected Default Provider: ${defaultTarget.name} (${defaultTarget.id})`);
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

  // Merge prop-based commands with dynamically registered ones
  const allCommands = useMemo(() => [...commands, ...dynamicCommands], [commands, dynamicCommands]);

  const { classifyIntent, executePlan, isThinking, error } = useCommandCenterAgent({
    availableCommands: allCommands,
    // Use injected service or fallback to default (though default is now deprecated/removed)
    executionService: executionService || new ConversationExecutionService(),
  });

  /**
   * Registers dynamic commands from components.
   * @param {Array} newCommands - List of commands to register
   * @returns {Function} unregister callback
   */
  const registerCommands = useCallback((newCommands) => {
    if (!newCommands || !newCommands.length) return () => {};

    console.log(`CommandCenter: Registering ${newCommands.length} dynamic commands`);
    setDynamicCommands((prev) => {
      // Avoid duplicates by ID
      const prevIds = new Set(prev.map((c) => c.id));
      const uniqueNew = newCommands.filter((c) => !prevIds.has(c.id));
      return [...prev, ...uniqueNew];
    });

    return () => {
      console.log(`CommandCenter: Unregistering ${newCommands.length} commands`);
      const idsToRemove = new Set(newCommands.map((c) => c.id));
      setDynamicCommands((prev) => prev.filter((c) => !idsToRemove.has(c.id)));
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

      console.log(`CommandCenter: Registering source [${source.id}]`);
      contextSources.set(source.id, source);

      return () => {
        console.log(`CommandCenter: Unregistering source [${source.id}]`);
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
    async (userQuery, conversationId = null, organizationId = null) => {
      console.log('CommandCenter: Executing Intent for:', userQuery);

      // Gather Client Context (Minimal Initial Payload)
      // We defer heavy context fetching (like page-context) until the Agent explicitly requests it
      // via commands like /get-current-scope or /page-outline.
      const clientContext = {
        route: window.location.pathname,
        sources: {}, // Empty initially to avoid circular JSON and payload overhead
      };

      console.log('[CommandCenter] Client Context gathered (Initial):', clientContext);

      // Use the dynamically fetched provider ID, or fallback to the placeholder (which will likely fail if not replaced)
      const providerId = inferenceProviderId || 'sommatic-inference-placeholder';

      if (!inferenceProviderId) {
        console.warn('[CommandCenter] No inference provider configured. Using placeholder.');
      }

      const classificationResult = await classifyIntent(userQuery, providerId, conversationId, organizationId, clientContext);

      if (classificationResult && classificationResult.plan) {
        const { plan, thought } = classificationResult;
        console.log('CommandCenter: Plan received, executing...', JSON.stringify(plan, null, 2));
        const results = await executePlan(plan);
        console.log('CommandCenter: Execution results:', results);
        return { plan, thought, results };
      }
      return null;
    },
    [classifyIntent, executePlan, inferenceProviderId, contextSources],
  );

  const value = useMemo(
    () => ({
      commands, // Expose registered commands
      isThinking,
      error,
      registerContextSource,
      registerCommands,
      getContext,
      executeIntent,
      defaultProviderId,
      // Expose the execution service instance
      executionService: executionService || new ConversationExecutionService(),
      // Expose the management service class (injected or default)
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
