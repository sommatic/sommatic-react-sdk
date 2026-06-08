import React, { useMemo } from 'react';
import styled from 'styled-components';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TerminalIcon from '@mui/icons-material/Terminal';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { selectBubbleHelpers } from './bubbleHelperSuggestions';

// What the Command Center can do — grounded in the read/exec command catalog.
const CAPABILITIES = [
  { icon: SearchIcon, title: 'Look up', desc: 'Scope, tasks, page data & context' },
  { icon: AdsClickIcon, title: 'Execute', desc: 'Open apps, navigate, fill & submit forms' },
  { icon: AccountTreeIcon, title: 'Automate', desc: 'Run workflows with live progress' },
  { icon: TerminalIcon, title: 'Commands', desc: 'Type / for direct commands' },
];

// The parent <section> supplies p-3 (1.5rem / 24px) on all sides. We cancel it
// with a matching negative margin so the gradient/glow bleeds to the panel edges
// (no "cut" band), then re-inset the content with our own padding. Top-aligned so
// the hero icon is never clipped.
const HelpersContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1;
  gap: 1.15rem;
  margin: -1.5rem;
  padding: 1.5rem 1.25rem 1.25rem;
  background:
    radial-gradient(160px 160px at 50% 62px, rgba(139, 92, 246, 0.17), rgba(139, 92, 246, 0) 50%),
    radial-gradient(200px 170px at 88% 10%, rgba(251, 146, 60, 0.13), rgba(251, 146, 60, 0) 58%),
    linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0) 52%);
`;

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
`;

const HeroIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.88));
  box-shadow:
    0 10px 26px rgba(124, 58, 237, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
`;

const HeroTitle = styled.p`
  margin: 0;
  margin-top: 0.4rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.25;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 280px;
  font-size: 0.78rem;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.45;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionLabel = styled.span`
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9ca3af;
  padding-left: 0.15rem;
`;

const CardIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.12);
`;

// Teal accent for the informative "What you can do" rows — the platform's
// secondary brand color, kept distinct from the purple "Try asking" actions.
const CapabilityIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  color: #1f9d99;
  background: rgba(48, 187, 183, 0.14);
`;

const CardBody = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  text-align: left;
`;

const CardTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.25;
`;

const CardDesc = styled.span`
  font-size: 0.72rem;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.3;
`;

// "What you can do" — ONE informative panel (flat, divided rows). No elevation,
// no hover: visually reads as reference, NOT a set of clickable actions.
const CapabilityPanel = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.1rem 0.75rem;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(124, 58, 237, 0.1);
  border-radius: 14px;
`;

const CapabilityRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0;

  & + & {
    border-top: 1px solid rgba(124, 58, 237, 0.08);
  }
`;

// "Try asking" — separate elevated glass cards with hover lift + arrow:
// the elevation, motion and affordance signal "click to send".
const PromptCard = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.7rem 0.6rem 0.8rem;
  cursor: pointer;
  font: inherit;
  text-align: left;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  box-shadow:
    0 5px 18px rgba(58, 46, 79, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition:
    transform 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.82);
    border-color: rgba(255, 255, 255, 0.85);
    box-shadow:
      0 5px 18px rgba(58, 46, 79, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
  }

  &:hover .prompt-arrow {
    opacity: 0.9;
    transform: translateX(2px);
  }

  &:active {
    transform: translateY(0);
    background: rgba(139, 92, 246, 0.14);
  }
`;

const PromptText = styled.span`
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.3;
  word-break: break-word;
`;

const PromptArrow = styled.span.attrs({ className: 'prompt-arrow' })`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: #7c3aed;
  opacity: 0.4;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
`;

function BubbleHelpers({ pathname, onSuggestionClick }) {
  const suggestions = useMemo(() => selectBubbleHelpers(pathname, 3), [pathname]);

  return (
    <HelpersContainer>
      <Hero>
        <HeroIcon>
          <AutoAwesomeIcon fontSize="small" />
        </HeroIcon>
        <HeroTitle>Operate everything in one place</HeroTitle>
        <HeroSubtitle>
          Ask in plain language to look up, execute, and automate across the platform.
        </HeroSubtitle>
      </Hero>

      <Section>
        <SectionLabel>What you can do</SectionLabel>
        <CapabilityPanel>
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <CapabilityRow key={cap.title}>
                <CapabilityIcon>
                  <Icon style={{ fontSize: 18 }} />
                </CapabilityIcon>
                <CardBody>
                  <CardTitle>{cap.title}</CardTitle>
                  <CardDesc>{cap.desc}</CardDesc>
                </CardBody>
              </CapabilityRow>
            );
          })}
        </CapabilityPanel>
      </Section>

      {suggestions && suggestions.length > 0 && (
        <Section>
          <SectionLabel>Try asking</SectionLabel>
          {suggestions.map((suggestion, idx) => {
            const Icon = suggestion.icon;
            return (
              <PromptCard key={idx} type="button" onClick={() => onSuggestionClick(suggestion.text)}>
                {Icon && (
                  <CardIcon>
                    <Icon style={{ fontSize: 16 }} />
                  </CardIcon>
                )}
                <PromptText>{suggestion.text}</PromptText>
                <PromptArrow>
                  <ArrowForwardIcon style={{ fontSize: 15 }} />
                </PromptArrow>
              </PromptCard>
            );
          })}
        </Section>
      )}
    </HelpersContainer>
  );
}

export default BubbleHelpers;
