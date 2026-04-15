import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${({ $bgColor }) => $bgColor || '#ffffff'};
`;

const CardBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: visible;
  position: relative;
`;

const AppEmbedCard = ({ borderColor, bgColor, children }) => {
  return (
    <CardContainer $borderColor={borderColor} $bgColor={bgColor}>
      <CardBody>
        {children}
      </CardBody>
    </CardContainer>
  );
};

export default AppEmbedCard;
