import React, { useState } from 'react';
import styled from 'styled-components';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInFull as EscalatedIcon,
} from '@mui/icons-material';

const Container = styled.section`
  background: linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%);
  border-radius: 12px;
  border: 1px dashed #bdbdbd;
  margin-bottom: 12px;
  font-family: inherit;
  opacity: 0.7;
`;

const Header = styled.header`
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.6);
  }
`;

const IconWrapper = styled.div`
  color: #9e9e9e;
`;

const Title = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #757575;
  margin: 0;
`;

const Badge = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: #6c5ce7;
  background-color: rgba(108, 92, 231, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
`;

const Content = styled.div`
  padding: 0 16px 16px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const StateBlock = styled.pre`
  font-size: 0.75rem;
  color: #636e72;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 10px 0 0 0;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Roboto Mono', monospace;

  scrollbar-width: thin;
  scrollbar-color: #bdbdbd transparent;
`;

const AppEscalatedCard = ({ appSlug, viewState, escalatedTo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const modeLabel = escalatedTo === 'fullscreen' ? 'Fullscreen' : 'Modal';

  return (
    <Container>
      <Header
        className="d-flex align-items-center justify-content-between"
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        aria-expanded={isExpanded}
      >
        <div className="d-flex align-items-center" style={{ gap: '8px' }}>
          <IconWrapper>
            <EscalatedIcon style={{ fontSize: '1.1rem' }} />
          </IconWrapper>
          <Title>{appSlug || 'App'}</Title>
          <Badge>Escalated to {modeLabel}</Badge>
        </div>
        <IconWrapper>
          {isExpanded ? (
            <KeyboardArrowUp style={{ fontSize: '1.2rem' }} />
          ) : (
            <KeyboardArrowDown style={{ fontSize: '1.2rem' }} />
          )}
        </IconWrapper>
      </Header>

      {isExpanded && viewState && (
        <Content>
          <StateBlock>{JSON.stringify(viewState, null, 2)}</StateBlock>
        </Content>
      )}
    </Container>
  );
};

export default AppEscalatedCard;
