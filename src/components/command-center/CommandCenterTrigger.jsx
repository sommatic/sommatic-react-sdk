import React, { useState, useEffect } from 'react';
import { Fab } from '@mui/material';
import LensBlurIcon from '@mui/icons-material/LensBlur';
import styled from 'styled-components';

const StyledFab = styled(Fab)`
  &.MuiFab-root {
    position: fixed;
    right: ${({ $isOpen }) => ($isOpen ? '416px' : '16px')};
    bottom: ${({ $isFooterVisible }) => ($isFooterVisible ? '80px' : '16px')};
    background-color: #7c3aed;
    color: #ffffff;
    border-radius: 50%;
    z-index: 1400;
    box-shadow:
      0 6px 16px rgba(124, 58, 237, 0.38),
      0 2px 5px rgba(0, 0, 0, 0.18);
    transition:
      right 225ms cubic-bezier(0, 0, 0.2, 1) 0ms,
      bottom 225ms cubic-bezier(0, 0, 0.2, 1) 0ms,
      box-shadow 200ms ease;

    &:hover {
      background-color: #6d28d9;
      box-shadow:
        0 10px 26px rgba(124, 58, 237, 0.5),
        0 3px 8px rgba(0, 0, 0, 0.22);
    }
  }
`;

const CommandCenterTrigger = ({ isOpen, toggleSidebar, footerSelector = '.footer-container' }) => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footerElement = document.querySelector(footerSelector);

    if (!footerElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(footerElement);

    return () => {
      observer.unobserve(footerElement);
    };
  }, [footerSelector]);

  return (
    <StyledFab
      $isOpen={isOpen}
      $isFooterVisible={isFooterVisible}
      size="small"
      aria-label="AI Assistant"
      onClick={() => toggleSidebar()}
    >
      <LensBlurIcon fontSize="small" />
    </StyledFab>
  );
};

export default CommandCenterTrigger;
