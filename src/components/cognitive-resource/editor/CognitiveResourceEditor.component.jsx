import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, Tab } from '@mui/material';
import styled from 'styled-components';

import CognitiveResourceEditorHeader from './CognitiveResourceEditorHeader.component.jsx';
import CognitiveResourceContextPanel from './CognitiveResourceContextPanel.component.jsx';
import CognitiveResourcePreviewPanel from './CognitiveResourcePreviewPanel.component.jsx';
import CognitiveResourceValidationPanel from './CognitiveResourceValidationPanel.component.jsx';

import CognitiveResourceOverviewTab from './tabs/CognitiveResourceOverviewTab.component.jsx';
import CognitiveResourceContentTab from './tabs/CognitiveResourceContentTab.component.jsx';
import CognitiveResourceGovernanceTab from './tabs/CognitiveResourceGovernanceTab.component.jsx';
import CognitiveResourceUsageTab from './tabs/CognitiveResourceUsageTab.component.jsx';
import CognitiveResourceBindingsTab from './tabs/CognitiveResourceBindingsTab.component.jsx';

const EditorRoot = styled.section`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
`;

const EditorBody = styled.section`
  flex: 1;
  overflow: hidden;
`;

const ScrollPane = styled.section`
  height: 100%;
  overflow-y: auto;
  padding: ${(props) => props.$noPadding ? '0' : '0 20px'};
`;

const TabBar = styled.section`
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 0 20px;
`;

const VALID_TABS = ['overview', 'content', 'governance', 'usage', 'bindings'];

function CognitiveResourceEditor({
  ui = {},
  apiKey = '',
  environment = 'production',
  onEvent,
  entitySelected = null,
  isPopupContext = false,
  setIsOpen,
}) {
  const [resource, setResource] = useState(entitySelected || {});
  const [bindings, setBindings] = useState(entitySelected?.bindings || []);
  const [activeTab, setActiveTab] = useState('content');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entitySelected) {
      setResource(entitySelected);
      setBindings(entitySelected.bindings || []);
      setIsDirty(false);
    }
  }, [entitySelected]);

  const emitEvent = useCallback(
    (action, payload = {}, error = null) => {
      if (!onEvent) {
        return;
      }

      onEvent({
        action,
        namespace: 'sommatic',
        payload,
        error,
      });
    },
    [onEvent]
  );

  const handleResourceChange = useCallback(
    (nextResource) => {
      setResource(nextResource);
      setIsDirty(true);
      emitEvent('cognitive-resource-editor::changed', { resource: nextResource });
    },
    [emitEvent]
  );

  const handleSave = useCallback(() => {
    setIsSaving(true);
    emitEvent('cognitive-resource-editor::save-requested', {
      resource,
      bindings,
    });
  }, [resource, bindings, emitEvent]);

  const handlePublish = useCallback(() => {
    emitEvent('cognitive-resource-editor::publish-requested', {
      resource,
      bindings,
    });
  }, [resource, bindings, emitEvent]);

  const handleBack = useCallback(() => {
    if (setIsOpen) {
      setIsOpen(false);
    }
    emitEvent('cognitive-resource-editor::closed', { isDirty });
  }, [setIsOpen, isDirty, emitEvent]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleAddBinding = useCallback(
    (binding) => {
      const nextBindings = [...bindings, binding];
      setBindings(nextBindings);
      setIsDirty(true);
      emitEvent('cognitive-resource-editor::binding-added', { binding });
    },
    [bindings, emitEvent]
  );

  const handleRemoveBinding = useCallback(
    (binding, index) => {
      const nextBindings = bindings.filter((_, i) => i !== index);
      setBindings(nextBindings);
      setIsDirty(true);
      emitEvent('cognitive-resource-editor::binding-removed', { binding });
    },
    [bindings, emitEvent]
  );

  const setSavingComplete = useCallback(
    (success = true) => {
      setIsSaving(false);
      if (success) {
        setIsDirty(false);
      }
    },
    []
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <CognitiveResourceOverviewTab
            resource={resource}
            onChange={handleResourceChange}
            ui={ui}
          />
        );
      case 'content':
        return (
          <CognitiveResourceContentTab
            resource={resource}
            onChange={handleResourceChange}
            ui={ui}
          />
        );
      case 'governance':
        return (
          <CognitiveResourceGovernanceTab
            resource={resource}
            onChange={handleResourceChange}
            ui={ui}
          />
        );
      case 'usage':
        return (
          <CognitiveResourceUsageTab
            resource={resource}
            onChange={handleResourceChange}
            ui={ui}
          />
        );
      case 'bindings':
        return (
          <CognitiveResourceBindingsTab
            resource={resource}
            bindings={bindings}
            onAddBinding={handleAddBinding}
            onRemoveBinding={handleRemoveBinding}
            ui={ui}
          />
        );
      default:
        return null;
    }
  };

  return (
    <EditorRoot>
      <CognitiveResourceEditorHeader
        resource={resource}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onPublish={handlePublish}
        onBack={isPopupContext ? handleBack : undefined}
        ui={ui}
      />

      <EditorBody>
        <div className="d-flex h-100">
          <div className="row g-0 h-100">
            {/* Left context panel */}
            <div className="col-lg-2 col-md-3 d-none d-md-block h-100">
              <ScrollPane $noPadding>
                <CognitiveResourceContextPanel
                  resource={resource}
                  bindings={bindings}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  ui={ui}
                />
              </ScrollPane>
            </div>

            {/* Center editing surface */}
            <div className="col-lg-7 col-md-6 col-12 h-100">
              <ScrollPane>
                {/* Mobile tab bar — visible only on small screens */}
                <section className="d-block d-md-none mb-3">
                  <Tabs
                    value={activeTab}
                    onChange={(_, val) => handleTabChange(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      minHeight: 36,
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        minHeight: 36,
                        padding: '6px 12px',
                      },
                      '& .Mui-selected': {
                        color: '#3A2E4F',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#3A2E4F',
                      },
                    }}
                  >
                    <Tab label={ui?.contentTabLabel || 'Content'} value="content" />
                    <Tab label={ui?.overviewTabLabel || 'General'} value="overview" />
                    <Tab label={ui?.governanceTabLabel || 'Governance'} value="governance" />
                    <Tab label={ui?.usageTabLabel || 'Usage'} value="usage" />
                    <Tab label={ui?.bindingsTabLabel || 'Bindings'} value="bindings" />
                  </Tabs>
                </section>

                {renderTab()}
              </ScrollPane>
            </div>

            {/* Right preview + validation panel */}
            <div className="col-lg-3 col-md-3 d-none d-md-block h-100">
              <ScrollPane $noPadding>
                <CognitiveResourcePreviewPanel resource={resource} ui={ui} />
                <CognitiveResourceValidationPanel resource={resource} bindings={bindings} ui={ui} />
              </ScrollPane>
            </div>
          </div>
        </div>
      </EditorBody>
    </EditorRoot>
  );
}

export default CognitiveResourceEditor;
