import React, { useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';

import useHitlSubmit from './hooks/useHitlSubmit.js';
import OutputSchemaSection, { isOutputsValid } from './OutputSchemaSection.component.jsx';
import DecisionSummary from './panels/DecisionSummary.component.jsx';
import BinaryApprovalPanel from './panels/BinaryApprovalPanel.component.jsx';
import ToolApprovalPanel from './panels/ToolApprovalPanel.component.jsx';
import PlanReviewPanel from './panels/PlanReviewPanel.component.jsx';
import SingleSelectPanel from './panels/SingleSelectPanel.component.jsx';
import MultiSelectPanel from './panels/MultiSelectPanel.component.jsx';
import ReviewEditRejectPanel from './panels/ReviewEditRejectPanel.component.jsx';
import { THEME_COLORS } from './theme.js';

const PANEL_REGISTRY = {
  binary_approval: BinaryApprovalPanel,
  tool_approval: ToolApprovalPanel,
  plan_review: PlanReviewPanel,
  single_select_decision: SingleSelectPanel,
  multi_select_decision: MultiSelectPanel,
  review_edit_reject: ReviewEditRejectPanel,
};

const TERMINAL_STATUSES = ['completed', 'rejected', 'invalidated', 'expired'];

// Converts a hex color (e.g. "#1976d2") to an rgba() string with the given alpha.
// Used to tint the HAG header background with a soft variant of the approval_type color.
function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(107, 114, 128, ${alpha})`;
  }
  const h = hex.replace('#', '');
  const normalized = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (normalized.length !== 6) return `rgba(107, 114, 128, ${alpha})`;
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HitlApprovalGate({ task, currentUser, onComplete }) {
  if (!task?.payload?.hitl) {
    return null;
  }

  const isTerminal = TERMINAL_STATUSES.includes(task.status?.name);
  if (isTerminal) {
    return (
      <GateWrapper hitl={task.payload.hitl}>
        <DecisionSummary task={task} />
      </GateWrapper>
    );
  }

  // HAG is visible to any user. If the task isn't claimed yet, submitting a
  // decision will auto-claim on behalf of the current user (backend handles it).

  const approvalTypeName = task.payload.hitl.approval_type?.name;
  const Panel = PANEL_REGISTRY[approvalTypeName];

  if (!Panel) {
    return (
      <GateWrapper hitl={task.payload.hitl}>
        <Typography
          sx={{ fontSize: '0.82rem', color: THEME_COLORS.textSecondary, fontStyle: 'italic' }}
        >
          Unsupported approval type: {approvalTypeName || 'unknown'}
        </Typography>
      </GateWrapper>
    );
  }

  return (
    <GateContent
      task={task}
      hitl={task.payload.hitl}
      Panel={Panel}
      onComplete={onComplete}
      currentUser={currentUser}
    />
  );
}

function GateContent({ task, hitl, Panel, onComplete, currentUser }) {
  const [extraOutputs, setExtraOutputs] = useState({});
  const { submitDecision, isSubmitting } = useHitlSubmit({
    taskId: task.id,
    onComplete,
    currentUser,
    taskIsClaimed: !!task.ownership?.is_claimed,
  });

  const schema = task?.required_output?.schema || {};
  const outputsValid = isOutputsValid(schema, extraOutputs);

  const handlePanelSubmit = (panelPayload) => {
    // Merge extra outputs (schema fields) with the panel's decision payload.
    // The panel's payload takes precedence for overlapping keys (e.g. decision).
    const mergedPayload = { ...extraOutputs, ...panelPayload };
    submitDecision(panelPayload.decision, mergedPayload);
  };

  return (
    <GateWrapper hitl={hitl}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <OutputSchemaSection
          schema={schema}
          outputs={extraOutputs}
          onOutputsChange={setExtraOutputs}
          disabled={isSubmitting}
        />
        <Panel
          hitl={hitl}
          onSubmit={handlePanelSubmit}
          isSubmitting={isSubmitting}
          canSubmit={outputsValid}
        />
      </Box>
    </GateWrapper>
  );
}

function GateWrapper({ hitl, children }) {
  const approvalType = hitl?.approval_type;
  const accentColor = approvalType?.color || THEME_COLORS.brandPrimary;
  const headerBg = hexToRgba(accentColor, 0.12);

  return (
    <Box
      sx={{
        backgroundColor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        borderRadius: '10px',
        // No `overflow: hidden` — it would create a sticky containing block and
        // break the sticky footer used by each approval panel.
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${THEME_COLORS.border}`,
          backgroundColor: headerBg,
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
        }}
      >
        <VerifiedIcon sx={{ fontSize: 16, color: accentColor }} />
        <Typography
          sx={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: THEME_COLORS.textPrimary,
            flex: 1,
          }}
        >
          Approval Gate
        </Typography>
        {approvalType && (
          <Chip
            label={approvalType.title}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: accentColor,
            }}
          />
        )}
      </Box>

      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );
}
