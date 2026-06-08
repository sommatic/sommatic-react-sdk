import React, { useState, useEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

const COLORS = {
  brandPrimary: '#3A2E4F',
  brandPrimaryDark: '#2D243E',
  success: '#30BBB7',
  error: '#FB7185',
  warning: '#F59E0B',
  purple: '#8B5CF6',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textPrimary: '#1F2937',
  surface: '#F9FAFB',
  border: '#E5E7EB',
};

const STATUS_COLORS = {
  active: COLORS.purple,
  completed: COLORS.success,
  failed: COLORS.error,
  pending: COLORS.textSecondary,
};

const STATUS_LABELS = {
  active: 'ACTIVE',
  completed: 'COMPLETED',
  failed: 'FAILED',
  pending: 'PENDING',
};

const CLIENT_SIDE_PATTERNS = ['ui.', 'navigate', 'open', 'display', 'reply', 'clipboard', 'filter', 'set_fields'];
const HITL_PATTERNS = ['review', 'approve', 'task', 'hitl', 'confirm'];
const DESTRUCTIVE_PATTERNS = ['delete', 'remove', 'destroy', 'drop'];

const inferPlanStatus = (steps, isStreaming) => {
  if (!steps || steps.length === 0) {
    return isStreaming ? 'active' : 'pending';
  }
  if (isStreaming) return 'active';
  if (steps.some((step) => step.status === 'running')) return 'active';
  if (steps.some((step) => step.status === 'error')) return 'failed';
  if (steps.length > 0 && steps.every((step) => step.status === 'success')) return 'completed';
  return 'active';
};

const inferTags = (steps) => {
  if (!steps || steps.length === 0) return [];

  const tags = [];
  const commandIds = steps.map((step) => (step.command_id || '').toLowerCase());
  const nonReplyCommands = commandIds.filter((id) => id !== 'reply');

  if (nonReplyCommands.length > 0) {
    const allClientSide = nonReplyCommands.every((id) => CLIENT_SIDE_PATTERNS.some((pattern) => id.includes(pattern)));
    if (allClientSide) {
      tags.push({ label: 'CLIENT-SIDE CAPABLE', color: COLORS.success });
    }
  }

  const hasHitl = commandIds.some((id) => HITL_PATTERNS.some((pattern) => id.includes(pattern)));
  if (hasHitl) {
    tags.push({ label: 'HUMAN REVIEW', color: COLORS.warning });
  }

  const hasDestructive = commandIds.some((id) => DESTRUCTIVE_PATTERNS.some((pattern) => id.includes(pattern)));
  if (!hasDestructive && nonReplyCommands.length > 0) {
    tags.push({ label: 'SAFE ACTION', color: COLORS.success });
  }

  return tags;
};

const deriveObjective = (thought) => {
  if (!thought) return null;
  const first = thought.split(/[.\n]/)[0]?.trim();
  if (!first || first.length < 3) return null;
  return first.length > 120 ? `${first.substring(0, 117)}...` : first;
};

const deriveResolution = (steps) => {
  if (!steps || steps.length === 0) return null;
  const firstNonReply = steps.find((step) => step.command_id !== 'reply');
  if (!firstNonReply) return null;
  return firstNonReply.reason || formatCommandId(firstNonReply.command_id || firstNonReply.command);
};

const formatCommandId = (commandId) => {
  if (!commandId) return '';
  return commandId
    .replace(/^command_center\.(exec|read)\./, '')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// --- Animations ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
`;

const dotsAnimation = keyframes`
  0%, 33% { content: '.'; }
  34%, 66% { content: '..'; }
  67%, 100% { content: '...'; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

// --- Styled Components ---

const Container = styled.section`
  background: ${COLORS.surface};
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  margin-bottom: 12px;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
`;

const PlanHeader = styled.header`
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  background-color: ${COLORS.brandPrimary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s;
  border-radius: 12px 12px ${(props) => (props.$expanded ? '0 0' : '12px 12px')};

  &:hover {
    background-color: ${COLORS.brandPrimaryDark};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const PlanTitle = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const PlanIdLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(props) => STATUS_COLORS[props.$status] || COLORS.textSecondary};
  white-space: nowrap;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${(props) => STATUS_COLORS[props.$status] || COLORS.textSecondary};
  }
`;

const Duration = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
`;

const ChevronWrapper = styled.div`
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  font-size: 1.2rem;
`;

const Content = styled.div`
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const MetaSection = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${COLORS.border};
`;

const MetaLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${COLORS.textSecondary};
  margin-bottom: 2px;
`;

const MetaValue = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${COLORS.textPrimary};
  line-height: 1.4;
`;

const ThoughtText = styled.p`
  font-size: 0.85rem;
  color: ${COLORS.textSecondary};
  line-height: 1.5;
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid ${COLORS.border};
  font-style: italic;
`;

const TimelineContainer = styled.ul`
  list-style: none;
  margin: 0;
  padding: 12px 16px 4px;
`;

const TimelineStep = styled.li`
  position: relative;
  padding-left: 24px;
  padding-bottom: ${(props) => (props.$isLast ? '8px' : '16px')};

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 14px;
    bottom: 0;
    width: 2px;
    background-color: ${(props) => (props.$isLast ? 'transparent' : COLORS.border)};
  }
`;

const bulletSuccess = css`
  background-color: ${COLORS.success};
  border-color: ${COLORS.success};
`;

const bulletError = css`
  background-color: ${COLORS.error};
  border-color: ${COLORS.error};
`;

const bulletRunning = css`
  background-color: ${COLORS.purple};
  border-color: ${COLORS.purple};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const bulletPending = css`
  background-color: transparent;
  border-color: ${COLORS.textMuted};
`;

const getBulletStyles = (status) => {
  switch (status) {
    case 'success':
      return bulletSuccess;
    case 'error':
      return bulletError;
    case 'running':
      return bulletRunning;
    default:
      return bulletPending;
  }
};

const TimelineBullet = styled.div`
  position: absolute;
  left: 0;
  top: 3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid;
  transition: all 0.3s ease;
  ${(props) => getBulletStyles(props.$status)}
`;

const StepLabel = styled.span`
  font-size: 0.85rem;
  font-weight: ${(props) => (props.$status === 'running' ? 600 : 400)};
  color: ${(props) => {
    if (props.$status === 'pending') return COLORS.textMuted;
    if (props.$status === 'running') return COLORS.textPrimary;
    return COLORS.textPrimary;
  }};
  transition: color 0.3s ease, font-weight 0.3s ease;
  text-transform: capitalize;
`;

const StepDescription = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
  margin-top: 2px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 16px 12px;
  border-top: 1px solid ${COLORS.border};
`;

const InfoChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(props) => props.$color || COLORS.textSecondary};
  padding: 4px 10px;
  border: 1px solid ${(props) => (props.$color || COLORS.textSecondary) + '40'};
  border-radius: 999px;
  background-color: ${(props) => (props.$color || COLORS.textSecondary) + '10'};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${(props) => props.$color || COLORS.textSecondary};
    flex-shrink: 0;
  }
`;

const AnimatedDots = styled.span`
  &::after {
    content: '.';
    animation: ${dotsAnimation} 1.2s steps(3, end) infinite;
  }
`;

const BlinkingCursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: ${COLORS.purple};
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 1s step-end infinite;
`;

const ThoughtProcess = ({
  thought,
  plan = [],
  durationMs,
  isStreaming = false,
  isExecuting = false,
  defaultExpanded = true,
  objective,
  resolution,
  planId,
  tags,
}) => {
  const initiallyActive = inferPlanStatus(plan, isStreaming || isExecuting) === 'active';
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && initiallyActive);
  const userToggledRef = useRef(false);
  const wasActiveRef = useRef(initiallyActive);

  // Auto-collapse once execution finishes (active -> terminal). Open while
  // running, collapsed when done — unless the user manually toggled it.
  useEffect(() => {
    const active = inferPlanStatus(plan, isStreaming || isExecuting) === 'active';
    if (wasActiveRef.current && !active && !userToggledRef.current) {
      setIsExpanded(false);
    }
    wasActiveRef.current = active;
  }, [isStreaming, isExecuting, plan]);

  const handleToggle = () => {
    userToggledRef.current = true;
    setIsExpanded((prev) => !prev);
  };

  if (!isStreaming && !isExecuting && !thought && (!plan || plan.length === 0)) {
    return null;
  }

  const durationSeconds = durationMs ? (durationMs / 1000).toFixed(1) : null;
  const displayObjective = objective || deriveObjective(thought);
  const displayResolution = resolution || deriveResolution(plan);
  const displayPlanStatus = inferPlanStatus(plan, isStreaming || isExecuting);
  const displayTags = tags || inferTags(plan);

  return (
    <Container>
      <PlanHeader onClick={handleToggle} $expanded={isExpanded}>
        <HeaderLeft>
          <PlanTitle>EXECUTION PLAN</PlanTitle>
          {planId && <PlanIdLabel>/ {planId}</PlanIdLabel>}
        </HeaderLeft>
        <HeaderRight>
          {isStreaming && !durationSeconds ? (
            <Duration>
              Thinking
              <AnimatedDots />
            </Duration>
          ) : (
            <StatusBadge $status={displayPlanStatus}>{STATUS_LABELS[displayPlanStatus]}</StatusBadge>
          )}
          {durationSeconds && <Duration>{durationSeconds}s</Duration>}
          <ChevronWrapper>{isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</ChevronWrapper>
        </HeaderRight>
      </PlanHeader>

      {isExpanded && (
        <Content>
          {displayObjective && (
            <MetaSection>
              <MetaLabel>OBJECTIVE</MetaLabel>
              <MetaValue>
                {displayObjective}
                {isStreaming && !plan.length && <BlinkingCursor />}
              </MetaValue>
            </MetaSection>
          )}

          {displayResolution && (
            <MetaSection>
              <MetaLabel>RESOLUTION</MetaLabel>
              <MetaValue>{displayResolution}</MetaValue>
            </MetaSection>
          )}

          {thought && !displayObjective && (
            <ThoughtText>
              {thought}
              {isStreaming && <BlinkingCursor />}
            </ThoughtText>
          )}

          {isStreaming && !thought && !displayObjective && (
            <ThoughtText>
              <BlinkingCursor />
            </ThoughtText>
          )}

          {plan.length > 0 && (
            <TimelineContainer>
              {plan.map((step, index) => (
                <TimelineStep key={`${step.command_id || step.command}-${index}`} $isLast={index === plan.length - 1}>
                  <TimelineBullet $status={step.status || 'pending'} />
                  <div>
                    <StepLabel $status={step.status || 'pending'}>
                      {formatCommandId(step.command_id || step.command)}
                    </StepLabel>
                    {step.status === 'running' && step.reason && <StepDescription>{step.reason}</StepDescription>}
                  </div>
                </TimelineStep>
              ))}
            </TimelineContainer>
          )}

          {displayTags.length > 0 && (
            <ChipsContainer>
              {displayTags.map((tag, index) => (
                <InfoChip key={index} $color={tag.color}>
                  {tag.label}
                </InfoChip>
              ))}
            </ChipsContainer>
          )}
        </Content>
      )}
    </Container>
  );
};

export default ThoughtProcess;
