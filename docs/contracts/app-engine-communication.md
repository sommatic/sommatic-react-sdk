# App Engine Communication Contract

## Overview

This document defines the formal communication contract between the App Engine runtime (microfrontend apps) and the Sommatic host webapp. Communication flows through **props** (the `sdk` object), not DOM events.

## SDK Object Interface

The `sdk` object is constructed by `AppRuntimeHost` and passed as the sole prop to every app's default export.

```javascript
sdk = {
  // --- Session context ---
  session: {
    id: string,                     // Unique session ID (from backend)
    appSlug: string,                // e.g. 'liquidaciones-ai'
    launchMode: string,             // 'fullscreen' | 'command-center' | 'modal' | 'launcher'
    routePath: string,              // Initial internal route
  },

  // --- Input (OneTime binding) ---
  input: {
    // App-specific parameters from the launcher/caller
    mode: string,                   // e.g. 'create' | 'view'
    api_base_url: string,           // Backend URL
    // Framework fields
    _loom_launch_mode: string,      // Fallback for launchMode
    _loom_route_path: string,       // Fallback for routePath
    _restored_view_state: object,   // State from previous instance (escalation chain)
    _parent_session_id: string,     // Session ID of the parent instance
  },

  // --- Context ---
  context: {
    session: object,                // Full session record
    task: object,                   // Task data (for HITL apps)
    appDefinition: {
      manifest: {
        allowed_dependencies: [],
      },
    },
    version: object,
  },

  // --- Callbacks (framework-managed) ---
  onRouteChange(pathname),          // Notify host of internal navigation
  close(),                          // Close/dismiss app

  // --- State management ---
  registerStateProvider(fn),        // fn: () => { currentRoute, ...appState }
  saveViewState(state),             // Persist view_state to backend (TwoWay)

  // --- Mode transitions (Command bindings) ---
  requestEscalation(targetMode),    // Request transition to 'modal' or 'fullscreen'
  requestDeEscalation(),            // Request return to previous mode (e.g. back to CC)

  // --- Output ---
  saveDraft(payload),               // Save draft (OneWayToSource)
  cancel(),                         // Cancel session
}
```

## State Provider Contract

Apps register a state provider via `sdk.registerStateProvider(fn)`. The function must return an object with at minimum:

```javascript
{
  currentRoute: '/current-path',    // REQUIRED: current internal route
  // ... app-specific state
}
```

This function is called synchronously during escalation to capture the current state. It must be **fast and side-effect free**.

## requestEscalation Contract

When an app calls `sdk.requestEscalation(targetMode)`:

1. The registered state provider is invoked to capture current state
2. `view_state` is persisted to the backend session (fire-and-forget)
3. The `onRequestEscalation` callback is invoked with:
   ```javascript
   {
     sessionId: string,      // Current session ID
     targetMode: string,     // 'modal' or 'fullscreen'
     viewState: object,      // Captured state from state provider
     routePath: string,      // Current route
   }
   ```
4. The host component handles the mode transition

## requestDeEscalation Contract

When an app calls `sdk.requestDeEscalation()`:

1. State is captured and persisted (same as escalation)
2. The `onRequestDeEscalation` callback is invoked with:
   ```javascript
   {
     sessionId: string,
     viewState: object,
     routePath: string,
   }
   ```
3. The host creates a new embed record in the Command Center with the captured state

## Record Statuses in CognitiveEntryManager

| Status | Visual | Interactive |
|--------|--------|------------|
| `active` | Live app rendered via `renderAppEmbed` | Yes |
| `escalated` | `AppEscalatedCard` with collapsed JSON | No (disabled) |
| `completed` | `AppOutputCard` with "App opened" label | No |

## DOM Events (Host-to-Host only)

These events are used **only** for coordination between host components, NOT for app state transfer:

| Event | Source | Target | Purpose |
|-------|--------|--------|---------|
| `sommatic:app:embed-escalated` | LayoutBusiness | CognitiveEntryManager | Mark CC record as escalated |
| `sommatic:app:create-embed-from-escalation` | LayoutBusiness | CognitiveEntryManager | Create new active embed from de-escalation |
| `sommatic:app:fullscreen-return-to-chat` | AppEngineRuntime | LayoutBusiness | Fullscreen requests return to CC |
| `sommatic:app:output` | AppEngineRuntime / Modal | CognitiveEntryManager | App submitted output |
| `sommatic:open-command-center` | Any | CommandCenterSidebar | Open CC sidebar with optional app |

## useAppStateSync Hook (for Apps)

Generic hook exported from `@sommatic/react-sdk`. Implements the state sync contract for ALL App Engine apps.

### Signature

```javascript
import { useAppStateSync } from '@sommatic/react-sdk';

useAppStateSync(sdk, stateObj, deps, options?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sdk` | object | SDK object from AppRuntimeHost |
| `stateObj` | object | Current view state to expose (app-specific shape) |
| `deps` | Array | Dependency array for detecting state changes |
| `options.onRestore` | function | Called once with restored view state. App applies it. |
| `options.debounceMs` | number | Debounce interval for backend persistence (default: 5000) |

### What the hook does

1. **Capture:** Registers a state provider with `sdk.registerStateProvider` (synchronous capture for escalation)
2. **Persist:** Debounced save to backend via `sdk.saveViewState` (default every 5s)
3. **Restore:** Calls `onRestore(viewState)` once on mount when `sdk.input._restored_view_state` exists
4. **Backward compat:** Exposes state via `window.__LOOM_APP_STATE__` for `StateManager`

### Example: Simple view (no form)

```javascript
import { useAppStateSync } from '@sommatic/react-sdk';

function RateHistory({ sdk }) {
  const [activeTab, setActiveTab] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  useAppStateSync(
    sdk,
    { activeTab, page: paginationModel.page, pageSize: paginationModel.pageSize },
    [activeTab, paginationModel.page, paginationModel.pageSize],
    {
      onRestore: (restored) => {
        if (restored.activeTab != null) setActiveTab(restored.activeTab);
        if (restored.page != null || restored.pageSize != null) {
          setPaginationModel({ page: restored.page ?? 0, pageSize: restored.pageSize ?? 10 });
        }
      },
    },
  );
}
```

### Example: Complex form with hook state

```javascript
import { useAppStateSync } from '@sommatic/react-sdk';

function CreateSentence({ sdk }) {
  const { sentenceData, actors, beneficiaries, restoreFormState } = useSentenceForm();
  const [activeStep, setActiveStep] = useState(0);
  const [savedBeneficiaries, setSavedBeneficiaries] = useState(new Set());

  useAppStateSync(
    sdk,
    {
      formData: { sentenceData, actors, beneficiaries, activeStep },
      uiState: { savedBeneficiaryIndices: [...savedBeneficiaries] },
    },
    [sentenceData, actors, beneficiaries, activeStep, savedBeneficiaries],
    {
      onRestore: (restored) => {
        if (restored.formData) {
          restoreFormState(restored.formData);  // Hook-level bulk restore
          if (restored.formData.activeStep != null) setActiveStep(restored.formData.activeStep);
        }
        if (restored.uiState) {
          if (Array.isArray(restored.uiState.savedBeneficiaryIndices)) {
            setSavedBeneficiaries(new Set(restored.uiState.savedBeneficiaryIndices));
          }
        }
      },
    },
  );
}
```

### Serialization notes

- `Set` objects must be spread to Array before passing to `stateObj` (e.g., `[...savedBeneficiaries]`)
- State passes through JSON serialization (HTTP PATCH to backend), so only JSON-safe values are preserved
- `Date` objects should be stored as ISO strings
- Functions and class instances will be lost

## Host Component Responsibilities

### AppEmbedHost (Command Center)
- Passes `onRequestEscalation` and `onRequestDeEscalation` to `AppRuntimeHost`
- On escalation: enriches record with `_restored_view_state` and `_parent_session_id`, calls `onEscalate`

### AppRuntimeModal (Modal)
- Passes `onRequestEscalation` (routes fullscreen requests to `onFullscreen`)
- Passes `onRequestDeEscalation` (routes to `onCloseWithState` for CC return)

### AppEngineRuntimeComponent (Fullscreen)
- Passes `onRequestDeEscalation` (dispatches `fullscreen-return-to-chat`, navigates back)

### LayoutBusiness (Orchestrator)
- Handles `handleAppEscalate`: dispatches `embed-escalated`, opens modal or navigates to fullscreen
- Handles `handleModalCloseWithState`: creates new CC embed via `dispatchCreateEmbed`
- Listens for `fullscreen-return-to-chat`: creates new CC embed
- Manages `escalatedApp` state for modal rendering

## Migration Guide for New Apps

1. Import `useAppStateSync` from `@sommatic/react-sdk` in views with meaningful state
2. Call `useAppStateSync(sdk, stateObj, deps, { onRestore })` — the hook handles capture, persistence, and restoration
3. In `onRestore`, apply the restored state to your local hooks/state
4. For complex forms, add a `restoreFormState(snapshot)` method to your form hook that accepts internal format
5. Use `sdk.requestEscalation(targetMode)` instead of DOM events in header/toolbar
6. Use `sdk.requestDeEscalation()` for "back to chat" actions
7. Serialize non-JSON types before passing to `stateObj` (e.g., `Set` → `Array`)
