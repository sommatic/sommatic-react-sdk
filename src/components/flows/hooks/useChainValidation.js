import { useMemo } from 'react';
import { CHAIN_RULES } from '../chainRules.js';

// Evaluates a "when" clause against a node's config object.
// Clause example: { has_hag: true } → returns true iff node.config.has_hag === true.
function matchesWhen(whenClause, config) {
  if (!whenClause || typeof whenClause !== 'object') return true;
  return Object.entries(whenClause).every(([key, expected]) => config?.[key] === expected);
}

function getNodeSlug(node) {
  return node?.data?.slug || node?.slug || node?.data?.operator_slug || node?.operator_slug;
}

function getNodeConfig(node) {
  return node?.data?.config || node?.config || {};
}

// Pure function that computes warnings per node based on CHAIN_RULES.
// Returns: Map<nodeId, string[]> where each string is a warning message.
export function computeChainWarnings(nodes, edges) {
  const warningsByNode = new Map();

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return warningsByNode;
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edgesList = Array.isArray(edges) ? edges : [];

  const outgoingFrom = (nodeId) =>
    edgesList.filter((e) => e.source === nodeId).map((e) => nodeById.get(e.target)).filter(Boolean);
  const incomingTo = (nodeId) =>
    edgesList.filter((e) => e.target === nodeId).map((e) => nodeById.get(e.source)).filter(Boolean);

  for (const node of nodes) {
    const slug = getNodeSlug(node);
    if (!slug) continue;

    const rule = CHAIN_RULES[slug];
    if (!rule) continue;

    const warnings = [];
    const config = getNodeConfig(node);

    if (rule.prev?.required_slug) {
      const incoming = incomingTo(node.id);
      const hasRequiredPrev = incoming.some((n) => getNodeSlug(n) === rule.prev.required_slug);
      if (!hasRequiredPrev) {
        warnings.push(rule.prev.message);
      }
    }

    if (Array.isArray(rule.next)) {
      for (const nextRule of rule.next) {
        const applies = matchesWhen(nextRule.when, config);
        if (!applies) continue;

        const outgoing = outgoingFrom(node.id);
        const hasRequiredNext = outgoing.some(
          (n) => getNodeSlug(n) === nextRule.required_slug,
        );
        if (!hasRequiredNext) {
          warnings.push(nextRule.message);
        }
      }
    }

    if (warnings.length > 0) {
      warningsByNode.set(node.id, warnings);
    }
  }

  return warningsByNode;
}

// React hook wrapper with memoization.
export default function useChainValidation(nodes, edges) {
  return useMemo(() => computeChainWarnings(nodes, edges), [nodes, edges]);
}
