import React, { useState } from 'react';
import styled from 'styled-components';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle, Error as ErrorIcon, Schedule, Pending } from '@mui/icons-material';

const Container = styled.section`
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  margin-bottom: 12px;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  background-color: rgba(255, 255, 255, 0.5);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
  }
`;

const TitleGroup = styled.div`
  gap: 8px;
`;

const IconWrapper = styled.div`
  color: #6c5ce7;
`;

const Title = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
`;

const Duration = styled.span`
  font-size: 0.8rem;
  color: #636e72;
  font-family: 'Roboto Mono', monospace;
`;

const Content = styled.div`
  padding: 0 16px 16px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ThoughtText = styled.p`
  font-size: 0.9rem;
  color: #4a4a4a;
  line-height: 1.5;
  margin: 12px 0;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border-left: 3px solid #6c5ce7;
`;

const StepItem = styled.li`
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);

  &:last-child {
    border-bottom: none;
  }
`;

const StepLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  color: #2d3436;
`;

const StepReason = styled.span`
  font-size: 0.8rem;
  color: #636e72;
  margin-top: 2px;
`;

const getStepIcon = (status) => {
  switch (status) {
    case 'success':
      return <CheckCircle sx={{ fontSize: 18, color: '#00b894' }} />;
    case 'error':
      return <ErrorIcon sx={{ fontSize: 18, color: '#d63031' }} />;
    case 'pending':
      return <Pending sx={{ fontSize: 18, color: '#fdcb6e' }} />;
    default:
      return <CheckCircle sx={{ fontSize: 18, color: '#dfe6e9' }} />;
  }
};

/**
 * ThoughtProcess Component
 * Displays the AI's reasoning and execution plan steps.
 *
 * @param {Object} props
 * @param {string} props.thought - The raw thought text from the AI.
 * @param {Array} props.plan - The execution plan steps.
 * @param {number} props.durationMs - Execution duration in milliseconds.
 * @param {boolean} props.defaultExpanded - Whether the accordion is expanded by default.
 */
const ThoughtProcess = ({ thought, plan = [], durationMs, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!thought && (!plan || plan.length === 0)) {
    return null;
  }

  const durationSeconds = durationMs ? (durationMs / 1000).toFixed(1) : '< 1';

  return (
    <Container className="overflow-hidden">
      <Header className="d-flex align-items-center justify-content-between" onClick={() => setIsExpanded(!isExpanded)}>
        <TitleGroup className="d-flex align-items-center">
          <IconWrapper className="d-flex align-items-center justify-content-center">
            <Schedule sx={{ fontSize: 18 }} />
          </IconWrapper>
          <Title>Thought Process</Title>
          <Duration>for {durationSeconds}s</Duration>
        </TitleGroup>
        <IconWrapper className="d-flex align-items-center justify-content-center">
          {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconWrapper>
      </Header>

      {isExpanded && (
        <Content>
          {thought && <ThoughtText className="fst-italic">{thought}</ThoughtText>}
          {plan.length > 0 && (
            <ul className="list-unstyled m-0 p-0">
              {/* TODO: Implement sequential rendering for these steps (one by one appearance) */}
              {plan.map((step, index) => (
                <StepItem key={index} className="d-flex align-items-start">
                  <StepIcon>{getStepIcon(step.status || 'success')}</StepIcon>
                  <div className="d-flex flex-column">
                    <StepLabel>{step.command_id || step.command}</StepLabel>
                    {step.reason && <StepReason>{step.reason}</StepReason>}
                  </div>
                </StepItem>
              ))}
            </ul>
          )}
        </Content>
      )}
    </Container>
  );
};

export default ThoughtProcess;
