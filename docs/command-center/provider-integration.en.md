# Provider Integration

> EN · also available in [provider-integration.es.md](provider-integration.es.md)

How a host webapp wires `<CommandCenterProvider>`, mounts the sidebar, and supplies the services the Command Center needs.

## Provider chain

The Command Center expects identity already established. Mount it inside `AuthProvider` from `@veripass/react-sdk`. The Omnisearch provider is independent — typical chain:

```jsx
import { AuthProvider } from '@veripass/react-sdk';
import { OmniSearchRegistryProvider } from '@link-loom/react-sdk';
import {
  CommandCenterProvider,
  CommandCenterSidebar,
} from '@sommatic/react-sdk';

import { allCommands } from './command-center/commands';
import {
  ConversationExecutionService,
  ConversationManagementService,
  LLMProviderService,
} from '@/services';

function App() {
  return (
    <AuthProvider>
      <CommandCenterProvider
        commands={allCommands}
        executionService={new ConversationExecutionService()}
        conversationManagementService={ConversationManagementService}
        llmProviderService={LLMProviderService}
        appCatalog={appRegistry}
        pageCatalog={pageRegistry}
      >
        <OmniSearchRegistryProvider>
          {/* layouts and routes */}
          <CommandCenterSidebar />
        </OmniSearchRegistryProvider>
      </CommandCenterProvider>
    </AuthProvider>
  );
}
```

## Required services

| Prop | Shape | Purpose |
|---|---|---|
| `commands` | `Array<CommandDef>` | All read + exec command definitions. Use the factories in `src/features/command-center/commands/definitions.js`. |
| `executionService` | `{ execute(envelope), executeStream?(envelope, { onOpen, onChunk, onDone, onError }) }` | LLM transport. Posts to `/command-center/classify` on `bsh.sommatic.backend.svc`. |
| `conversationManagementService` | service class | Persists conversation history. |
| `llmProviderService` | service class | Resolves the active LLM provider for the user/org. |
| `appCatalog` | `Array<{ slug, name, description, tags, default_route }>` | Feeds `context.client.navigation.available_apps` for `openApp` NL resolution. |
| `pageCatalog` | `Array<{ path, description }>` | Feeds `context.client.navigation.available_pages` for `navigate` NL resolution. |

If `executeStream` is present, the agent prefers SSE; otherwise it falls back to single-shot `execute`. Backends without SSE work transparently.

## Building the command list

```javascript
// src/command-center/commands/index.js
import { useNavigate } from 'react-router-dom';
import { getReadCommands, getExecCommands } from '@sommatic/react-sdk';

export const useAllCommands = (registry) => {
  const navigate = useNavigate();
  const icons = {/* Bolt, Search, ... */};
  return [
    ...getReadCommands({ getContext: registry.getContext, icons, registry }),
    ...getExecCommands({ navigate, icons, registry }),
  ];
};
```

The `registry` object is the one exposed by `useCommandCenterContext()`. The factories curry the dependencies so each action sees them when invoked.

## Mounting the sidebar and trigger

The sidebar is a fixed-position right panel. Mount it once, anywhere inside the Provider:

```jsx
<MainLayout>
  <Outlet />
  <CommandCenterTrigger />     {/* button or hotkey, optional */}
  <CommandCenterSidebar />
</MainLayout>
```

To open it programmatically from any feature:

```javascript
window.dispatchEvent(
  new CustomEvent('sommatic:open-command-center', {
    detail: {
      conversationId: 'optional-existing-id',
      initialMessage: '/page-outline',
      // Or to embed an App Engine app:
      appEmbed: {
        app_slug: 'liquidaciones-ai',
        route_path: '/new-sentence',
        input_payload: { mode: 'create' },
        launch_mode: 'command-center',
      },
    },
  }),
);
```

The Sidebar listens for the event, opens, and either prefills the input or creates an embedded app card.

## Per-page wiring (`*.sommatic.jsx`)

Each page that wants to be operable through the Command Center adds a co-located `*.sommatic.jsx` wrapper that registers a context source and one or more surfaces. See [sommatic-jsx-authoring.en.md](sommatic-jsx-authoring.en.md).

In the parent component, render the wrapper alongside the regular content:

```jsx
function OrganizationManagementEdit(props) {
  const formDataRef = useRef({});
  // ... regular form code

  return (
    <>
      {/* regular JSX */}
      <OrganizationManagementEditSommatic
        formDataRef={formDataRef}
        handleSubmit={handleSubmit}
        setIsOpen={setIsOpen}
      />
    </>
  );
}
```

The wrapper renders `null`; only its hooks fire and register metadata.

## Per-org / per-environment configuration

The Provider relies on environment-resolved values:

| Concern | Where |
|---|---|
| Backend base URL | `import.meta.env.VITE_APP_BACKEND_URL` (consumed by `ConversationExecutionService`). |
| LLM provider | Resolved at runtime via `LLMProviderService`. The chat UI exposes the picker. |
| Debug verbose logs | `import.meta.env.VITE_COMMAND_CENTER_DEBUG === 'true'` enables `console.log` per executed step. |
| Conversation persistence | Backend Mongo via `conversationManagementService`. |

## Common pitfalls

- **Mounting the Provider twice** in the tree — registry resets, surfaces lose their handlers between renders.
- **Mounting the Sidebar but not the Provider** — the Sidebar's `useCommandCenterContext()` throws.
- **Missing `executionService`** — `classifyIntent` errors with "No Execution Service provided to Agent."
- **No `llm_provider_id`** — `classifyIntent` errors with "No LLM Provider ID provided for inference." The chat UI must select a provider before sending.
- **Forgetting `page-context`** — many read actions fall back to "the first registered InsightSource if `page-context` is not published." For predictable behavior, always publish a source with that ID per page.

## Cross-references

- [architecture.en.md](architecture.en.md)
- [sommatic-jsx-authoring.en.md](sommatic-jsx-authoring.en.md)
- [agent-and-inference.en.md](agent-and-inference.en.md)
