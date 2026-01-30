// src/index.js

export { useLocalStorage as useLocalStorage } from './hooks/useLocalStorage.hook.js';

import './styles/styles.css';
import './styles/fonts.css';
import './styles/bootstrap-namespaced.css';

/* Chat Components */
export { default as CognitiveEntryManager } from './components/chat/CognitiveEntryManager.component.jsx';
export { default as CognitiveEntry } from './components/chat/CognitiveEntry.component.jsx';
export { default as ChatBubble } from './components/chat/ChatBubble.component.jsx';
export { default as SystemResponse } from './components/chat/SystemResponse.component.jsx';

/* Command Center Components */
export { default as CommandSidebar } from './components/command-center/CommandSidebar.jsx';
export { default as CommandChat } from './components/command-center/CommandChat.jsx';
export { default as CommandCenterTrigger } from './components/command-center/CommandCenterTrigger.jsx';

/* Flows Components */
export { default as FlowsManager } from './components/flows/FlowsManager.component.jsx';
export { default as FlowsToolbar } from './components/flows/toolbar/FlowsToolbar.component.jsx';
export { default as FlowsNodeConfigModal } from './components/flows/flow-node-config/FlowsNodeConfigModal.component.jsx';
