/* Base */
import BaseApi from './base/api.service';

/* Utils */
import {
  fetchEntityCollection,
  fetchMultipleEntities,
  updateEntityRecord,
  createEntityRecord,
  deleteEntityRecord,
} from './utils/entityServiceAdapter';

/* _template */
import TemplateService from './_template/_template.service';

/* Chat */
import ConversationManagementService from './chat/conversation-management/conversation-management.service';
import ConversationExecutionService from './chat/conversation-execution/conversation-execution.service';
import ConversationRecordService from './chat/conversation-record/conversation-record.service';

/* Fgn */
import FgnClassificatorService from './fgn-classificator/fgn-classificator.service';

/* Cognitive Infrastructure */
import CognitiveInfrastructureAgentProfileService from './cognitive-infrastructure/cognitive-assets/agent-profile/agent-profile.service';
import CognitiveInfrastructureCognitiveToolService from './cognitive-infrastructure/cognitive-assets/cognitive-tool/cognitive-tool.service';
import CognitiveInfrastructureLLMProviderService from './cognitive-infrastructure/cognitive-assets/llm-provider/llm-provider.service';
import CognitiveInfrastructureLLMInvocationService from './cognitive-infrastructure/cognitive-assets/llm-invocation/llm-invocation.service';
import CognitiveInfrastructurePromptTemplateService from './cognitive-infrastructure/cognitive-assets/prompt-template/prompt-template.service';
import CognitiveInfrastructureKnowledgeResourceService from './cognitive-infrastructure/cognitive-assets/knowledge-resource/knowledge-resource.service';
import CognitiveInfrastructureKnowledgeResourceBindingService from './cognitive-infrastructure/cognitive-assets/knowledge-resource-binding/knowledge-resource-binding.service';
import CognitiveInfrastructureDatasourceService from './cognitive-infrastructure/connectors/external-datasource/external-datasource.service';
import CognitiveInfrastructureMemoryStoreService from './cognitive-infrastructure/connectors/memory-store/memory-store.service';

/* Communication */
import NotificationManagementService from './communication/notification/notification-management/notification-management.service';
import CommunicationUploadService from './communication/upload/upload.service';

/* Messaging */
import MessagingEnvelopeService from './messaging/envelope/envelope.service';

/* Identity */
import DeviceManagementService from './identity/device/device-management/device-management.service';
import IdentityOrganizationManagementService from './identity/organization/organization-management.service';
import IdentityUserManagementService from './identity/user/user-management.service';

/* Project */
import ProjectManagementService from './project/project-management.service';

/* Work Management */
import WorkManagementTaskService from './work-management/task/task.service';

/* Workflow Orchestration — Control Plane */
import WorkflowOrchestrationFlowVersionService from './workflow-orchestration/control-plane/flow-compilation/flow-version/flow-version.service';
import WorkflowOrchestrationFlowDefinitionService from './workflow-orchestration/control-plane/flow-design/flow-definition/flow-definition.service';
import WorkflowOrchestrationFlowPolicyService from './workflow-orchestration/control-plane/flow-design/flow-policy/flow-policy.service';
import WorkflowOrchestrationConnectorService from './workflow-orchestration/control-plane/integration-registry/connector/connector.service';
import WorkflowOrchestrationEndpointTemplateService from './workflow-orchestration/control-plane/integration-registry/connector/sub-entities/endpoint-template/endpoint-template.service';
/* Platform Infrastructure */
import PlatformInfrastructureCredentialService from './platform-infrastructure/credential/credential.service';
import WorkflowOrchestrationDataSourceService from './workflow-orchestration/control-plane/integration-registry/data-source/data-source.service';
import WorkflowOrchestrationMemoryStoreService from './workflow-orchestration/control-plane/integration-registry/memory-store/memory-store.service';
import WorkflowOrchestrationOperatorService from './workflow-orchestration/control-plane/operator-registry/operator/operator.service';
import WorkflowOrchestrationOperatorEntitlementService from './workflow-orchestration/control-plane/operator-registry/operator-entitlement/operator-entitlement.service';
import WorkflowOrchestrationTriggerService from './workflow-orchestration/control-plane/trigger-configuration/trigger/trigger.service';

/* Workflow Orchestration — Data Plane */
import WorkflowOrchestrationTimerService from './workflow-orchestration/data-plane/durable-scheduling/timer/timer.service';
import WorkflowOrchestrationExecutionService from './workflow-orchestration/data-plane/execution-engine/execution/execution.service';
import WorkflowOrchestrationFlowInstanceResultService from './workflow-orchestration/data-plane/execution-engine/flow-instance-result/flow-instance-result.service';
import WorkflowOrchestrationNodeExecutionService from './workflow-orchestration/data-plane/execution-engine/node-execution/node-execution.service';
import WorkflowOrchestrationFlowInstanceService from './workflow-orchestration/data-plane/instance-runtime/flow-instance/flow-instance.service';
import WorkflowOrchestrationEnvelopeService from './workflow-orchestration/data-plane/messaging-core/envelope/envelope.service';

/* Workflow Orchestration — Extensions */
import WorkflowOrchestrationExtensionPointService from './workflow-orchestration/extensions/extension-point/extension-point.service';
import WorkflowOrchestrationPluginService from './workflow-orchestration/extensions/plugin/plugin.service';
import WorkflowOrchestrationPlugingRuntimeHostService from './workflow-orchestration/extensions/pluging-runtime-host/pluging-runtime-host.service';

/* Workflow Orchestration — Lifecycle */
import WorkflowOrchestrationDeploymentService from './workflow-orchestration/lifecycle/deployment/deployment.service';

/* Workflow Orchestration — Sub-entities */
import WorkflowOrchestrationGraphService from './workflow-orchestration/sub-entities/graph/graph.service';
import WorkflowOrchestrationNodeDefinitionService from './workflow-orchestration/sub-entities/node-definition/node-definition.service';
import WorkflowOrchestrationNodeEdgeService from './workflow-orchestration/sub-entities/node-edge/node-edge.service';

/* Workflow Orchestration — Triggers */
import WorkflowOrchestrationIngressBindingService from './workflow-orchestration/triggers/ingress-binding/ingress-binding.service';

export const services = {
  /* Base */
  BaseApi,

  /* Utils */
  fetchEntityCollection,
  fetchMultipleEntities,
  updateEntityRecord,
  createEntityRecord,
  deleteEntityRecord,

  /* _template */
  TemplateService,

  /* Chat */
  ConversationManagementService,
  ConversationExecutionService,
  ConversationRecordService,

  /* Fgn */
  FgnClassificatorService,

  /* Cognitive Infrastructure */
  CognitiveInfrastructureAgentProfileService,
  CognitiveInfrastructureCognitiveToolService,
  CognitiveInfrastructureLLMProviderService,
  CognitiveInfrastructureLLMInvocationService,
  CognitiveInfrastructurePromptTemplateService,
  CognitiveInfrastructureKnowledgeResourceService,
  CognitiveInfrastructureKnowledgeResourceBindingService,
  CognitiveInfrastructureDatasourceService,
  CognitiveInfrastructureMemoryStoreService,

  /* Communication */
  NotificationManagementService,
  CommunicationUploadService,

  /* Messaging */
  MessagingEnvelopeService,

  /* Identity */
  DeviceManagementService,
  IdentityOrganizationManagementService,
  IdentityUserManagementService,

  /* Project */
  ProjectManagementService,

  /* Work Management */
  WorkManagementTaskService,

  /* Workflow Orchestration — Control Plane */
  WorkflowOrchestrationFlowVersionService,
  WorkflowOrchestrationFlowDefinitionService,
  WorkflowOrchestrationFlowPolicyService,
  WorkflowOrchestrationConnectorService,
  WorkflowOrchestrationEndpointTemplateService,
  PlatformInfrastructureCredentialService,
  WorkflowOrchestrationDataSourceService,
  WorkflowOrchestrationMemoryStoreService,
  WorkflowOrchestrationOperatorService,
  WorkflowOrchestrationOperatorEntitlementService,
  WorkflowOrchestrationTriggerService,

  /* Workflow Orchestration — Data Plane */
  WorkflowOrchestrationTimerService,
  WorkflowOrchestrationExecutionService,
  WorkflowOrchestrationFlowInstanceResultService,
  WorkflowOrchestrationNodeExecutionService,
  WorkflowOrchestrationFlowInstanceService,
  WorkflowOrchestrationEnvelopeService,

  /* Workflow Orchestration — Extensions */
  WorkflowOrchestrationExtensionPointService,
  WorkflowOrchestrationPluginService,
  WorkflowOrchestrationPlugingRuntimeHostService,

  /* Workflow Orchestration — Lifecycle */
  WorkflowOrchestrationDeploymentService,

  /* Workflow Orchestration — Sub-entities */
  WorkflowOrchestrationGraphService,
  WorkflowOrchestrationNodeDefinitionService,
  WorkflowOrchestrationNodeEdgeService,

  /* Workflow Orchestration — Triggers */
  WorkflowOrchestrationIngressBindingService,

  /* Legacy Aliases for SDK Compatibility */
  LlmProviderService: CognitiveInfrastructureLLMProviderService,
  WorkflowOperatorService: WorkflowOrchestrationOperatorService,
  WorkflowTriggerService: WorkflowOrchestrationTriggerService,
  WorkflowFlowDefinitionService: WorkflowOrchestrationFlowDefinitionService,
  WorkflowFlowVersionService: WorkflowOrchestrationFlowVersionService,
};

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
  PlatformInfrastructureCredentialService,
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
};
