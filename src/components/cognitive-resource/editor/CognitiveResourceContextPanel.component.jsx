import React from 'react';
import { Chip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import styled from 'styled-components';

import KnowledgeResourceTypeBadge from '../KnowledgeResourceTypeBadge.component.jsx';
import KnowledgeResourceStatusBadge from '../KnowledgeResourceStatusBadge.component.jsx';

const PanelContainer = styled.nav`
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  height: 100%;
  padding: 16px 12px;
`;

const IdentitySection = styled.section`
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ResourceTitle = styled.h6`
  font-weight: 600;
  font-size: 0.85rem;
  color: #1f2937;
  margin: 0 0 8px 0;
  word-break: break-word;
`;

const ResourceSlug = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: ${(props) => (props.$active ? '#3A2E4F' : 'transparent')};
  color: ${(props) => (props.$active ? '#ffffff' : '#4B5563')};
  font-size: 0.8rem;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => (props.$active ? '#2D243E' : '#f3f4f6')};
  }
`;

const SectionLabel = styled.span`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  font-weight: 600;
  display: block;
  margin: 16px 0 6px 10px;
`;

const SummaryItem = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  font-size: 0.75rem;
  color: #6B7280;
`;

const TABS = [
  { key: 'content', label: 'Content', icon: EditNoteOutlinedIcon },
  { key: 'overview', label: 'General', icon: InfoOutlinedIcon },
  { key: 'governance', label: 'Governance', icon: GavelOutlinedIcon },
  { key: 'usage', label: 'Usage', icon: SettingsOutlinedIcon },
  { key: 'bindings', label: 'Bindings', icon: LinkOutlinedIcon },
];

function CognitiveResourceContextPanel({
  resource = {},
  bindings = [],
  activeTab = 'content',
  onTabChange,
  ui = {},
}) {
  const resourceName = resource.name || ui?.defaultName || 'Untitled';
  const bindingCount = Array.isArray(bindings) ? bindings.length : 0;
  const tagCount = Array.isArray(resource.tags) ? resource.tags.length : 0;

  return (
    <PanelContainer>
      <IdentitySection>
        <ResourceTitle>{resourceName}</ResourceTitle>
        {resource.slug && <ResourceSlug>{resource.slug}</ResourceSlug>}

        <section className="d-flex flex-wrap gap-1 mt-2">
          <KnowledgeResourceTypeBadge type={resource.resource_type} ui={ui} />
          <KnowledgeResourceStatusBadge status={resource.status} ui={ui} />
        </section>

        {resource.version && (
          <span className="d-block mt-1" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            v{resource.version}
          </span>
        )}
      </IdentitySection>

      <SectionLabel>{ui?.navigationLabel || 'Navigation'}</SectionLabel>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const label = ui?.[`${tab.key}TabLabel`] || tab.label;

        return (
          <NavItem key={tab.key} $active={activeTab === tab.key} onClick={() => onTabChange && onTabChange(tab.key)}>
            <Icon sx={{ fontSize: 16 }} />
            {label}
          </NavItem>
        );
      })}

      <SectionLabel>{ui?.summaryLabel || 'Summary'}</SectionLabel>
      <SummaryItem>
        <span>Tags</span>
        <Chip label={tagCount} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
      </SummaryItem>
      <SummaryItem>
        <span>Bindings</span>
        <Chip label={bindingCount} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
      </SummaryItem>
      {resource.language && (
        <SummaryItem>
          <span>Language</span>
          <span style={{ fontWeight: 500 }}>{resource.language}</span>
        </SummaryItem>
      )}
    </PanelContainer>
  );
}

export default CognitiveResourceContextPanel;
