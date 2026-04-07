import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  width: 100%;
  max-height: 420px;
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
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
`;

const EscalationOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 10;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 12px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.55);
  }
`;

const AppEmbedCard = ({ onEscalate, borderColor, bgColor, children }) => {
  const [isEscalated, setIsEscalated] = useState(false);

  useEffect(() => {
    const handleEscalation = async (event) => {
      const { targetMode } = event.detail || {};
      if (!targetMode || !onEscalate) return;

      window.dispatchEvent(new CustomEvent('sommatic:app:pre-escalation', {
        detail: { targetMode },
      }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      onEscalate(targetMode);
      setIsEscalated(true);
    };

    const handleDeEscalation = () => {
      setIsEscalated(false);
    };

    window.addEventListener('sommatic:app:request-escalation', handleEscalation);
    window.addEventListener('sommatic:app:escalation-closed', handleDeEscalation);

    return () => {
      window.removeEventListener('sommatic:app:request-escalation', handleEscalation);
      window.removeEventListener('sommatic:app:escalation-closed', handleDeEscalation);
    };
  }, [onEscalate]);

  const handleOverlayClick = () => {
    window.dispatchEvent(new CustomEvent('sommatic:app:request-de-escalation'));
    setIsEscalated(false);
  };

  return (
    <CardContainer $borderColor={borderColor} $bgColor={bgColor}>
      <CardBody>
        {children}
        {isEscalated && (
          <EscalationOverlay onClick={handleOverlayClick}>
            Click to return to chat
          </EscalationOverlay>
        )}
      </CardBody>
    </CardContainer>
  );
};

export default AppEmbedCard;
