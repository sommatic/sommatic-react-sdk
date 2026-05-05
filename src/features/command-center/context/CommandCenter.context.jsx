import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { useCommandCenterAgent } from '../hooks/useCommandCenterAgent';
import { ConversationExecutionService, ConversationManagementService } from '@services';
import { fetchEntityCollection } from '@services/utils/entityServiceAdapter';

const CommandCenterContext = createContext(null);

const DEBUG_LOG_LIMIT = 50;

// ---------------------------------------------------------------------------
// Multilingual target resolution helpers
// ---------------------------------------------------------------------------

/**
 * Computes the Dice coefficient over character trigrams of two strings.
 * Handles cognate pairs like "organizacion"/"organization" (~0.82) or
 * "descripcion"/"description" (~0.80) that share high trigram overlap despite
 * differing suffixes or minor spelling differences across languages.
 * @param {string} a
 * @param {string} b
 * @returns {number} Similarity in [0, 1]
 */
function trigramSimilarity(a, b) {
  if (!a || !b || a.length < 2 || b.length < 2) return 0;
  const getTrigrams = (s) => {
    const padded = `  ${s} `;
    const set = new Set();
    for (let i = 0; i < padded.length - 2; i++) {
      set.add(padded.slice(i, i + 3));
    }
    return set;
  };
  const ta = getTrigrams(a);
  const tb = getTrigrams(b);
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  return (2 * intersection) / (ta.size + tb.size);
}

/**
 * Minimal semantic bridge for word pairs that are equivalent in meaning but
 * share no character overlap (trigram similarity ~0). Only these pairs need an
 * explicit entry; all cognates (organization/organizacion, etc.) are handled
 * automatically by trigramSimilarity.
 */
const SEMANTIC_BRIDGE = new Map([
  ['nombre', 'name'],
  ['name', 'nombre'],
  ['titulo', 'title'],
  ['title', 'titulo'],
  ['tipo', 'type'],
  ['type', 'tipo'],
  ['estado', 'status'],
  ['status', 'estado'],
  ['correo', 'email'],
  ['email', 'correo'],
  ['usuario', 'user'],
  ['user', 'usuario'],
  ['clave', 'key'],
  ['key', 'clave'],
  ['paso', 'step'],
  ['step', 'paso'],
]);
const RECEIPT_STACK_LIMIT = 100;
const SNAPSHOT_TTL_MS = 30_000;

function generateReceiptId() {
  return `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Derives a human-readable label from a target id when label is missing.
 * Strips common form prefixes (e.g. ct-edit-, trigger-edit-) and turns
 * hyphens/underscores into spaces with simple title case.
 * @param {string} id - Target id or ref (e.g. ct-edit-organization-id)
 * @returns {string} Derived label (e.g. Organization Id)
 */
function deriveLabelFromId(id) {
  if (!id || typeof id !== 'string') return '';
  let s = id.trim();
  // Strip common prefixes: word-(edit|create)-
  s = s.replace(/^[\w]+-(edit|create)-/i, '');
  s = s.replace(/^[\w]+-form-/i, '');
  s = s.replace(/[\s_-]+/g, ' ').trim();
  if (!s) return id;
  return s.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Provider for the Command Center.
 * Manages the registry of context sources, surfaces, debug logs, and integrates with the Agent.
 *
 * @param {Object} props
 * @param {Array} props.commands - List of commands available
 * @param {React.ReactNode} props.children
 * @param {Object|null} props.executionService - Instance of ConversationExecutionService
 * @param {Class|null} props.conversationManagementService - Class of ConversationManagementService
 * @param {Class|null} props.llmProviderService - Service to fetch LLM providers
 * @param {Object|null} props.taskService - Service for HITL task management
 * @param {Array} [props.pageCatalog] - Static page catalog built from Vite glob of PAGE_METADATA exports. Injected into clientContext.navigation.available_pages for the LLM to resolve navigation intent semantically.
 * @param {Object|null} [props.appCatalog] - Initial app catalog. Dynamically updatable via registry.setAppCatalog(). Injected into clientContext.navigation.available_apps.
 */
export const CommandCenterProvider = ({
  commands = [],
  children,
  executionService,
  conversationManagementService,
  llmProviderService,
  taskService = null,
  currentUser = null,
  appCatalog: initialAppCatalog = null,
  pageCatalog = [],
}) => {
  const [contextSources] = useState(new Map());
  const [inferenceProviderId, setInferenceProviderId] = useState(null);
  const [dynamicAppCatalog, setDynamicAppCatalog] = useState(initialAppCatalog);
  const [defaultProviderId, setDefaultProviderId] = useState(null);
  const [providers, setProviders] = useState([]);

  // --- Registries and Stores ---
  const [surfaceRegistry] = useState(new Map());
  const selectionStore = useRef(null);
  const focusStore = useRef(null);
  const debugLog = useRef({ routerEntries: [], executionEntries: [] });
  const receiptStack = useRef([]);
  const snapshotCache = useRef(new Map());

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

          let inferenceTarget = items.find(
            (provider) =>
              provider.is_sommatic_inference === true ||
              String(provider.is_sommatic_inference).toLowerCase() === 'true' ||
              provider.is_sommatic_inference === 1 ||
              String(provider.is_sommatic_inference) === '1',
          );

          if (!inferenceTarget) {
            inferenceTarget = items[0];
          }

          if (inferenceTarget) {
            setInferenceProviderId(inferenceTarget.id);
          }

          let defaultTarget = items.find(
            (provider) =>
              provider.is_default === true ||
              String(provider.is_default).toLowerCase() === 'true' ||
              provider.is_default === 1 ||
              String(provider.is_default) === '1',
          );

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

  // Keep a ref so the registry's `commands` getter always returns the latest list
  // without forcing registry to be recreated every time dynamicCommands changes.
  const allCommandsRef = useRef(allCommands);
  allCommandsRef.current = allCommands;

  // Same pattern for the app catalog: consumers read it through a getter on
  // `registry` so updating `dynamicAppCatalog` does not change `registry`'s
  // identity (which would re-fire every consumer's effects).
  const dynamicAppCatalogRef = useRef(dynamicAppCatalog);
  dynamicAppCatalogRef.current = dynamicAppCatalog;

  // --- Context Source operations ---

  const listAllSources = useCallback(() => {
    const sources = [];
    contextSources.forEach((source, id) => {
      sources.push({ id, description: source.description || '' });
    });
    return sources;
  }, [contextSources]);

  const getSourceMetadata = useCallback(
    (sourceId) => {
      const source = contextSources.get(sourceId);
      if (!source) {
        return null;
      }
      return {
        id: source.id,
        description: source.description || '',
      };
    },
    [contextSources],
  );

  const getSnapshot = useCallback(
    (sourceId) => {
      const cached = snapshotCache.current.get(sourceId);
      if (cached && Date.now() - cached.captured_at < (cached.ttl_ms || SNAPSHOT_TTL_MS)) {
        return cached;
      }

      const source = contextSources.get(sourceId);
      if (!source) {
        return null;
      }

      try {
        const data = source.getData();
        const block = {
          source_id: sourceId,
          namespace: source.namespace || sourceId,
          title: source.title || source.description || sourceId,
          description: source.description || '',
          captured_at: Date.now(),
          ttl_ms: source.ttl_ms || SNAPSHOT_TTL_MS,
          payload: data,
        };
        snapshotCache.current.set(sourceId, block);
        return block;
      } catch (err) {
        console.error(`[CommandCenter] Error getting snapshot from source [${sourceId}]`, err);
        return null;
      }
    },
    [contextSources],
  );

  // --- Surface Registry operations ---

  const registerSurface = useCallback(
    (surface) => {
      if (!surface || !surface.id) {
        console.warn('[CommandCenter] Invalid surface registration', surface);
        return () => {};
      }

      surfaceRegistry.set(surface.id, surface);

      return () => {
        surfaceRegistry.delete(surface.id);
      };
    },
    [surfaceRegistry],
  );

  const getSurfaces = useCallback(() => {
    const surfaces = [];
    surfaceRegistry.forEach((surface) => {
      surfaces.push({
        id: surface.id,
        type: surface.type || 'unknown',
        label: surface.label || surface.id,
        description: surface.description || '',
      });
    });
    return surfaces;
  }, [surfaceRegistry]);

  const getSurface = useCallback(
    (surfaceId) => {
      return surfaceRegistry.get(surfaceId) || null;
    },
    [surfaceRegistry],
  );

  const getTargets = useCallback(
    (surfaceId) => {
      const surface = surfaceRegistry.get(surfaceId);
      if (!surface || !surface.targets) {
        return [];
      }
      return surface.targets.map((target) => {
        const ref = target.ref || target.id || '';
        const label = target.label || deriveLabelFromId(ref);
        return {
          ref,
          type: target.type || 'unknown',
          label,
          methods: target.methods || Object.keys(target.handlers || {}),
        };
      });
    },
    [surfaceRegistry],
  );

  const resolveTarget = useCallback(
    (targetRef) => {
      if (!targetRef || typeof targetRef !== 'string') {
        return null;
      }

      // Parse surface_id::target_id format (documented standard for target_ref)
      const sep = '::';
      if (targetRef.includes(sep)) {
        const parts = targetRef.split(sep);
        const surfaceId = parts[0]?.trim();
        const targetId = parts.slice(1).join(sep).trim(); // in case target_id contains "::"
        if (surfaceId && targetId) {
          const surface = surfaceRegistry.get(surfaceId);
          if (surface?.targets) {
            const target = surface.targets.find((t) => (t.ref || t.id) === targetId);
            if (target) {
              return { surface, target };
            }
          }
          // No match with :: format; fall through to legacy behavior
        }
      }

      // Legacy: targetRef is just target_id — search across all surfaces
      for (const [, surface] of surfaceRegistry) {
        if (!surface.targets) {
          continue;
        }
        const target = surface.targets.find((t) => (t.ref || t.id) === targetRef);
        if (target) {
          return { surface, target };
        }
      }

      // Fallback: if targetRef matches a surface ID, treat the surface itself as
      // a target using its surface-level handlers. This lets exec.ui.act work
      // naturally when the LLM uses the surface ID as the target reference.
      const surface = surfaceRegistry.get(targetRef);
      if (surface?.handlers) {
        return {
          surface,
          target: {
            id: surface.id,
            ref: surface.id,
            label: surface.label || surface.id,
            type: surface.type || 'surface',
            handlers: surface.handlers,
          },
        };
      }

      return null;
    },
    [surfaceRegistry],
  );

  const FUZZY_THRESHOLD = 0.5;

  // Normalize for comparison: strip diacritics, lowercase, separators to spaces
  const normalizeForFuzzy = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Words to ignore when matching user ref to label/id (e.g. "organization-id-input" -> match "organization id")
  const FUZZY_STOPWORDS = new Set(['input', 'field', 'edit', 'create', 'modal', 'form', 'box', 'value']);

  const resolveTargetFuzzy = useCallback(
    (targetRef) => {
      if (!targetRef || typeof targetRef !== 'string') {
        return null;
      }

      let surfaceId = null;
      let targetRefPart = targetRef;
      if (targetRef.includes('::')) {
        const parts = targetRef.split('::');
        surfaceId = parts[0]?.trim();
        targetRefPart = parts.slice(1).join('::').trim();
      }
      const searchTerm = normalizeForFuzzy(targetRefPart);
      const searchTokens = searchTerm.split(' ').filter((w) => w && !FUZZY_STOPWORDS.has(w));
      const searchTokenSet = new Set(searchTokens);

      const surfacesToSearch = surfaceId
        ? [surfaceRegistry.get(surfaceId)].filter(Boolean)
        : Array.from(surfaceRegistry.values());

      const candidates = [];
      for (const surface of surfacesToSearch) {
        if (!surface?.targets) continue;
        for (const target of surface.targets) {
          const id = target.ref || target.id || '';
          const label = target.label || deriveLabelFromId(id);
          const aliases = Array.isArray(target.aliases) ? target.aliases : [];
          const nId = normalizeForFuzzy(id);
          const nLabel = normalizeForFuzzy(label);
          let score = 0;

          // Aliases: match against each alias (normalized)
          for (const al of aliases) {
            const nAlias = normalizeForFuzzy(al);
            if (nAlias && (nAlias === searchTerm || nAlias.includes(searchTerm) || searchTerm.includes(nAlias))) {
              score = Math.max(score, 0.9);
              break;
            }
          }

          // Exact match
          if (nId && nId === searchTerm) score = Math.max(score, 1);
          else if (nLabel && nLabel === searchTerm) score = Math.max(score, 0.95);

          // Substring: label or id contains search (or vice versa)
          if (nLabel && (nLabel.includes(searchTerm) || searchTerm.includes(nLabel))) score = Math.max(score, 0.85);
          if (nId && (nId.includes(searchTerm) || searchTerm.includes(nId))) score = Math.max(score, 0.75);

          // Token overlap: user said "organization id input" -> ["organization","id"]; label "organization id" -> match
          if (searchTokens.length > 0) {
            const labelTokens = nLabel.split(' ').filter(Boolean);
            const idTokens = nId.split(' ').filter(Boolean);
            const labelMatch = labelTokens.filter((t) => searchTokenSet.has(t)).length;
            const idMatch = idTokens.filter((t) => searchTokenSet.has(t)).length;
            if (labelTokens.length > 0 && labelMatch === labelTokens.length) score = Math.max(score, 0.8);
            if (idTokens.length > 0 && idMatch === idTokens.length) score = Math.max(score, 0.7);
            const labelOverlap = labelTokens.length ? labelMatch / Math.max(searchTokens.length, labelTokens.length) : 0;
            const idOverlap = idTokens.length ? idMatch / Math.max(searchTokens.length, idTokens.length) : 0;
            if (labelOverlap >= 0.5) score = Math.max(score, 0.5 + labelOverlap * 0.3);
            if (idOverlap >= 0.5) score = Math.max(score, 0.45 + idOverlap * 0.25);

            // --- Capa 2: trigrama Dice por token (cognados EN<->ES) ---
            // For each search token, find the best trigram match among target tokens.
            // Covers pairs like "organizacion"/"organization" or "descripcion"/"description".
            const TRIGRAM_TOKEN_THRESHOLD = 0.45;
            const computeBestTrigramOverlap = (searchToks, targetToks) => {
              if (searchToks.length === 0 || targetToks.length === 0) return 0;
              let totalBest = 0;
              for (const st of searchToks) {
                let best = 0;
                for (const tt of targetToks) {
                  best = Math.max(best, trigramSimilarity(st, tt));
                }
                totalBest += best;
              }
              return totalBest / searchToks.length;
            };
            const trigramLabelScore = computeBestTrigramOverlap(searchTokens, labelTokens);
            const trigramIdScore = computeBestTrigramOverlap(searchTokens, idTokens);
            if (trigramLabelScore >= TRIGRAM_TOKEN_THRESHOLD) {
              score = Math.max(score, 0.78 * trigramLabelScore);
            }
            if (trigramIdScore >= TRIGRAM_TOKEN_THRESHOLD) {
              score = Math.max(score, 0.68 * trigramIdScore);
            }

            // --- Capa 3: puente semántico (pares sin overlap: nombre<->name, tipo<->type) ---
            // Expand search tokens using SEMANTIC_BRIDGE and re-evaluate overlap.
            const expandedSearchTokenSet = new Set(searchTokens);
            for (const st of searchTokens) {
              const bridged = SEMANTIC_BRIDGE.get(st);
              if (bridged) expandedSearchTokenSet.add(bridged);
            }
            const bridgedLabelMatch = labelTokens.filter((t) => expandedSearchTokenSet.has(t)).length;
            const bridgedIdMatch = idTokens.filter((t) => expandedSearchTokenSet.has(t)).length;
            if (labelTokens.length > 0 && bridgedLabelMatch === labelTokens.length) {
              score = Math.max(score, 0.75);
            }
            if (idTokens.length > 0 && bridgedIdMatch === idTokens.length) {
              score = Math.max(score, 0.65);
            }
            const bridgedLabelOverlap = labelTokens.length
              ? bridgedLabelMatch / Math.max(searchTokens.length, labelTokens.length)
              : 0;
            const bridgedIdOverlap = idTokens.length
              ? bridgedIdMatch / Math.max(searchTokens.length, idTokens.length)
              : 0;
            if (bridgedLabelOverlap >= 0.5) score = Math.max(score, 0.5 + bridgedLabelOverlap * 0.25);
            if (bridgedIdOverlap >= 0.5) score = Math.max(score, 0.45 + bridgedIdOverlap * 0.2);
          }

          if (score > 0) {
            candidates.push({ surface, target, score });
          }
        }
      }

      if (candidates.length === 0) return null;
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      return best.score >= FUZZY_THRESHOLD ? { surface: best.surface, target: best.target } : null;
    },
    [surfaceRegistry],
  );

  // --- Selection Store ---

  const setSelection = useCallback((data) => {
    selectionStore.current = data ? { ...data, captured_at: Date.now() } : null;
  }, []);

  const getSelectionData = useCallback(() => {
    if (selectionStore.current) {
      return selectionStore.current;
    }
    const nativeSelection = window.getSelection?.();
    if (nativeSelection && nativeSelection.toString().trim()) {
      return { type: 'text', content: nativeSelection.toString().trim(), captured_at: Date.now() };
    }
    return null;
  }, []);

  // --- Focus Store ---

  const setFocusData = useCallback((data) => {
    focusStore.current = data ? { ...data, captured_at: Date.now() } : null;
  }, []);

  const getFocusData = useCallback(() => {
    return focusStore.current || null;
  }, []);

  // --- Debug Log ---

  const pushDebugEntry = useCallback((type, entry) => {
    const log = debugLog.current;
    const enrichedEntry = { ...entry, timestamp: Date.now() };

    if (type === 'router') {
      log.routerEntries.push(enrichedEntry);
      if (log.routerEntries.length > DEBUG_LOG_LIMIT) {
        log.routerEntries.shift();
      }
    } else if (type === 'execution') {
      log.executionEntries.push(enrichedEntry);
      if (log.executionEntries.length > DEBUG_LOG_LIMIT) {
        log.executionEntries.shift();
      }
    }
  }, []);

  const getRouterLog = useCallback((limit = 10) => {
    return debugLog.current.routerEntries.slice(-limit);
  }, []);

  const getExecutionLog = useCallback((limit = 10) => {
    return debugLog.current.executionEntries.slice(-limit);
  }, []);

  // --- Receipt Stack (for undo) ---

  const pushReceipt = useCallback((receipt) => {
    const enriched = { ...receipt, id: receipt.id || generateReceiptId(), created_at: Date.now() };
    receiptStack.current.push(enriched);
    if (receiptStack.current.length > RECEIPT_STACK_LIMIT) {
      receiptStack.current.shift();
    }
    return enriched;
  }, []);

  const getReceipt = useCallback((receiptId) => {
    return receiptStack.current.find((r) => r.id === receiptId) || null;
  }, []);

  const getReceiptStack = useCallback(() => {
    return [...receiptStack.current];
  }, []);

  // --- Consolidated registry object for commands ---

  const registry = useMemo(
    () => ({
      listAllSources,
      getSourceMetadata,
      getSnapshot,
      registerSurface,
      getSurfaces,
      getSurface,
      getTargets,
      resolveTarget,
      resolveTargetFuzzy,
      setSelection,
      getSelectionData,
      setFocusData,
      getFocusData,
      pushDebugEntry,
      getRouterLog,
      getExecutionLog,
      pushReceipt,
      getReceipt,
      getReceiptStack,
      get commands() {
        return allCommandsRef.current;
      },
      taskService,
      currentUser,
      pageCatalog,
      get appCatalog() {
        return dynamicAppCatalogRef.current || {};
      },
      setAppCatalog: (catalog) => setDynamicAppCatalog(catalog),
    }),
    [
      listAllSources,
      getSourceMetadata,
      getSnapshot,
      registerSurface,
      getSurfaces,
      getSurface,
      getTargets,
      resolveTarget,
      resolveTargetFuzzy,
      setSelection,
      getSelectionData,
      setFocusData,
      getFocusData,
      pushDebugEntry,
      getRouterLog,
      getExecutionLog,
      pushReceipt,
      getReceipt,
      getReceiptStack,
      taskService,
      currentUser,
      pageCatalog,
    ],
  );

  // --- Agent hook with debug logging ---

  const onRouterDecision = useCallback(
    (entry) => pushDebugEntry('router', entry),
    [pushDebugEntry],
  );

  const onExecutionComplete = useCallback(
    (entry) => pushDebugEntry('execution', entry),
    [pushDebugEntry],
  );

  const { classifyIntent, executePlan, isThinking, error } = useCommandCenterAgent({
    availableCommands: allCommands,
    executionService: executionService || new ConversationExecutionService(),
    onRouterDecision,
    onExecutionComplete,
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
        snapshotCache.current.delete(source.id);
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
      const { onProgress, onPlanReceived, onThoughtChunk, onStreamOpen } = callbacks;

      const surfaces = registry.getSurfaces?.() || [];
      const targetsBySurface = {};
      for (const surface of surfaces) {
        const sid = surface?.id;
        if (!sid) continue;
        const rawTargets = registry.getTargets?.(sid) || [];
        targetsBySurface[sid] = rawTargets.map((t) => {
          const ref = t.ref || t.id || '';
          const label = t.label || deriveLabelFromId(ref);
          return {
            target_ref: `${sid}::${ref}`,
            id: ref,
            label,
            type: t.type || 'unknown',
          };
        });
      }

      const clientContext = {
        route: window.location.pathname,
        sources: {},
        surfaces,
        targets_by_surface: targetsBySurface,
        navigation: {
          available_pages: registry.pageCatalog || [],
          available_apps: Array.isArray(registry.appCatalog)
            ? registry.appCatalog
            : Object.values(registry.appCatalog || {}),
        },
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
        { onThoughtChunk, onStreamOpen },
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
        const { plan, thought, isPlainTextReply } = classificationResult;

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

        return { plan: finalPlan, thought, results, isPlainTextReply };
      }
      return null;
    },
    [classifyIntent, executePlan, inferenceProviderId, contextSources, registry],
  );

  const value = useMemo(
    () => ({
      commands,
      allCommands,
      isThinking,
      error,
      providers,
      registerContextSource,
      registerCommands,
      getContext,
      executeIntent,
      defaultProviderId,
      registry,
      registerSurface,
      setSelection,
      setFocusData,
      executionService: executionService || new ConversationExecutionService(),
      ConversationManagementService: conversationManagementService || ConversationManagementService,
    }),
    [
      commands,
      allCommands,
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
      registry,
      registerSurface,
      setSelection,
      setFocusData,
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
