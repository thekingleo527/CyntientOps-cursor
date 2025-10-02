/**
 * NovaTypes.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA TYPES - Complete Type System for Nova AI
 * ✅ COMPLETE: All Nova types in one place
 * ✅ SIMPLIFIED: Uses CoreTypes for all shared concepts
 * ✅ NO DUPLICATES: Only Nova-specific types defined here
 * ✅ CLEAN: No type conversion needed
 * ✅ ENHANCED: Includes data aggregation and prompt types
 * ✅ FIXED: NovaContext data field for proper dictionary storage
 * 
 * Based on SwiftUI NovaTypes.swift (586+ lines)
 */

import { CoreTypes } from '@cyntientops/domain-schema';

// MARK: - Nova-Specific Types

/**
 * Nova context for AI operations
 */
export interface NovaContext {
  id: string;
  data: Record<string, string>; // Changed from string to dictionary for structured data
  timestamp: Date;
  insights: string[];
  metadata: Record<string, string>;
  userRole?: CoreTypes.UserRole;
  buildingContext?: string; // BuildingID
  taskContext?: string;
}

/**
 * Nova prompt structure
 */
export interface NovaPrompt {
  id: string;
  text: string;
  priority: CoreTypes.AIPriority;
  context?: NovaContext;
  createdAt: Date;
  expiresAt?: Date;
  metadata: Record<string, string>;
}

/**
 * Nova response structure
 */
export interface NovaResponse {
  id: string;
  success: boolean;
  message: string;
  insights: CoreTypes.IntelligenceInsight[];
  actions: NovaAction[];
  confidence: number;
  timestamp: Date;
  processingTime?: number;
  context?: NovaContext;
  metadata: Record<string, string>;
}

/**
 * Nova-specific action
 */
export interface NovaAction {
  id: string;
  title: string;
  description: string;
  actionType: NovaActionType;
  priority?: CoreTypes.AIPriority;
  parameters: Record<string, string>;
  estimatedDuration?: number;
}

/**
 * Nova action types
 */
export enum NovaActionType {
  NAVIGATE = 'navigate',
  SCHEDULE = 'schedule',
  ASSIGN = 'assign',
  NOTIFY = 'notify',
  ANALYSIS = 'analysis',
  REPORT = 'report',
  REVIEW = 'review',
  COMPLETE = 'complete',
}

/**
 * Nova processing state
 */
export enum NovaProcessingState {
  IDLE = 'idle',
  PROCESSING = 'processing',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// MARK: - Scenario Support Types

/**
 * Nova scenario data for AI-driven scenarios
 */
export interface NovaScenarioData {
  id: string;
  scenario: CoreTypes.AIScenarioType;
  message: string;
  actionText: string;
  createdAt: Date;
  priority: CoreTypes.AIPriority;
  context: Record<string, string>;
}

/**
 * Emergency repair state for tracking repair progress
 */
export interface NovaEmergencyRepairState {
  isActive: boolean;
  progress: number;
  message: string;
  workerId?: string;
}

// MARK: - Data Aggregation Types

/**
 * Comprehensive structure holding aggregated metrics for Nova
 */
export interface NovaAggregatedData {
  id: string;
  buildingCount: number;
  taskCount: number;
  workerCount: number;
  completedTaskCount: number;
  urgentTaskCount: number;
  overdueTaskCount: number;
  averageCompletionRate: number;
  timestamp: Date;
}

// MARK: - Prompt Generation Types

/**
 * Template for custom prompts
 */
export interface PromptTemplate {
  name: string;
  baseText: string;
  requiredParameters: string[];
}

/**
 * Focus areas for prompt generation
 */
export enum PromptFocus {
  OPERATIONS = 'operations',
  WORKFORCE = 'workforce',
  MAINTENANCE = 'maintenance',
  COMPLIANCE = 'compliance',
  FINANCIAL = 'financial',
}

/**
 * Nova context type for categorization
 */
export enum NovaContextType {
  PORTFOLIO = 'portfolio',
  BUILDING = 'building',
  WORKER = 'worker',
  TASK = 'task',
}

// MARK: - Error Types

export enum NovaError {
  INVALID_CONTEXT = 'invalid_context',
  PROMPT_TOO_LONG = 'prompt_too_long',
  RESPONSE_TIMEOUT = 'response_timeout',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  PROCESSING_FAILED = 'processing_failed',
  DATA_AGGREGATION_FAILED = 'data_aggregation_failed',
  PROMPT_GENERATION_FAILED = 'prompt_generation_failed',
}

// MARK: - Nova State Management

/**
 * Nova State Enum (Enhanced)
 */
export enum NovaState {
  IDLE = 'idle',
  THINKING = 'thinking',
  ACTIVE = 'active',
  URGENT = 'urgent',
  ERROR = 'error',
}

/**
 * Workspace Mode for holographic interface
 */
export enum WorkspaceMode {
  CHAT = 'chat',
  MAP = 'map',
  PORTFOLIO = 'portfolio',
  HOLOGRAPHIC = 'holographic',
  VOICE = 'voice',
}

/**
 * Particle Animation Support
 */
export interface Particle {
  id: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

/**
 * Advanced Particle System
 */
export interface AdvancedParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
}

// MARK: - Chat and Interaction Types

/**
 * Nova Chat Message
 */
export interface NovaChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  priority?: CoreTypes.AIPriority;
  actions: NovaAction[];
  insights: CoreTypes.IntelligenceInsight[];
  metadata: Record<string, string>;
}

/**
 * Swipe Direction for gestures
 */
export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Nova Tab for interface
 */
export enum NovaTab {
  CHAT = 'chat',
}

// MARK: - Type Aliases for Clarity

export type NovaInsight = CoreTypes.IntelligenceInsight;
export type NovaSuggestion = CoreTypes.AISuggestion;
export type NovaPriority = CoreTypes.AIPriority;
export type NovaInsightType = CoreTypes.InsightCategory;
export type NovaScenarioType = CoreTypes.AIScenarioType;

// MARK: - Predefined Templates

export const PROMPT_TEMPLATES = {
  DAILY_BRIEFING: {
    name: 'Daily Briefing',
    baseText: 'Daily briefing for {date}: {taskCount} tasks across {buildingCount} buildings with {workerCount} active workers.',
    requiredParameters: ['date', 'taskCount', 'buildingCount', 'workerCount'],
  },
  WORKER_ASSIGNMENT: {
    name: 'Worker Assignment',
    baseText: 'Assign {workerName} to {buildingName} for {taskType} tasks. Duration: {hours} hours.',
    requiredParameters: ['workerName', 'buildingName', 'taskType', 'hours'],
  },
  MAINTENANCE_ALERT: {
    name: 'Maintenance Alert',
    baseText: 'Maintenance required at {buildingName}: {issueType}. Priority: {priority}. Estimated time: {duration}.',
    requiredParameters: ['buildingName', 'issueType', 'priority', 'duration'],
  },
  COMPLIANCE_UPDATE: {
    name: 'Compliance Update',
    baseText: 'Compliance status for {buildingName}: {status}. Issues: {issueCount}. Next audit: {auditDate}.',
    requiredParameters: ['buildingName', 'status', 'issueCount', 'auditDate'],
  },
  EMERGENCY_RESPONSE: {
    name: 'Emergency Response',
    baseText: 'EMERGENCY at {buildingName}: {emergencyType}. Severity: {severity}. Response team: {responders}.',
    requiredParameters: ['buildingName', 'emergencyType', 'severity', 'responders'],
  },
} as const;

// MARK: - Utility Functions

/**
 * Generate prompt from template with parameters
 */
export function generatePromptFromTemplate(
  template: PromptTemplate,
  parameters: Record<string, string>
): string {
  let prompt = template.baseText;
  for (const [key, value] of Object.entries(parameters)) {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return prompt;
}

/**
 * Check if context is expired (older than 5 minutes)
 */
export function isContextExpired(context: NovaContext): boolean {
  return Date.now() - context.timestamp.getTime() > 300000; // 5 minutes
}

/**
 * Check if prompt has expired
 */
export function isPromptExpired(prompt: NovaPrompt): boolean {
  if (!prompt.expiresAt) return false;
  return Date.now() > prompt.expiresAt.getTime();
}

/**
 * Check if prompt is high priority
 */
export function isPromptHighPriority(prompt: NovaPrompt): boolean {
  return prompt.priority === CoreTypes.AIPriority.HIGH || 
         prompt.priority === CoreTypes.AIPriority.CRITICAL;
}

/**
 * Check if response has critical insights
 */
export function hasCriticalInsights(response: NovaResponse): boolean {
  return response.insights.some(insight => insight.priority === CoreTypes.AIPriority.CRITICAL);
}

/**
 * Get insights by priority
 */
export function getInsightsByPriority(
  response: NovaResponse,
  priority: CoreTypes.AIPriority
): CoreTypes.IntelligenceInsight[] {
  return response.insights.filter(insight => insight.priority === priority);
}

/**
 * Check if aggregated data is expired (older than 5 minutes)
 */
export function isAggregatedDataExpired(data: NovaAggregatedData): boolean {
  return Date.now() - data.timestamp.getTime() > 300000; // 5 minutes
}

/**
 * Calculate task completion percentage
 */
export function calculateCompletionPercentage(data: NovaAggregatedData): number {
  return data.taskCount > 0 ? (data.completedTaskCount / data.taskCount) * 100 : 0;
}

/**
 * Check if there are critical issues
 */
export function hasCriticalIssues(data: NovaAggregatedData): boolean {
  return data.urgentTaskCount > 0 || data.overdueTaskCount > 0;
}

// MARK: - Icon and Display Helpers

/**
 * Get icon for Nova action type
 */
export function getNovaActionTypeIcon(actionType: NovaActionType): string {
  switch (actionType) {
    case NovaActionType.NAVIGATE: return 'location.fill';
    case NovaActionType.SCHEDULE: return 'calendar';
    case NovaActionType.ASSIGN: return 'person.badge.plus';
    case NovaActionType.NOTIFY: return 'bell.fill';
    case NovaActionType.ANALYSIS: return 'chart.line.uptrend.xyaxis';
    case NovaActionType.REPORT: return 'doc.text.fill';
    case NovaActionType.REVIEW: return 'magnifyingglass';
    case NovaActionType.COMPLETE: return 'checkmark.circle';
    default: return 'questionmark.circle';
  }
}

/**
 * Get icon for Nova context type
 */
export function getNovaContextTypeIcon(contextType: NovaContextType): string {
  switch (contextType) {
    case NovaContextType.PORTFOLIO: return 'building.2.crop.circle';
    case NovaContextType.BUILDING: return 'building.2';
    case NovaContextType.WORKER: return 'person.fill';
    case NovaContextType.TASK: return 'checklist';
    default: return 'questionmark.circle';
  }
}

/**
 * Get display name for workspace mode
 */
export function getWorkspaceModeDisplayName(mode: WorkspaceMode): string {
  switch (mode) {
    case WorkspaceMode.CHAT: return 'Chat';
    case WorkspaceMode.MAP: return 'Map';
    case WorkspaceMode.PORTFOLIO: return 'Portfolio';
    case WorkspaceMode.HOLOGRAPHIC: return 'Holographic';
    case WorkspaceMode.VOICE: return 'Voice';
    default: return 'Unknown';
  }
}

/**
 * Get icon for workspace mode
 */
export function getWorkspaceModeIcon(mode: WorkspaceMode): string {
  switch (mode) {
    case WorkspaceMode.CHAT: return 'message.circle';
    case WorkspaceMode.MAP: return 'map.circle';
    case WorkspaceMode.PORTFOLIO: return 'building.2.crop.circle';
    case WorkspaceMode.HOLOGRAPHIC: return 'cube.transparent';
    case WorkspaceMode.VOICE: return 'waveform.circle';
    default: return 'questionmark.circle';
  }
}

/**
 * Get display name for prompt focus
 */
export function getPromptFocusDisplayName(focus: PromptFocus): string {
  return focus.charAt(0).toUpperCase() + focus.slice(1);
}

// MARK: - Error Message Helpers

/**
 * Get error description for Nova error
 */
export function getNovaErrorDescription(error: NovaError, details?: string): string {
  switch (error) {
    case NovaError.INVALID_CONTEXT:
      return 'Invalid context provided to Nova';
    case NovaError.PROMPT_TOO_LONG:
      return `Prompt too long: ${details || 'unknown length'} characters`;
    case NovaError.RESPONSE_TIMEOUT:
      return 'Nova response timed out';
    case NovaError.RATE_LIMIT_EXCEEDED:
      return 'Nova rate limit exceeded';
    case NovaError.SERVICE_UNAVAILABLE:
      return 'Nova service temporarily unavailable';
    case NovaError.PROCESSING_FAILED:
      return `Nova processing failed: ${details || 'unknown error'}`;
    case NovaError.DATA_AGGREGATION_FAILED:
      return `Data aggregation failed: ${details || 'unknown error'}`;
    case NovaError.PROMPT_GENERATION_FAILED:
      return `Prompt generation failed: ${details || 'unknown error'}`;
    default:
      return 'Unknown Nova error';
  }
}

// MARK: - Context Builder Helpers

/**
 * Create Nova context with data
 */
export function createNovaContext(
  data: Record<string, string>,
  insights: string[] = [],
  metadata: Record<string, string> = {},
  userRole?: CoreTypes.UserRole,
  buildingContext?: string,
  taskContext?: string
): NovaContext {
  return {
    id: `nova_context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    data,
    timestamp: new Date(),
    insights,
    metadata,
    userRole,
    buildingContext,
    taskContext,
  };
}

/**
 * Add insight to Nova context
 */
export function addInsightToContext(context: NovaContext, insight: string): NovaContext {
  return {
    ...context,
    insights: [...context.insights, insight],
  };
}

/**
 * Add metadata to Nova context
 */
export function addMetadataToContext(
  context: NovaContext,
  key: string,
  value: string
): NovaContext {
  return {
    ...context,
    metadata: {
      ...context.metadata,
      [key]: value,
    },
  };
}

/**
 * Add or update context data
 */
export function updateContextData(
  context: NovaContext,
  key: string,
  value: string
): NovaContext {
  return {
    ...context,
    data: {
      ...context.data,
      [key]: value,
    },
  };
}

/**
 * Get context data as a single string (for backward compatibility)
 */
export function getContextDataString(context: NovaContext): string {
  return context.data.content || 
         Object.entries(context.data)
           .map(([key, value]) => `${key}: ${value}`)
           .join(', ');
}

// MARK: - Default Values

export const DEFAULT_NOVA_CONTEXT: NovaContext = {
  id: '',
  data: {},
  timestamp: new Date(),
  insights: [],
  metadata: {},
};

export const DEFAULT_NOVA_PROMPT: NovaPrompt = {
  id: '',
  text: '',
  priority: CoreTypes.AIPriority.MEDIUM,
  createdAt: new Date(),
  metadata: {},
};

export const DEFAULT_NOVA_RESPONSE: NovaResponse = {
  id: '',
  success: false,
  message: '',
  insights: [],
  actions: [],
  confidence: 0,
  timestamp: new Date(),
  metadata: {},
};

export const DEFAULT_NOVA_ACTION: NovaAction = {
  id: '',
  title: '',
  description: '',
  actionType: NovaActionType.REVIEW,
  parameters: {},
};

export const DEFAULT_NOVA_AGGREGATED_DATA: NovaAggregatedData = {
  id: '',
  buildingCount: 0,
  taskCount: 0,
  workerCount: 0,
  completedTaskCount: 0,
  urgentTaskCount: 0,
  overdueTaskCount: 0,
  averageCompletionRate: 0,
  timestamp: new Date(),
};

export const DEFAULT_NOVA_EMERGENCY_REPAIR_STATE: NovaEmergencyRepairState = {
  isActive: false,
  progress: 0,
  message: '',
};

// MARK: - Constants

export const NOVA_CONSTANTS = {
  PROCESSING_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  CONTEXT_EXPIRY_TIME: 300000, // 5 minutes
  AGGREGATED_DATA_EXPIRY_TIME: 300000, // 5 minutes
  BUILDING_COUNT: 18,
  WORKER_COUNT: 8,
  TASK_COUNT: 150,
} as const;

// All types and functions are exported individually above
