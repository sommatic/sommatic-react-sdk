import React from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';

// Fullscreen image viewer. Portaled to document.body so it escapes the Command
// Center's stacking context (z-index 1400) and always sits on top (z 1600).
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1600;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  cursor: zoom-out;
`;

const Image = styled.img`
  max-width: 92vw;
  max-height: 92vh;
  border-radius: 10px;
  box-shadow: 0 16px 56px rgba(0, 0, 0, 0.55);
  cursor: default;

  /* Subtle checkerboard so transparent images read clearly against the dark
     backdrop (opaque images simply cover it). */
  background-color: #f6f6f8;
  background-image:
    linear-gradient(45deg, #e2e2ea 25%, transparent 25%),
    linear-gradient(-45deg, #e2e2ea 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e2ea 75%),
    linear-gradient(-45deg, transparent 75%, #e2e2ea 75%);
  background-size: 22px 22px;
  background-position: 0 0, 0 11px, 11px -11px, -11px 0;
`;

const Close = styled.button`
  position: fixed;
  top: 20px;
  right: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  background: rgba(48, 48, 54, 0.82);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.15s;

  &:hover {
    background: rgba(70, 70, 78, 0.95);
  }
`;

function ImageLightbox({ url, onClose }) {
  if (!url) {
    return null;
  }

  return createPortal(
    <Overlay onClick={onClose}>
      <Close aria-label="Close preview" onClick={onClose}>
        <CloseIcon />
      </Close>
      <Image src={url} alt="Attachment preview" onClick={(event) => event.stopPropagation()} />
    </Overlay>,
    document.body,
  );
}

export default ImageLightbox;
