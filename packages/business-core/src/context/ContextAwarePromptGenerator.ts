/**
 * 🧠 Context-Aware Prompt Generator
 * Purpose: Intelligent prompt generation based on user role, context, and intent
 * 
 * Features:
 * - Role-specific prompt templates
 * - Context-aware prompt enhancement
 * - Intent recognition and classification
 * - Dynamic prompt personalization
 * - Multi-modal prompt generation
 */

import { EventEmitter } from 'events';

export type UserRole = 'admin' | 'client' | 'worker';
export type PromptType = 'question' | 'command' | 'analysis' | 'report' | 'guidance' | 'action';
export type PromptPriority = 'low' | 'medium' | 'high' | 'critical';
export type PromptCategory = 'portfolio' | 'tasks' | 'compliance' | 'analytics' | 'emergency' | 'communication' | 'performance';

export interface PromptTemplate {
  id: string;
  name: string;
  type: PromptType;
  category: PromptCategory;
  role: UserRole;
  template: string;
  variables: PromptVariable[];
  conditions: PromptCondition[];
  examples: PromptExample[];
  metadata: PromptMetadata;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: PromptValidation;
}

export interface PromptValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
}

export interface PromptCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'exists';
  value: any;
  description: string;
}

export interface PromptExample {
  input: Record<string, any>;
  output: string;
  description: string;
}

export interface PromptMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  usage: number;
  successRate: number;
}

export interface GeneratedPrompt {
  id: string;
  templateId: string;
  type: PromptType;
  category: PromptCategory;
  role: UserRole;
  content: string;
  variables: Record<string, any>;
  priority: PromptPriority;
  confidence: number;
  context: PromptContext;
  metadata: GeneratedPromptMetadata;
  timestamp: Date;
}

export interface PromptContext {
  userId: string;
  sessionId: string;
  currentContext: string;
  previousPrompts: string[];
  userPreferences: UserPreferences;
  systemState: SystemState;
}

export interface UserPreferences {
  language: string;
  verbosity: 'concise' | 'detailed' | 'verbose';
  formality: 'casual' | 'professional' | 'formal';
  technicalLevel: 'beginner' | 'intermediate' | 'advanced';
  communicationStyle: 'direct' | 'supportive' | 'collaborative';
}

export interface SystemState {
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  weather?: string;
  systemLoad: number;
  activeUsers: number;
  emergencyMode: boolean;
}

export interface GeneratedPromptMetadata {
  processingTime: number;
  templateVersion: string;
  enhancementApplied: boolean;
  personalizationApplied: boolean;
  contextFactors: string[];
  qualityScore: number;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: IntentEntity[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: PromptPriority;
  category: PromptCategory;
}

export interface IntentEntity {
  name: string;
  type: 'building' | 'task' | 'person' | 'date' | 'number' | 'location' | 'equipment';
  value: any;
  confidence: number;
}

export interface PromptEnhancement {
  type: 'contextual' | 'personal' | 'temporal' | 'situational';
  description: string;
  applied: boolean;
  impact: number;
}

export interface PromptGeneratorState {
  templates: Map<string, PromptTemplate>;
  generatedPrompts: GeneratedPrompt[];
  usageStats: Map<string, number>;
  isProcessing: boolean;
  lastUpdate: Date;
}

export class ContextAwarePromptGenerator extends EventEmitter {
  private state: PromptGeneratorState;
  private intentClassifier: IntentClassifier;
  private contextAnalyzer: ContextAnalyzer;
  private personalizationEngine: PersonalizationEngine;

  constructor() {
    super();
    this.state = {
      templates: new Map(),
      generatedPrompts: [],
      usageStats: new Map(),
      isProcessing: false,
      lastUpdate: new Date()
    };

    this.intentClassifier = new IntentClassifier();
    this.contextAnalyzer = new ContextAnalyzer();
    this.personalizationEngine = new PersonalizationEngine();

    this.initializeTemplates();
    this.setupEventListeners();
  }

  /**
   * Initialize prompt templates for all roles and categories
   */
  private initializeTemplates(): void {
    // Admin Templates
    this.addTemplate({
      id: 'admin-portfolio-overview',
      name: 'Portfolio Overview',
      type: 'analysis',
      category: 'portfolio',
      role: 'admin',
      template: 'Provide a comprehensive overview of the portfolio performance including key metrics, trends, and recommendations for {{timeframe}}.',
      variables: [
        {
          name: 'timeframe',
          type: 'string',
          required: true,
          defaultValue: 'this month',
          description: 'Time period for analysis',
          validation: {
            enum: ['today', 'this week', 'this month', 'this quarter', 'this year']
          }
        }
      ],
      conditions: [
        {
          field: 'role',
          operator: 'equals',
          value: 'admin',
          description: 'User must be admin role'
        }
      ],
      examples: [
        {
          input: { timeframe: 'this month' },
          output: 'Provide a comprehensive overview of the portfolio performance including key metrics, trends, and recommendations for this month.',
          description: 'Monthly portfolio analysis request'
        }
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: ['portfolio', 'admin', 'analysis'],
        usage: 0,
        successRate: 0.95
      }
    });

    this.addTemplate({
      id: 'admin-worker-performance',
      name: 'Worker Performance Analysis',
      type: 'analysis',
      category: 'performance',
      role: 'admin',
      template: 'Analyze worker performance metrics for {{workerName}} including completion rates, response times, and quality scores. Identify areas for improvement and provide actionable recommendations.',
      variables: [
        {
          name: 'workerName',
          type: 'string',
          required: true,
          description: 'Name of the worker to analyze'
        }
      ],
      conditions: [
        {
          field: 'role',
          operator: 'equals',
          value: 'admin',
          description: 'User must be admin role'
        }
      ],
      examples: [
        {
          input: { workerName: 'Sarah Johnson' },
          output: 'Analyze worker performance metrics for Sarah Johnson including completion rates, response times, and quality scores. Identify areas for improvement and provide actionable recommendations.',
          description: 'Individual worker performance analysis'
        }
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: ['performance', 'admin', 'worker'],
        usage: 0,
        successRate: 0.92
      }
    });

    // Client Templates
    this.addTemplate({
      id: 'client-building-status',
      name: 'Building Status Check',
      type: 'question',
      category: 'portfolio',
      role: 'client',
      template: 'What is the current status of {{buildingName}}? Include compliance score, maintenance status, and any issues that need attention.',
      variables: [
        {
          name: 'buildingName',
          type: 'string',
          required: true,
          description: 'Name of the building to check'
        }
      ],
      conditions: [
        {
          field: 'role',
          operator: 'equals',
          value: 'client',
          description: 'User must be client role'
        }
      ],
      examples: [
        {
          input: { buildingName: 'Building A' },
          output: 'What is the current status of Building A? Include compliance score, maintenance status, and any issues that need attention.',
          description: 'Building status inquiry'
        }
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: ['building', 'client', 'status'],
        usage: 0,
        successRate: 0.88
      }
    });

    this.addTemplate({
      id: 'client-compliance-report',
      name: 'Compliance Report Request',
      type: 'report',
      category: 'compliance',
      role: 'client',
      template: 'Generate a compliance report for {{timeframe}} showing violations, upcoming deadlines, and required actions across all buildings.',
      variables: [
        {
          name: 'timeframe',
          type: 'string',
          required: true,
          defaultValue: 'this month',
          description: 'Time period for compliance report',
          validation: {
            enum: ['this week', 'this month', 'this quarter', 'this year']
          }
        }
      ],
      conditions: [
        {
          field: 'role',
          operator: 'equals',
          value: 'client',
          description: 'User must be client role'
        }
      ],
      examples: [
        {
          input: { timeframe: 'this month' },
          output: 'Generate a compliance report for this month showing violations, upcoming deadlines, and required actions across all buildings.',
          description: 'Monthly compliance report request'
        }
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: ['compliance', 'client', 'report'],
        usage: 0,
        successRate: 0.90
      }
    });

    // Worker Templates
    this.addTemplate({
      id: 'worker-task-guidance',
      name: 'Task Guidance Request',
      type: 'guidance',
      category: 'tasks',
      role: 'worker',
      template: 'Provide step-by-step guidance for completing {{taskType}} at {{buildingName}}. Include safety requirements, required tools, and best practices.',
      variables: [
        {
          name: 'taskType',
          type: 'string',
          required: true,
          description: 'Type of task to get guidance for'
        },
        {
          name: 'buildingName',
          type: 'string',
          required: true,
          description: 'Name of the building where task will be performed'
        }
      ],
      conditions: [
        {
          field: 'role',
          operator: 'equals',
          value: 'worker',
          description: 'User must be worker role'
        }
      ],
      examples: [
        {
          input: { taskType: 'HVAC maintenance', buildingName: 'Building A' },
          output: 'Provide step-by-step guidance for completing HVAC maintenance at Building A. Include safety requirements, required tools, and best practices.',
          description: 'HVAC maintenance guidance request'
        }
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: ['task', 'worker', 'guidance'],
        usage: 0,
        successRate: 0.94
      }
    });

    this.addTemplate({
      id: 'worker-emergency-procedures',
      name: 'Emergency Procedures',
      type: 'guidance',
      category: 'emergency',
      role: 'worker',
      template: 'What are the emergency procedures for {{emergencyType}} at {{buildingName}}? Include immediate actions, contacts, and safety protocols.',
      variables: [
        {
          name: 'emergencyType',
          type: 'string',
          required: true,
          description: 'Type of emergency',
          validation: {
            enum: ['fire', 'flood', 'gas leak', 'power outage', 'security breach', 'medical emergency']
          }
        },
        {
          name: 'buildingName',
          type: 'string',
          required: true,
          description: 'Name of the building'
        }
      ],
      conditions: [
        {
          field: 'role',
          operator: 'equals',
          value: 'worker',
          description: 'User must be worker role'
        }
      ],
      examples: [
        {
          input: { emergencyType: 'fire', buildingName: 'Building A' },
          output: 'What are the emergency procedures for fire at Building A? Include immediate actions, contacts, and safety protocols.',
          description: 'Fire emergency procedures request'
        }
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: ['emergency', 'worker', 'procedures'],
        usage: 0,
        successRate: 0.98
      }
    });
  }

  /**
   * Add a prompt template
   */
  private addTemplate(template: PromptTemplate): void {
    this.state.templates.set(template.id, template);
    this.emit('templateAdded', template);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('promptGenerated', this.handlePromptGenerated.bind(this));
    this.on('templateUsed', this.handleTemplateUsed.bind(this));
  }

  /**
   * Handle prompt generated event
   */
  private handlePromptGenerated(prompt: GeneratedPrompt): void {
    this.state.generatedPrompts.push(prompt);
    this.emit('promptGenerated', prompt);
  }

  /**
   * Handle template used event
   */
  private handleTemplateUsed(templateId: string): void {
    const currentUsage = this.state.usageStats.get(templateId) || 0;
    this.state.usageStats.set(templateId, currentUsage + 1);
    this.emit('templateUsageUpdated', { templateId, usage: currentUsage + 1 });
  }

  /**
   * Generate a context-aware prompt
   */
  public async generatePrompt(
    userInput: string,
    role: UserRole,
    context: PromptContext,
    options: {
      type?: PromptType;
      category?: PromptCategory;
      priority?: PromptPriority;
      enhance?: boolean;
      personalize?: boolean;
    } = {}
  ): Promise<GeneratedPrompt> {
    this.state.isProcessing = true;

    try {
      // Analyze user intent
      const intent = await this.intentClassifier.analyzeIntent(userInput, role);
      
      // Find matching template
      const template = this.findBestTemplate(intent, role, options);
      if (!template) {
        throw new Error('No suitable template found for the given input');
      }

      // Extract variables from user input
      const variables = await this.extractVariables(userInput, template);

      // Generate base prompt
      let content = this.renderTemplate(template, variables);

      // Apply enhancements
      const enhancements: PromptEnhancement[] = [];
      if (options.enhance !== false) {
        content = await this.enhancePrompt(content, context, enhancements);
      }

      // Apply personalization
      if (options.personalize !== false) {
        content = await this.personalizePrompt(content, context, enhancements);
      }

      // Create generated prompt
      const generatedPrompt: GeneratedPrompt = {
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        templateId: template.id,
        type: template.type,
        category: template.category,
        role,
        content,
        variables,
        priority: intent.urgency,
        confidence: intent.confidence,
        context,
        metadata: {
          processingTime: Date.now(),
          templateVersion: template.metadata.version,
          enhancementApplied: enhancements.some(e => e.applied),
          personalizationApplied: enhancements.some(e => e.type === 'personal'),
          contextFactors: this.getContextFactors(context),
          qualityScore: this.calculateQualityScore(content, intent, enhancements)
        },
        timestamp: new Date()
      };

      // Update template usage
      this.handleTemplateUsed(template.id);

      this.state.isProcessing = false;
      this.emit('promptGenerated', generatedPrompt);
      
      return generatedPrompt;

    } catch (error) {
      this.state.isProcessing = false;
      this.emit('promptGenerationError', error);
      throw error;
    }
  }

  /**
   * Find the best template for the given intent and role
   */
  private findBestTemplate(intent: IntentAnalysis, role: UserRole, options: any): PromptTemplate | null {
    const candidates = Array.from(this.state.templates.values())
      .filter(template => template.role === role)
      .filter(template => !options.type || template.type === options.type)
      .filter(template => !options.category || template.category === options.category);

    if (candidates.length === 0) return null;

    // Score templates based on intent match
    const scoredTemplates = candidates.map(template => ({
      template,
      score: this.scoreTemplate(template, intent)
    }));

    // Return highest scoring template
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0].template;
  }

  /**
   * Score a template based on intent match
   */
  private scoreTemplate(template: PromptTemplate, intent: IntentAnalysis): number {
    let score = 0;

    // Category match
    if (template.category === intent.category) {
      score += 50;
    }

    // Tag match
    const templateTags = template.metadata.tags;
    const intentKeywords = intent.intent.toLowerCase().split(' ');
    const matchingTags = templateTags.filter(tag => 
      intentKeywords.some(keyword => tag.includes(keyword))
    );
    score += matchingTags.length * 10;

    // Success rate
    score += template.metadata.successRate * 20;

    // Usage frequency (prefer less used templates for variety)
    const usage = this.state.usageStats.get(template.id) || 0;
    score += Math.max(0, 10 - usage);

    return score;
  }

  /**
   * Extract variables from user input
   */
  private async extractVariables(userInput: string, template: PromptTemplate): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};

    for (const variable of template.variables) {
      const value = await this.extractVariableValue(userInput, variable);
      if (value !== undefined) {
        variables[variable.name] = value;
      } else if (variable.required && variable.defaultValue !== undefined) {
        variables[variable.name] = variable.defaultValue;
      }
    }

    return variables;
  }

  /**
   * Extract a specific variable value from user input
   */
  private async extractVariableValue(userInput: string, variable: PromptVariable): Promise<any> {
    // Simple extraction logic - in real implementation, this would use NLP
    const input = userInput.toLowerCase();
    
    switch (variable.name) {
      case 'timeframe':
        if (input.includes('today')) return 'today';
        if (input.includes('week')) return 'this week';
        if (input.includes('month')) return 'this month';
        if (input.includes('quarter')) return 'this quarter';
        if (input.includes('year')) return 'this year';
        break;
      
      case 'buildingName': {
        // Extract building name using simple pattern matching
        const buildingMatch = input.match(/building\s+([a-z]+)/i);
        if (buildingMatch) return buildingMatch[1];
        break;
      }
      
      case 'workerName': {
        // Extract worker name using simple pattern matching
        const workerMatch = input.match(/(?:worker|employee)\s+([a-z\s]+)/i);
        if (workerMatch) return workerMatch[1].trim();
        break;
      }
      
      case 'taskType':
        // Extract task type
        if (input.includes('hvac')) return 'HVAC maintenance';
        if (input.includes('plumbing')) return 'plumbing repair';
        if (input.includes('electrical')) return 'electrical work';
        if (input.includes('cleaning')) return 'cleaning';
        break;
      
      case 'emergencyType':
        if (input.includes('fire')) return 'fire';
        if (input.includes('flood')) return 'flood';
        if (input.includes('gas')) return 'gas leak';
        if (input.includes('power')) return 'power outage';
        if (input.includes('security')) return 'security breach';
        if (input.includes('medical')) return 'medical emergency';
        break;
    }

    return undefined;
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: PromptTemplate, variables: Record<string, any>): string {
    let content = template.template;

    // Replace variables in template
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = `{{${name}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return content;
  }

  /**
   * Enhance prompt with contextual information
   */
  private async enhancePrompt(content: string, context: PromptContext, enhancements: PromptEnhancement[]): Promise<string> {
    let enhancedContent = content;

    // Add temporal context
    if (context.systemState.timeOfDay === 'morning') {
      enhancedContent = `Good morning! ${enhancedContent}`;
      enhancements.push({
        type: 'temporal',
        description: 'Added morning greeting',
        applied: true,
        impact: 0.1
      });
    }

    // Add urgency context
    if (context.systemState.emergencyMode) {
      enhancedContent = `URGENT: ${enhancedContent}`;
      enhancements.push({
        type: 'situational',
        description: 'Added urgency indicator',
        applied: true,
        impact: 0.2
      });
    }

    return enhancedContent;
  }

  /**
   * Personalize prompt based on user preferences
   */
  private async personalizePrompt(content: string, context: PromptContext, enhancements: PromptEnhancement[]): Promise<string> {
    let personalizedContent = content;

    // Adjust verbosity based on user preference
    if (context.userPreferences.verbosity === 'concise') {
      personalizedContent = this.makeConcise(personalizedContent);
      enhancements.push({
        type: 'personal',
        description: 'Made content more concise',
        applied: true,
        impact: 0.15
      });
    } else if (context.userPreferences.verbosity === 'verbose') {
      personalizedContent = this.addDetail(personalizedContent);
      enhancements.push({
        type: 'personal',
        description: 'Added more detail',
        applied: true,
        impact: 0.15
      });
    }

    // Adjust formality
    if (context.userPreferences.formality === 'casual') {
      personalizedContent = this.makeCasual(personalizedContent);
      enhancements.push({
        type: 'personal',
        description: 'Made tone more casual',
        applied: true,
        impact: 0.1
      });
    }

    return personalizedContent;
  }

  /**
   * Make content more concise
   */
  private makeConcise(content: string): string {
    // Simple implementation - in real system, this would use more sophisticated text processing
    return content.replace(/\s+/g, ' ').trim();
  }

  /**
   * Add more detail to content
   */
  private addDetail(content: string): string {
    // Simple implementation - in real system, this would add relevant details
    return `${content} Please provide comprehensive information with specific examples and actionable recommendations.`;
  }

  /**
   * Make content more casual
   */
  private makeCasual(content: string): string {
    // Simple implementation - in real system, this would adjust tone
    return content.replace(/Please/g, 'Could you').replace(/Thank you/g, 'Thanks');
  }

  /**
   * Get context factors
   */
  private getContextFactors(context: PromptContext): string[] {
    const factors: string[] = [];
    
    if (context.systemState.emergencyMode) factors.push('emergency-mode');
    if (context.systemState.timeOfDay) factors.push(`time-${context.systemState.timeOfDay}`);
    if (context.userPreferences.verbosity) factors.push(`verbosity-${context.userPreferences.verbosity}`);
    if (context.userPreferences.formality) factors.push(`formality-${context.userPreferences.formality}`);
    
    return factors;
  }

  /**
   * Calculate quality score for generated prompt
   */
  private calculateQualityScore(content: string, intent: IntentAnalysis, enhancements: PromptEnhancement[]): number {
    let score = 0.5; // Base score

    // Intent confidence
    score += intent.confidence * 0.3;

    // Content length (not too short, not too long)
    const length = content.length;
    if (length > 50 && length < 500) {
      score += 0.1;
    }

    // Enhancements applied
    score += enhancements.filter(e => e.applied).length * 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): PromptTemplate | undefined {
    return this.state.templates.get(templateId);
  }

  /**
   * Get all templates for a role
   */
  public getTemplatesForRole(role: UserRole): PromptTemplate[] {
    return Array.from(this.state.templates.values())
      .filter(template => template.role === role);
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): Map<string, number> {
    return new Map(this.state.usageStats);
  }

  /**
   * Get generated prompts history
   */
  public getGeneratedPrompts(limit?: number): GeneratedPrompt[] {
    if (limit) {
      return this.state.generatedPrompts.slice(-limit);
    }
    return [...this.state.generatedPrompts];
  }

  /**
   * Get current state
   */
  public getState(): PromptGeneratorState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.removeAllListeners();
    this.state.templates.clear();
    this.state.generatedPrompts = [];
    this.state.usageStats.clear();
  }
}

// Helper classes (simplified implementations)
class IntentClassifier {
  async analyzeIntent(input: string, role: UserRole): Promise<IntentAnalysis> {
    // Simplified intent analysis
    const intent = input.toLowerCase();
    let category: PromptCategory = 'communication';
    let urgency: PromptPriority = 'medium';

    if (intent.includes('emergency') || intent.includes('urgent')) {
      category = 'emergency';
      urgency = 'critical';
    } else if (intent.includes('performance') || intent.includes('metrics')) {
      category = 'performance';
    } else if (intent.includes('compliance') || intent.includes('violation')) {
      category = 'compliance';
    } else if (intent.includes('task') || intent.includes('work')) {
      category = 'tasks';
    } else if (intent.includes('building') || intent.includes('portfolio')) {
      category = 'portfolio';
    } else if (intent.includes('report') || intent.includes('analytics')) {
      category = 'analytics';
    }

    return {
      intent: input,
      confidence: 0.85,
      entities: [],
      sentiment: 'neutral',
      urgency,
      category
    };
  }
}

class ContextAnalyzer {
  analyzeContext(context: PromptContext): any {
    // Simplified context analysis
    return {
      complexity: 'medium',
      urgency: context.systemState.emergencyMode ? 'high' : 'low',
      userExperience: 'intermediate'
    };
  }
}

class PersonalizationEngine {
  personalize(content: string, preferences: UserPreferences): string {
    // Simplified personalization
    return content;
  }
}
