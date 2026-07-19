import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  width: 100%;
  /* Embedded apps (spreadsheets, tables, etc.) can be very tall and would push
     the whole conversation down. Cap the card so the app's own scroll container
     (overflow-y: auto) takes over instead of overflowing the stream. Applies to
     every surface that renders an embed — Command Center sidebar and full page. */
  max-height: 50vh;
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
