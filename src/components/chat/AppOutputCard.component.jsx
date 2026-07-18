import React, { useState } from 'react';
import styled from 'styled-components';
import { KeyboardArrowDown, KeyboardArrowUp, Input as InputIcon, Apps as AppsIcon } from '@mui/icons-material';

const Container = styled.section`
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  margin-bottom: 12px;
  font-family: inherit;
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

const IconWrapper = styled.div`
  color: #6c5ce7;
`;

const Title = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
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

  const headerText = isEmbed ? 'App opened in conversation' : 'Data received from an app';
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
        <IconWrapper>
          {isExpanded ? (
            <KeyboardArrowUp style={{ fontSize: '1.2rem' }} />
          ) : (
            <KeyboardArrowDown style={{ fontSize: '1.2rem' }} />
          )}
        </IconWrapper>
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
