import styled from 'styled-components';

export const ConsoleDock = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${(props) => (props.$maximized ? '60vh' : '280px')};
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 12px rgba(17, 24, 39, 0.08);
  z-index: 20;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
`;

export const ConsoleToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  flex-shrink: 0;
`;

export const ConsoleTitle = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
  white-space: nowrap;
`;

export const SearchInput = styled.input`
  flex: 1;
  max-width: 320px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-family: inherit;
  color: #374151;
  background-color: #ffffff;
  outline: none;

  &:focus {
    border-color: #a5b4fc;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const ConsoleBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.55;
`;

export const ItemRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: ${(props) => (props.$expandable ? 'pointer' : 'default')};

  &:hover {
    background-color: #f9fafb;
  }
`;

/* Event rows are laid out as fixed-width columns (timestamp | id | node slug |
   event chip | node name | payload) so fast scrolling reads as a clean table —
   variable-width chips make the rows zig-zag. */
export const EventIdChip = styled.span`
  flex-shrink: 0;
  width: 56px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #4338ca;
  background-color: #eef2ff;
  border-radius: 4px;
  padding: 1px 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: #e0e7ff;
  }
`;

export const EventNameChip = styled.span`
  flex-shrink: 0;
  width: 150px;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: ${(props) => props.$color || '#374151'};
  background-color: ${(props) => props.$bg || '#f3f4f6'};
  border-radius: 4px;
  padding: 1px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemTimestamp = styled.span`
  flex-shrink: 0;
  width: 84px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: #9ca3af;
  white-space: nowrap;
`;

export const ItemNodeSlug = styled.span`
  flex-shrink: 0;
  width: 180px;
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemNodeName = styled.span`
  flex-shrink: 0;
  width: 200px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemPreview = styled.span`
  flex: 1;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemErrorPreview = styled.span`
  flex: 1;
  color: #9f1239;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PayloadBlock = styled.pre`
  margin: 2px 0 6px 26px;
  padding: 8px 10px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 11px;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
`;

export const ReplLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 2px 4px;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${(props) => {
    if (props.$kind === 'command') return '#6d28d9';
    if (props.$kind === 'error') return '#9f1239';
    if (props.$kind === 'warn') return '#b45309';
    if (props.$kind === 'result') return '#0f766e';
    return '#374151';
  }};
`;

export const ReplPrompt = styled.span`
  flex-shrink: 0;
  font-weight: 700;
  color: ${(props) => (props.$kind === 'command' ? '#6d28d9' : '#9ca3af')};
`;

export const CommandArea = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: stretch;
  background-color: #ffffff;
`;

export const CommandPrompt = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 8px 4px 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #6d28d9;
`;

export const CommandEditorWrap = styled.div`
  flex: 1;
  min-height: 64px;
  padding: 4px 6px 4px 0;
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
  padding: 0 24px;
`;
