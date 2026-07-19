import React, { useState } from 'react';
import styled from 'styled-components';
import { KeyboardArrowDown, KeyboardArrowUp, Input as InputIcon, Apps as AppsIcon } from '@mui/icons-material';

// Capped narrow and left-aligned so this past-action card stays compact instead
// of stretching across the full conversation column (matches ThoughtProcess).
const Container = styled.section`
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  margin-bottom: 12px;
  font-family: inherit;
  max-width: 400px;
`;

const Header = styled.header`
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
  }
`;

// Muted gray, not brand purple: these cards represent a past action and should
// recede in the stream rather than compete with live/active elements.
const IconWrapper = styled.div`
  color: #6b7280;
`;

const Title = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
`;

// Same completed badge as ThoughtProcess (teal dot + label). These cards always
// represent a finished action, so the status is fixed.
const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #30bbb7;
  white-space: nowrap;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #30bbb7;
  }
`;

const Content = styled.div`
  padding: 0 16px 16px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  animation: appOutputFadeIn 0.3s ease-in-out;

  @keyframes appOutputFadeIn {
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

const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: #636e72;
`;

const DetailValue = styled.span`
  font-size: 0.85rem;
  color: #2d3436;
  font-weight: 500;
  font-family: 'Roboto Mono', monospace;
`;

const AppOutputCard = ({ appSlug, isEmbed = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const headerText = isEmbed ? 'App opened' : 'Data received';
  const HeaderIcon = isEmbed ? AppsIcon : InputIcon;

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
            <HeaderIcon style={{ fontSize: '1.1rem' }} />
          </IconWrapper>
          <Title>{headerText}</Title>
        </div>
        <div className="d-flex align-items-center" style={{ gap: '10px' }}>
          <StatusBadge>Completed</StatusBadge>
          <IconWrapper>
            {isExpanded ? (
              <KeyboardArrowUp style={{ fontSize: '1.2rem' }} />
            ) : (
              <KeyboardArrowDown style={{ fontSize: '1.2rem' }} />
            )}
          </IconWrapper>
        </div>
      </Header>

      {isExpanded && (
        <Content>
          <div className="d-flex align-items-center mt-3" style={{ gap: '8px' }}>
            <DetailLabel>App:</DetailLabel>
            <DetailValue>{appSlug || 'unknown'}</DetailValue>
          </div>
        </Content>
      )}
    </Container>
  );
};

export default AppOutputCard;
