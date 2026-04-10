import React, { useMemo } from 'react';
import styled from 'styled-components';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { selectBubbleHelpers } from './bubbleHelperSuggestions';

const HelpersContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 1.5rem 1rem;
  gap: 0.5rem;
`;

const HelpersIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  margin-bottom: 0.25rem;
`;

const HelpersTitle = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  text-align: center;
  font-weight: 500;
`;

const BubblesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const SuggestionBubble = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 400;
  color: #1a1a1a;
  background-color: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  line-height: 1.35;
  word-break: break-word;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    background-color: rgba(139, 92, 246, 0.15);
    border-color: rgba(139, 92, 246, 0.4);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
  }

  &:active {
    background-color: rgba(139, 92, 246, 0.22);
  }
`;

const BubbleIcon = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: #7c3aed;
`;

function BubbleHelpers({ pathname, onSuggestionClick }) {
  const suggestions = useMemo(() => selectBubbleHelpers(pathname, 4), [pathname]);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <HelpersContainer>
      <HelpersIcon>
        <AutoAwesomeIcon fontSize="small" />
      </HelpersIcon>
      <HelpersTitle>Try asking...</HelpersTitle>
      <BubblesWrapper>
        {suggestions.map((suggestion, idx) => {
          const IconComponent = suggestion.icon;
          return (
            <SuggestionBubble key={idx} type="button" onClick={() => onSuggestionClick(suggestion.text)}>
              {IconComponent && (
                <BubbleIcon>
                  <IconComponent style={{ fontSize: 16 }} />
                </BubbleIcon>
              )}
              {suggestion.text}
            </SuggestionBubble>
          );
        })}
      </BubblesWrapper>
    </HelpersContainer>
  );
}

export default BubbleHelpers;
