import React from 'react';

import CognitiveResourcePropertiesCard from './CognitiveResourcePropertiesCard.component.jsx';
import CognitiveResourceSummaryCard from './CognitiveResourceSummaryCard.component.jsx';
import CognitiveResourceContentSnapshotCard from './CognitiveResourceContentSnapshotCard.component.jsx';
import CognitiveResourceUsageCard from './CognitiveResourceUsageCard.component.jsx';
import CognitiveResourceBindingsCard from './CognitiveResourceBindingsCard.component.jsx';

function CognitiveResourceDetail({
  ui = {},
  apiKey = '',
  environment = 'production',
  onEvent,
  entitySelected = null,
  isPopupContext = false,
  setIsOpen,
}) {
  if (!entitySelected) {
    return null;
  }

  const resource = entitySelected;
  const bindings = resource.bindings || [];

  return (
    <main className="container-fluid p-3 bg-light" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <section className="row g-3">
        <article className="col-12">
          <CognitiveResourcePropertiesCard resource={resource} onEvent={onEvent} ui={ui} />
        </article>
        <article className="col-md-6">
          <CognitiveResourceSummaryCard resource={resource} ui={ui} />
        </article>
        <article className="col-md-6">
          <CognitiveResourceUsageCard resource={resource} ui={ui} />
        </article>
        <article className="col-md-6">
          <CognitiveResourceContentSnapshotCard resource={resource} ui={ui} />
        </article>
        <article className="col-md-6">
          <CognitiveResourceBindingsCard bindings={bindings} ui={ui} />
        </article>
      </section>
    </main>
  );
}

export default CognitiveResourceDetail;
