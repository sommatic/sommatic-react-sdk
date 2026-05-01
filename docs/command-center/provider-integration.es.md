# Integración del Provider

> ES · también disponible en [provider-integration.en.md](provider-integration.en.md)

Cómo un webapp host cablea `<CommandCenterProvider>`, monta el sidebar y suministra los servicios que el Command Center necesita.

## Cadena de providers

El Command Center asume identidad ya establecida. Móntalo dentro de `AuthProvider` de `@veripass/react-sdk`. El provider de Omnisearch es independiente — cadena típica:

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
          {/* layouts y rutas */}
          <CommandCenterSidebar />
        </OmniSearchRegistryProvider>
      </CommandCenterProvider>
    </AuthProvider>
  );
}
```

## Servicios requeridos

| Prop | Shape | Propósito |
|---|---|---|
| `commands` | `Array<CommandDef>` | Definiciones de read + exec. Usa los factories en `src/features/command-center/commands/definitions.js`. |
| `executionService` | `{ execute(envelope), executeStream?(envelope, { onOpen, onChunk, onDone, onError }) }` | Transporte al LLM. Hace POST a `/command-center/classify` en `bsh.sommatic.backend.svc`. |
| `conversationManagementService` | clase service | Persiste historial de conversación. |
| `llmProviderService` | clase service | Resuelve el LLM provider activo del usuario/org. |
| `appCatalog` | `Array<{ slug, name, description, tags, default_route }>` | Alimenta `context.client.navigation.available_apps` para resolución NL de `openApp`. |
| `pageCatalog` | `Array<{ path, description }>` | Alimenta `context.client.navigation.available_pages` para resolución NL de `navigate`. |

Si `executeStream` está presente, el agente prefiere SSE; si no, hace fallback a `execute` single-shot. Los backends sin SSE funcionan transparentemente.

## Armando la lista de comandos

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

`registry` es el que expone `useCommandCenterContext()`. Los factories curryfican las dependencias para que cada acción las vea cuando se invoque.

## Montaje del sidebar y el trigger

El sidebar es un panel derecho de posición fija. Móntalo una sola vez, en cualquier punto dentro del Provider:

```jsx
<MainLayout>
  <Outlet />
  <CommandCenterTrigger />     {/* botón o hotkey, opcional */}
  <CommandCenterSidebar />
</MainLayout>
```

Para abrirlo programáticamente desde cualquier feature:

```javascript
window.dispatchEvent(
  new CustomEvent('sommatic:open-command-center', {
    detail: {
      conversationId: 'id-existente-opcional',
      initialMessage: '/page-outline',
      // O para embeber una app del App Engine:
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

El Sidebar escucha el evento, abre, y o pre-llena el input o crea una app card embebida.

## Cableo por página (`*.sommatic.jsx`)

Cada página que quiera ser operable por el Command Center añade un wrapper co-localizado `*.sommatic.jsx` que registra una fuente de contexto y una o más surfaces. Ver [sommatic-jsx-authoring.es.md](sommatic-jsx-authoring.es.md).

En el componente padre, renderiza el wrapper junto al contenido habitual:

```jsx
function OrganizationManagementEdit(props) {
  const formDataRef = useRef({});
  // ... código habitual de formulario

  return (
    <>
      {/* JSX habitual */}
      <OrganizationManagementEditSommatic
        formDataRef={formDataRef}
        handleSubmit={handleSubmit}
        setIsOpen={setIsOpen}
      />
    </>
  );
}
```

El wrapper retorna `null`; solo se ejecutan sus hooks y registran metadata.

## Configuración por org / entorno

El Provider depende de valores resueltos por entorno:

| Asunto | Dónde |
|---|---|
| URL del backend | `import.meta.env.VITE_APP_BACKEND_URL` (consumido por `ConversationExecutionService`). |
| LLM provider | Resuelto en runtime via `LLMProviderService`. La UI del chat expone el picker. |
| Logs verbose de debug | `import.meta.env.VITE_COMMAND_CENTER_DEBUG === 'true'` activa `console.log` por paso ejecutado. |
| Persistencia de conversaciones | Mongo del backend vía `conversationManagementService`. |

## Errores comunes

- **Montar el Provider dos veces** en el árbol — el registry se reinicia, las surfaces pierden sus handlers entre renders.
- **Montar el Sidebar sin el Provider** — el `useCommandCenterContext()` del Sidebar lanza error.
- **Falta `executionService`** — `classifyIntent` falla con "No Execution Service provided to Agent."
- **Sin `llm_provider_id`** — `classifyIntent` falla con "No LLM Provider ID provided for inference." La UI debe seleccionar provider antes de enviar.
- **Olvidar `page-context`** — muchas acciones read hacen fallback a "la primera InsightSource registrada si `page-context` no está publicada". Para comportamiento predecible, publica siempre una fuente con ese ID por página.

## Referencias cruzadas

- [architecture.es.md](architecture.es.md)
- [sommatic-jsx-authoring.es.md](sommatic-jsx-authoring.es.md)
- [agent-and-inference.es.md](agent-and-inference.es.md)
