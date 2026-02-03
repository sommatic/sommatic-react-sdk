import React, { useState, useEffect } from 'react';
import { Fab } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import styled from 'styled-components';

const StyledFab = styled(Fab)`
  &.MuiFab-root {
    position: fixed;
    right: ${({ $isOpen }) => ($isOpen ? '416px' : '16px')};
    bottom: ${({ $isFooterVisible }) => ($isFooterVisible ? '80px' : '16px')};
    background-color: #7c3aed;
    color: #ffffff;
    z-index: 1300;
    transition:
      right 225ms cubic-bezier(0, 0, 0.2, 1) 0ms,
      bottom 225ms cubic-bezier(0, 0, 0.2, 1) 0ms;

    &:hover {
      background-color: #6d28d9;
      box-shadow: 0 8px 22px rgba(124, 58, 237, 0.45);
    }
  }
`;

const CommandCenterTrigger = ({ isOpen, toggleSidebar, footerSelector = '.footer-container' }) => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footerElement = document.querySelector(footerSelector);

    if (!footerElement) return;

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
      className="rounded-2 shadow"
      onClick={() => toggleSidebar()}
    >
      <AutoAwesomeIcon fontSize="small" />
    </StyledFab>
  );
};

export default CommandCenterTrigger;
