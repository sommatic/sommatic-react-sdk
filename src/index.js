// src/index.js

export { services } from './services/index';
export {
  BaseApi,
  fetchEntityCollection,
  fetchMultipleEntities,
  updateEntityRecord,
  createEntityRecord,
  deleteEntityRecord,
  TemplateService,
  ConversationManagementService,
  ConversationExecutionService,
  ConversationRecordService,
  FgnClassificatorService,
  CognitiveInfrastructureAgentProfileService,
  CognitiveInfrastructureCognitiveToolService,
  CognitiveInfrastructureLLMProviderService,
  CognitiveInfrastructureLLMInvocationService,
  CognitiveInfrastructurePromptTemplateService,
  CognitiveInfrastructureKnowledgeResourceService,
  CognitiveInfrastructureKnowledgeResourceBindingService,
  CognitiveInfrastructureDatasourceService,
  CognitiveInfrastructureMemoryStoreService,
  NotificationManagementService,
  CommunicationUploadService,
  MessagingEnvelopeService,
  DeviceManagementService,
  IdentityOrganizationManagementService,
  IdentityUserManagementService,
  ProjectManagementService,
  WorkManagementTaskService,
  WorkflowOrchestrationFlowVersionService,
  WorkflowOrchestrationFlowDefinitionService,
  WorkflowOrchestrationFlowPolicyService,
  WorkflowOrchestrationConnectorService,
  WorkflowOrchestrationEndpointTemplateService,
  WorkflowOrchestrationCredentialService,
  WorkflowOrchestrationDataSourceService,
  WorkflowOrchestrationMemoryStoreService,
  WorkflowOrchestrationOperatorService,
  WorkflowOrchestrationOperatorEntitlementService,
  WorkflowOrchestrationTriggerService,
  WorkflowOrchestrationTimerService,
  WorkflowOrchestrationExecutionService,
  WorkflowOrchestrationFlowInstanceResultService,
  WorkflowOrchestrationNodeExecutionService,
  WorkflowOrchestrationFlowInstanceService,
  WorkflowOrchestrationEnvelopeService,
  WorkflowOrchestrationExtensionPointService,
  WorkflowOrchestrationPluginService,
  WorkflowOrchestrationPlugingRuntimeHostService,
  WorkflowOrchestrationDeploymentService,
  WorkflowOrchestrationGraphService,
  WorkflowOrchestrationNodeDefinitionService,
  WorkflowOrchestrationNodeEdgeService,
  WorkflowOrchestrationIngressBindingService,
  CognitiveInfrastructureLLMProviderService as LlmProviderService,
  WorkflowOrchestrationOperatorService as WorkflowOperatorService,
  WorkflowOrchestrationTriggerService as WorkflowTriggerService,
  WorkflowOrchestrationFlowDefinitionService as WorkflowFlowDefinitionService,
  WorkflowOrchestrationFlowVersionService as WorkflowFlowVersionService,
} from './services/index';

export { useLocalStorage as useLocalStorage } from './hooks/useLocalStorage.hook.js';

import './styles/styles.css';
import './styles/fonts.css';
import './styles/bootstrap-namespaced.css';

/* Chat Components */
export { default as CognitiveEntryManager } from './components/chat/CognitiveEntryManager.component.jsx';
export { default as CognitiveEntry } from './components/chat/CognitiveEntry.component.jsx';
export { default as ChatBubble } from './components/chat/ChatBubble.component.jsx';
export { default as SystemResponse } from './components/chat/SystemResponse.component.jsx';
export { default as ThoughtProcess } from './components/chat/ThoughtProcess.component.jsx';

/* Command Center Components */
export { default as CommandCenterSidebar } from './components/command-center/CommandCenterSidebar.jsx';
export { default as CommandCenterChat } from './components/command-center/CommandCenterChat.jsx';
export { default as CommandCenterTrigger } from './components/command-center/CommandCenterTrigger.jsx';

/* Flows Components */
export { default as FlowsManager } from './components/flows/FlowsManager.component.jsx';
export { default as FlowsToolbar } from './components/flows/toolbar/FlowsToolbar.component.jsx';
export { default as FlowsNodeConfigModal } from './components/flows/flow-node-config/FlowsNodeConfigModal.component.jsx';

/* Command Center Features */
export { useCommandCenterAgent } from './features/command-center/hooks/useCommandCenterAgent.js';
export { CommandCenterProvider } from './features/command-center/context/CommandCenter.context.jsx';
export { useCommandCenter } from './features/command-center/hooks/useCommandCenter.hook.js';
export { useSommaticContextSource } from './features/command-center/hooks/useSommaticContextSource.hook.js';
export { useSommaticSurface } from './features/command-center/hooks/useSommaticSurface.hook.js';
export { useSommaticSelection } from './features/command-center/hooks/useSommaticSelection.hook.js';
export { useSommaticFocus } from './features/command-center/hooks/useSommaticFocus.hook.js';

/* Command Center Commands */
export { getReadCommands, getExecCommands } from './features/command-center/commands/index.js';

/* Task Notification Components */
export { TaskNotificationToast, TaskQuickViewOverlay } from './components/task-notification/index.js';

/* Task Components */
export { default as TaskDetailWorkspace } from './components/tasks/detail/TaskDetailWorkspace.component.jsx';
export { default as TaskDetailHeader } from './components/tasks/detail/TaskDetailHeader.component.jsx';
export { default as TaskOverviewTab } from './components/tasks/detail/tabs/TaskOverviewTab.component.jsx';
export { default as TaskEvidenceTab } from './components/tasks/detail/tabs/TaskEvidenceTab.component.jsx';
export { default as TaskOutputTab } from './components/tasks/detail/tabs/TaskOutputTab.component.jsx';
export { default as TaskActivityTab } from './components/tasks/detail/tabs/TaskActivityTab.component.jsx';
export { default as TaskOutputForm } from './components/tasks/output/TaskOutputForm.component.jsx';
export { default as SchemaFieldBuilder } from './components/tasks/create/SchemaFieldBuilder.component.jsx';
export { default as EvidenceBlockBuilder } from './components/tasks/create/EvidenceBlockBuilder.component.jsx';
export { default as TaskManagerQuickCreate } from './components/tasks/quick-actions/create/TaskManagerQuickCreate.component.jsx';
export { default as TaskManagerEdit } from './components/tasks/edit/TaskManagerEdit.component.jsx';

/* Task Hooks */
export { useTaskSLAMonitor } from './hooks/useTaskSLAMonitor.js';
export { useTaskInbox } from './hooks/useTaskInbox.js';

/* Event Stream */
export { useEventStream } from './hooks/useEventStream.js';

/* Streams */
export { BaseStream, WorkManagementTaskStreamService } from './streams/index.js';

/* Task Sidebar */
export { default as TasksSidebar } from './components/tasks/sidebar/TasksSidebar.component.jsx';

/* Cognitive Resource Components */
export { default as KnowledgeResourceTypeBadge } from './components/cognitive-resource/KnowledgeResourceTypeBadge.component.jsx';
export { default as KnowledgeResourceStatusBadge } from './components/cognitive-resource/KnowledgeResourceStatusBadge.component.jsx';

/* Cognitive Resource Content Editors */
export { default as RichTextResourceEditor } from './components/cognitive-resource/editor/content-editors/RichTextResourceEditor.component.jsx';
export { default as ListResourceEditor } from './components/cognitive-resource/editor/content-editors/ListResourceEditor.component.jsx';
export { default as TaxonomyResourceEditor } from './components/cognitive-resource/editor/content-editors/TaxonomyResourceEditor.component.jsx';
export { default as DocumentResourceEditor } from './components/cognitive-resource/editor/content-editors/DocumentResourceEditor.component.jsx';
export { default as ReferenceResourceEditor } from './components/cognitive-resource/editor/content-editors/ReferenceResourceEditor.component.jsx';
export { default as DatasetResourceEditor } from './components/cognitive-resource/editor/content-editors/DatasetResourceEditor.component.jsx';

/* Cognitive Resource Editor */
export { default as CognitiveResourceEditor } from './components/cognitive-resource/editor/CognitiveResourceEditor.component.jsx';
export { default as CognitiveResourceEditorHeader } from './components/cognitive-resource/editor/CognitiveResourceEditorHeader.component.jsx';
export { default as CognitiveResourceContextPanel } from './components/cognitive-resource/editor/CognitiveResourceContextPanel.component.jsx';
export { default as CognitiveResourcePreviewPanel } from './components/cognitive-resource/editor/CognitiveResourcePreviewPanel.component.jsx';
export { default as CognitiveResourceValidationPanel } from './components/cognitive-resource/editor/CognitiveResourceValidationPanel.component.jsx';

/* Cognitive Resource Editor Tabs */
export { default as CognitiveResourceOverviewTab } from './components/cognitive-resource/editor/tabs/CognitiveResourceOverviewTab.component.jsx';
export { default as CognitiveResourceContentTab } from './components/cognitive-resource/editor/tabs/CognitiveResourceContentTab.component.jsx';
export { default as CognitiveResourceGovernanceTab } from './components/cognitive-resource/editor/tabs/CognitiveResourceGovernanceTab.component.jsx';
export { default as CognitiveResourceUsageTab } from './components/cognitive-resource/editor/tabs/CognitiveResourceUsageTab.component.jsx';
export { default as CognitiveResourceBindingsTab } from './components/cognitive-resource/editor/tabs/CognitiveResourceBindingsTab.component.jsx';

/* Cognitive Resource Quick Create */
export { default as CognitiveResourceQuickCreate } from './components/cognitive-resource/create/CognitiveResourceQuickCreate.component.jsx';

/* Cognitive Resource Detail */
export { default as CognitiveResourceDetail } from './components/cognitive-resource/detail/CognitiveResourceDetail.component.jsx';
export { default as CognitiveResourcePropertiesCard } from './components/cognitive-resource/detail/CognitiveResourcePropertiesCard.component.jsx';
export { default as CognitiveResourceSummaryCard } from './components/cognitive-resource/detail/CognitiveResourceSummaryCard.component.jsx';
export { default as CognitiveResourceContentSnapshotCard } from './components/cognitive-resource/detail/CognitiveResourceContentSnapshotCard.component.jsx';
export { default as CognitiveResourceUsageCard } from './components/cognitive-resource/detail/CognitiveResourceUsageCard.component.jsx';
export { default as CognitiveResourceBindingsCard } from './components/cognitive-resource/detail/CognitiveResourceBindingsCard.component.jsx';
