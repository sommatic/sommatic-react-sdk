import React, { useState, useEffect, useRef } from 'react';
import LensBlurIcon from '@mui/icons-material/LensBlur';
import styled, { keyframes } from 'styled-components';

// Command Center brand mark: spins while pulsing bigger/smaller so it reads as
// "alive/processing" rather than a flat rotation. rotate + scale share one
// transform keyframe; the ease-in-out cubic-bezier gives the breathing rhythm.
const pulseSpin = keyframes`
  0% {
    transform: rotate(0deg) scale(0.72);
  }
  50% {
    transform: rotate(180deg) scale(1.18);
  }
  100% {
    transform: rotate(360deg) scale(0.72);
  }
`;

const Row = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  padding: 0 2px;
`;

const Mark = styled.span`
  display: inline-flex;
  color: #7c3aed;
  transform-origin: center;
  animation: ${pulseSpin} 1.3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
`;

const Label = styled.span`
  font-size: 0.68rem;
  color: rgba(0, 0, 0, 0.5);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

function resolveStart(raw) {
  if (raw == null || raw === '') {
    return Date.now();
  }
  const ms = /^\d+$/.test(String(raw)) ? Number(raw) : new Date(raw).getTime();
  return ms && !Number.isNaN(ms) ? ms : Date.now();
}

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function StreamingIndicator({ startedAt }) {
  const startRef = useRef(null);
  if (startRef.current === null) {
    startRef.current = resolveStart(startedAt);
  }

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Row aria-live="polite">
      <Mark>
        <LensBlurIcon sx={{ fontSize: 21 }} />
      </Mark>
      <Label>Processing · {formatElapsed(now - startRef.current)}</Label>
    </Row>
  );
}

export default StreamingIndicator;
