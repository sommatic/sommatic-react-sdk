import React, { useEffect } from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  width: 100%;
  height: 360px;
  border-radius: 12px;
  border: 1px solid ${({ $borderColor }) => $borderColor || '#e0e0e0'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${({ $bgColor }) => $bgColor || '#ffffff'};
`;

const CardBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  position: relative;
`;

const AppEmbedCard = ({ onEscalate, borderColor, bgColor, children }) => {
  useEffect(() => {
    const handleEscalation = (event) => {
      const { targetMode } = event.detail || {};
      if (targetMode && onEscalate) {
        onEscalate(targetMode);
      }
    };

    window.addEventListener('sommatic:app:request-escalation', handleEscalation);
    return () => {
      window.removeEventListener('sommatic:app:request-escalation', handleEscalation);
    };
  }, [onEscalate]);

  return (
    <CardContainer $borderColor={borderColor} $bgColor={bgColor}>
      <CardBody>{children}</CardBody>
    </CardContainer>
  );
};

export default AppEmbedCard;
