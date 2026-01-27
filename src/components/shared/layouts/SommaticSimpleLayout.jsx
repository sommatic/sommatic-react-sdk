import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';

import '@styles/bootstrap-namespaced.css';
import '@styles/styles.css';
import '@styles/fonts.css';

export const SommaticSimpleLayout = ({ children, ...props }) => {
  return (
    <section className={`sommatic`} style={{ boxSizing: 'border-box' }}>
      <main {...props}>{children}</main>
    </section>
  );
};
