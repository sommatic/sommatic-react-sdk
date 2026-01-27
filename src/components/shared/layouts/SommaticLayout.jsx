import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';

import '@styles/bootstrap-namespaced.css';
import '@styles/styles.css';
import '@styles/fonts.css';

import sommaticLogo from '@assets/logos/sommatic-logo-dark.svg';

const Container = styled.article`
  margin: 0 auto;
  min-width: 450px;
  width: ${(props) => (props.$ispopup ? '800px' : '100%')};
  ${(props) => (props.$ispopup ? '' : 'flex-grow: 1;')};

  @media (max-width: 1199px) {
    width: ${(props) => (props.$ispopup ? '700px' : '100%')};
  }

  @media (max-width: 991px) {
    width: ${(props) => (props.$ispopup ? '600px' : '100%')};
  }

  @media (max-width: 767px) {
    width: ${(props) => (props.$ispopup ? '500px' : '100%')};
  }

  @media (max-width: 575px) {
    width: 100%;
  }
`;

export const PoweredBy = ({ align = 'end', position = 'bottom' }) => (
  <Box
    component="section"
    sx={{
      display: 'flex',
      justifyContent: align,
      mb: position === 'top' ? 2 : 0,
      mt: position === 'bottom' ? 2 : 0,
    }}
  >
    <Typography
      sx={{
        mr: 0.5,
        color: 'text.secondary',
        fontSize: '0.775rem',
        fontWeight: 400,
      }}
    >
      Powered by
    </Typography>
    <Box component="img" src={sommaticLogo} alt="Sommatic logo" sx={{ height: 15 }} />
  </Box>
);

export const SommaticLayout = ({
  children,
  isPopupContext = false,
  ui = { showLogo: true, vertical: 'bottom', alignment: 'end' },
  ...props
}) => {
  return (
    <Container $ispopup={isPopupContext} className="sommatic" style={{ boxSizing: 'border-box' }}>
      {ui?.showLogo === true && ui?.vertical === 'top' && <PoweredBy align={ui?.alignment} position={ui?.vertical} />}

      <main {...props}>{children}</main>

      {ui?.showLogo === true && ui?.vertical === 'bottom' && <PoweredBy align={ui?.alignment} position={ui?.vertical} />}
    </Container>
  );
};
