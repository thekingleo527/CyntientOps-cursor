/**
 * 🧠 Nova AI Brain Service
 * Purpose: Enhanced AI processing with Supabase integration for intelligent insights
 * Mirrors: CyntientOps/Services/Nova/NovaAPIService.swift enhanced brain capabilities
 */

import { DatabaseManager } from '@cyntientops/database';
import { UserRole, OperationalDataTaskAssignment, NamedCoordinate } from '@cyntientops/domain-schema';

export interface NovaInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'optimization' | 'analysis';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'safety' | 'efficiency' | 'compliance' | 'weather' | 'route' | 'maintenance';
  confidence: number; // 0-100
  actionable: boolean;
  timestamp: Date;
  workerId?: string;
  buildingId?: string;
  taskId?: string;
  data: any;
  source: 'local_analysis' | 'supabase_ai' | 'hybrid';
}

export interface NovaAnalysis {
  workerId: string;
  buildingId: string;
  analysisType: 'performance' | 'efficiency' | 'safety' | 'compliance';
  insights: NovaInsight[];
  recommendations: string[];
  riskFactors: string[];
  opportunities: string[];
  confidence: number;
  timestamp: Date;
}

export interface NovaContext {
  userRole: UserRole;
  userId: string;
  currentBuilding?: NamedCoordinate;
  currentTask?: OperationalDataTaskAssignment;
  workerProfile?: any;
  buildingContext?: any;
  taskContext?: any;
  weatherContext?: any;
  timeContext?: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    season: string;
  };
}

export interface NovaPrompt {
  id: string;
  text: string;
  context: NovaContext;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedResponseType: 'insight' | 'recommendation' | 'analysis' | 'prediction' | 'action';
  metadata: Record<string, any>;
}

export interface NovaResponse {
  id: string;
  promptId: string;
  responseType: 'insight' | 'recommendation' | 'analysis' | 'prediction' | 'action';
  content: string;
  insights: NovaInsight[];
  actions: NovaAction[];
  confidence: number;
  processingTime: number;
  source: 'local' | 'supabase' | 'hybrid';
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface NovaAction {
  id: string;
  type: 'navigate' | 'create_task' | 'send_alert' | 'schedule_maintenance' | 'optimize_route';
  title: string;
  description: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
}

export interface SupabaseConfig {
  url: string;
  apiKey: string;
  enableAI: boolean;
  enableRealTime: boolean;
  enableAnalytics: boolean;
}

export class NovaAIBrainService {
  private static instance: NovaAIBrainService;
  private database: DatabaseManager;
  private supabaseConfig: SupabaseConfig;
  private isSupabaseEnabled: boolean;
  private processingQueue: NovaPrompt[] = [];
  private isProcessing = false;

  private constructor(database: DatabaseManager, supabaseConfig: SupabaseConfig) {
    this.database = database;
    this.supabaseConfig = supabaseConfig;
    this.isSupabaseEnabled = supabaseConfig.enableAI && !!supabaseConfig.url && !!supabaseConfig.apiKey;
  }

  public static getInstance(
    database: DatabaseManager, 
    supabaseConfig?: Partial<SupabaseConfig>
  ): NovaAIBrainService {
    if (!NovaAIBrainService.instance) {
      const defaultConfig: SupabaseConfig = {
        url: process.env.SUPABASE_URL || '',
        apiKey: process.env.SUPABASE_ANON_KEY || '',
        enableAI: true,
        enableRealTime: true,
        enableAnalytics: true
      };

      NovaAIBrainService.instance = new NovaAIBrainService(
        database,
        { ...defaultConfig, ...supabaseConfig }
      );
    }
    return NovaAIBrainService.instance;
  }

  // MARK: - Core AI Processing

  /**
   * Process Nova prompt with hybrid online/offline processing
   */
  async processPrompt(prompt: NovaPrompt): Promise<NovaResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🧠 Nova: Processing prompt "${prompt.text.substring(0, 50)}..."`);
      
      // Add to processing queue
      this.processingQueue.push(prompt);
      
      let response: NovaResponse;
      
      if (this.isSupabaseEnabled) {
        // Try Supabase AI first
        try {
          response = await this.processWithSupabase(prompt);
        } catch (error) {
          console.log('🔄 Nova: Supabase failed, falling back to local processing');
          response = await this.processLocally(prompt);
        }
      } else {
        // Use local processing
        response = await this.processLocally(prompt);
      }
      
      // Calculate processing time
      response.processingTime = Date.now() - startTime;
      
      // Store response in database
      await this.storeResponse(response);
      
      console.log(`✅ Nova: Response generated in ${response.processingTime}ms`);
      return response;
      
    } catch (error) {
      console.error('❌ Nova: Failed to process prompt:', error);
      
      // Return error response
      return {
        id: `nova_resp_${Date.now()}`,
        promptId: prompt.id,
        responseType: 'analysis',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        insights: [],
        actions: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        source: 'local',
        timestamp: new Date(),
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Process prompt using Supabase AI
   */
  private async processWithSupabase(prompt: NovaPrompt): Promise<NovaResponse> {
    try {
      // Prepare context for Supabase
      const context = await this.buildSupabaseContext(prompt.context);
      
      // Call Supabase Edge Function
      const response = await fetch(`${this.supabaseConfig.url}/functions/v1/nova-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt.text,
          context,
          userRole: prompt.context.userRole,
          expectedResponseType: prompt.expectedResponseType,
          priority: prompt.priority
        })
      });

      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: `nova_resp_${Date.now()}`,
        promptId: prompt.id,
        responseType: prompt.expectedResponseType,
        content: data.content || 'No response generated',
        insights: data.insights || [],
        actions: data.actions || [],
        confidence: data.confidence || 0,
        processingTime: 0, // Will be set by caller
        source: 'supabase',
        timestamp: new Date(),
        metadata: data.metadata || {}
      };
      
    } catch (error) {
      console.error('Supabase processing failed:', error);
      throw error;
    }
  }

  /**
   * Process prompt using local AI logic
   */
  private async processLocally(prompt: NovaPrompt): Promise<NovaResponse> {
    try {
      // Analyze prompt intent
      const intent = this.analyzePromptIntent(prompt.text);
      
      // Get relevant data based on context
      const contextData = await this.gatherContextData(prompt.context);
      
      // Generate insights based on data and intent
      const insights = await this.generateLocalInsights(intent, contextData, prompt.context);
      
      // Generate response content
      const content = this.generateResponseContent(intent, insights, prompt.context);
      
      // Generate actionable items
      const actions = this.generateActions(intent, insights, prompt.context);
      
      return {
        id: `nova_resp_${Date.now()}`,
        promptId: prompt.id,
        responseType: prompt.expectedResponseType,
        content,
        insights,
        actions,
        confidence: this.calculateConfidence(insights, contextData),
        processingTime: 0, // Will be set by caller
        source: 'local',
        timestamp: new Date(),
        metadata: {
          intent,
          contextDataKeys: Object.keys(contextData),
          insightsCount: insights.length
        }
      };
      
    } catch (error) {
      console.error('Local processing failed:', error);
      throw error;
    }
  }

  // MARK: - Context Building

  /**
   * Build context for Supabase AI
   */
  private async buildSupabaseContext(context: NovaContext): Promise<any> {
    const supabaseContext: any = {
      userRole: context.userRole,
      userId: context.userId,
      timeContext: context.timeContext
    };

    // Add building context
    if (context.currentBuilding) {
      supabaseContext.building = {
        id: context.currentBuilding.id,
        name: context.currentBuilding.name,
        address: context.currentBuilding.address
      };
      
      // Get building metrics
      const buildingMetrics = await this.getBuildingMetrics(context.currentBuilding.id);
      supabaseContext.building.metrics = buildingMetrics;
    }

    // Add task context
    if (context.currentTask) {
      supabaseContext.task = {
        id: context.currentTask.id,
        name: context.currentTask.name,
        category: context.currentTask.category,
        priority: context.currentTask.priority,
        status: context.currentTask.status,
        dueDate: context.currentTask.due_date
      };
    }

    // Add worker context
    if (context.workerProfile) {
      supabaseContext.worker = {
        id: context.workerProfile.id,
        name: context.workerProfile.name,
        role: context.workerProfile.role,
        skills: context.workerProfile.skills
      };
      
      // Get worker performance
      const performance = await this.getWorkerPerformance(context.workerProfile.id);
      supabaseContext.worker.performance = performance;
    }

    // Add weather context
    if (context.weatherContext) {
      supabaseContext.weather = context.weatherContext;
    }

    return supabaseContext;
  }

  /**
   * Gather context data for local processing
   */
  private async gatherContextData(context: NovaContext): Promise<any> {
    const data: any = {};

    // Get worker data
    if (context.userId) {
      data.worker = await this.getWorkerData(context.userId);
      data.workerTasks = await this.getWorkerTasks(context.userId);
      data.workerPerformance = await this.getWorkerPerformance(context.userId);
    }

    // Get building data
    if (context.currentBuilding) {
      data.building = await this.getBuildingData(context.currentBuilding.id);
      data.buildingTasks = await this.getBuildingTasks(context.currentBuilding.id);
      data.buildingMetrics = await this.getBuildingMetrics(context.currentBuilding.id);
    }

    // Get task data
    if (context.currentTask) {
      data.task = context.currentTask;
      data.taskHistory = await this.getTaskHistory(context.currentTask.id);
    }

    // Get weather data
    if (context.weatherContext) {
      data.weather = context.weatherContext;
    }

    return data;
  }

  // MARK: - Local AI Logic

  /**
   * Analyze prompt intent
   */
  private analyzePromptIntent(promptText: string): any {
    const text = promptText.toLowerCase();
    
    const intents = {
      isQuestion: text.includes('?') || text.startsWith('what') || text.startsWith('how') || text.startsWith('why'),
      isRequest: text.includes('can you') || text.includes('please') || text.includes('help'),
      isStatus: text.includes('status') || text.includes('how am i') || text.includes('progress'),
      isOptimization: text.includes('optimize') || text.includes('improve') || text.includes('better'),
      isPrediction: text.includes('predict') || text.includes('forecast') || text.includes('will'),
      isAnalysis: text.includes('analyze') || text.includes('review') || text.includes('assess'),
      isAction: text.includes('do') || text.includes('create') || text.includes('schedule')
    };

    return intents;
  }

  /**
   * Generate local insights
   */
  private async generateLocalInsights(intent: any, contextData: any, context: NovaContext): Promise<NovaInsight[]> {
    const insights: NovaInsight[] = [];

    // Performance insights
    if (contextData.workerPerformance) {
      const performance = contextData.workerPerformance;
      
      if (performance.completionRate < 80) {
        insights.push({
          id: `insight_${Date.now()}_1`,
          type: 'recommendation',
          title: 'Performance Improvement Opportunity',
          description: `Your completion rate is ${performance.completionRate}%. Consider focusing on task prioritization and time management.`,
          priority: 'medium',
          category: 'performance',
          confidence: 85,
          actionable: true,
          timestamp: new Date(),
          workerId: context.userId,
          data: { completionRate: performance.completionRate },
          source: 'local_analysis'
        });
      }
    }

    // Task insights
    if (contextData.workerTasks) {
      const tasks = contextData.workerTasks;
      const overdueTasks = tasks.filter((t: any) => new Date(t.due_date) < new Date() && t.status !== 'Completed');
      
      if (overdueTasks.length > 0) {
        insights.push({
          id: `insight_${Date.now()}_2`,
          type: 'alert',
          title: 'Overdue Tasks Alert',
          description: `You have ${overdueTasks.length} overdue task(s). Consider prioritizing these tasks.`,
          priority: 'high',
          category: 'efficiency',
          confidence: 95,
          actionable: true,
          timestamp: new Date(),
          workerId: context.userId,
          data: { overdueCount: overdueTasks.length, overdueTasks },
          source: 'local_analysis'
        });
      }
    }

    // Building insights
    if (contextData.buildingMetrics) {
      const metrics = contextData.buildingMetrics;
      
      if (metrics.maintenanceScore < 70) {
        insights.push({
          id: `insight_${Date.now()}_3`,
          type: 'recommendation',
          title: 'Building Maintenance Needed',
          description: `Building maintenance score is ${metrics.maintenanceScore}%. Consider scheduling maintenance tasks.`,
          priority: 'medium',
          category: 'maintenance',
          confidence: 80,
          actionable: true,
          timestamp: new Date(),
          buildingId: context.currentBuilding?.id,
          data: { maintenanceScore: metrics.maintenanceScore },
          source: 'local_analysis'
        });
      }
    }

    return insights;
  }

  /**
   * Generate response content
   */
  private generateResponseContent(intent: any, insights: NovaInsight[], context: NovaContext): string {
    let content = '';

    if (intent.isQuestion) {
      content = this.generateQuestionResponse(insights, context);
    } else if (intent.isRequest) {
      content = this.generateRequestResponse(insights, context);
    } else if (intent.isStatus) {
      content = this.generateStatusResponse(insights, context);
    } else if (intent.isOptimization) {
      content = this.generateOptimizationResponse(insights, context);
    } else {
      content = this.generateGeneralResponse(insights, context);
    }

    return content;
  }

  /**
   * Generate actions based on insights
   */
  private generateActions(intent: any, insights: NovaInsight[], context: NovaContext): NovaAction[] {
    const actions: NovaAction[] = [];

    // Generate actions based on insights
    for (const insight of insights) {
      if (insight.actionable) {
        switch (insight.category) {
          case 'performance':
            actions.push({
              id: `action_${Date.now()}_1`,
              type: 'create_task',
              title: 'Schedule Performance Review',
              description: 'Create a task to review and improve performance metrics',
              parameters: { taskType: 'performance_review', workerId: context.userId },
              priority: 'medium',
              actionable: true
            });
            break;
            
          case 'maintenance':
            actions.push({
              id: `action_${Date.now()}_2`,
              type: 'schedule_maintenance',
              title: 'Schedule Building Maintenance',
              description: 'Schedule maintenance tasks for the building',
              parameters: { buildingId: context.currentBuilding?.id },
              priority: 'high',
              actionable: true
            });
            break;
        }
      }
    }

    return actions;
  }

  // MARK: - Data Access Methods

  /**
   * Get worker data
   */
  private async getWorkerData(workerId: string): Promise<any> {
    try {
      const result = await this.database.query(
        'SELECT * FROM workers WHERE id = ?',
        [workerId]
      );
      return result[0] || null;
    } catch (error) {
      console.error('Failed to get worker data:', error);
      return null;
    }
  }

  /**
   * Get worker tasks
   */
  private async getWorkerTasks(workerId: string): Promise<any[]> {
    try {
      const result = await this.database.query(
        'SELECT * FROM tasks WHERE assigned_worker_id = ? ORDER BY due_date ASC',
        [workerId]
      );
      return result;
    } catch (error) {
      console.error('Failed to get worker tasks:', error);
      return [];
    }
  }

  /**
   * Get worker performance
   */
  private async getWorkerPerformance(workerId: string): Promise<any> {
    try {
      const result = await this.database.query(
        `SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
          AVG(CASE WHEN status = 'Completed' THEN estimated_duration ELSE NULL END) as avg_completion_time
        FROM tasks 
        WHERE assigned_worker_id = ?`,
        [workerId]
      );
      
      const metrics = result[0];
      const completionRate = metrics.total_tasks > 0 ? (metrics.completed_tasks / metrics.total_tasks) * 100 : 0;
      
      return {
        totalTasks: metrics.total_tasks,
        completedTasks: metrics.completed_tasks,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTime: Math.round(metrics.avg_completion_time || 0)
      };
    } catch (error) {
      console.error('Failed to get worker performance:', error);
      return { totalTasks: 0, completedTasks: 0, completionRate: 0, averageCompletionTime: 0 };
    }
  }

  /**
   * Get building data
   */
  private async getBuildingData(buildingId: string): Promise<any> {
    try {
      const result = await this.database.query(
        'SELECT * FROM buildings WHERE id = ?',
        [buildingId]
      );
      return result[0] || null;
    } catch (error) {
      console.error('Failed to get building data:', error);
      return null;
    }
  }

  /**
   * Get building tasks
   */
  private async getBuildingTasks(buildingId: string): Promise<any[]> {
    try {
      const result = await this.database.query(
        'SELECT * FROM tasks WHERE building_id = ? ORDER BY due_date ASC',
        [buildingId]
      );
      return result;
    } catch (error) {
      console.error('Failed to get building tasks:', error);
      return [];
    }
  }

  /**
   * Get building metrics
   */
  private async getBuildingMetrics(buildingId: string): Promise<any> {
    try {
      // This would typically come from a metrics service
      // For now, return mock data
      return {
        maintenanceScore: 75,
        complianceScore: 90,
        safetyScore: 85,
        efficiencyScore: 80
      };
    } catch (error) {
      console.error('Failed to get building metrics:', error);
      return { maintenanceScore: 0, complianceScore: 0, safetyScore: 0, efficiencyScore: 0 };
    }
  }

  /**
   * Get task history
   */
  private async getTaskHistory(taskId: string): Promise<any[]> {
    try {
      const result = await this.database.query(
        'SELECT * FROM task_history WHERE task_id = ? ORDER BY created_at DESC',
        [taskId]
      );
      return result;
    } catch (error) {
      console.error('Failed to get task history:', error);
      return [];
    }
  }

  // MARK: - Response Generation Helpers

  private generateQuestionResponse(insights: NovaInsight[], context: NovaContext): string {
    if (insights.length > 0) {
      return `Based on your current data, I've identified ${insights.length} key insights. ${insights[0].description}`;
    }
    return "I'd be happy to help answer your question. Could you provide more specific details?";
  }

  private generateRequestResponse(insights: NovaInsight[], context: NovaContext): string {
    if (insights.length > 0) {
      return `I can help with that. Here are some recommendations: ${insights.map(i => i.description).join(' ')}`;
    }
    return "I'm here to help. What specific assistance do you need?";
  }

  private generateStatusResponse(insights: NovaInsight[], context: NovaContext): string {
    if (insights.length > 0) {
      return `Here's your current status: ${insights.map(i => i.description).join(' ')}`;
    }
    return "Your status looks good. Is there anything specific you'd like to know about?";
  }

  private generateOptimizationResponse(insights: NovaInsight[], context: NovaContext): string {
    if (insights.length > 0) {
      return `Here are some optimization opportunities: ${insights.map(i => i.description).join(' ')}`;
    }
    return "I can help optimize your workflow. What area would you like to focus on?";
  }

  private generateGeneralResponse(insights: NovaInsight[], context: NovaContext): string {
    if (insights.length > 0) {
      return `I've analyzed your situation and found: ${insights.map(i => i.description).join(' ')}`;
    }
    return "I'm here to assist you. How can I help today?";
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(insights: NovaInsight[], contextData: any): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on data availability
    if (contextData.worker) confidence += 10;
    if (contextData.building) confidence += 10;
    if (contextData.task) confidence += 10;
    if (contextData.weather) confidence += 5;
    
    // Increase confidence based on insights quality
    if (insights.length > 0) {
      const avgInsightConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
      confidence = (confidence + avgInsightConfidence) / 2;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Store response in database
   */
  private async storeResponse(response: NovaResponse): Promise<void> {
    try {
      await this.database.execute(
        `INSERT INTO nova_responses (id, prompt_id, response_type, content, insights, actions, 
         confidence, processing_time, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          response.id,
          response.promptId,
          response.responseType,
          response.content,
          JSON.stringify(response.insights),
          JSON.stringify(response.actions),
          response.confidence,
          response.processingTime,
          response.source,
          response.timestamp.toISOString()
        ]
      );
    } catch (error) {
      console.error('Failed to store Nova response:', error);
    }
  }

  // MARK: - Utility Methods

  /**
   * Get processing queue status
   */
  getQueueStatus(): number {
    return this.processingQueue.length;
  }

  /**
   * Check if Supabase is enabled
   */
  isSupabaseAvailable(): boolean {
    return this.isSupabaseEnabled;
  }

  /**
   * Get service statistics
   */
  async getServiceStats(): Promise<any> {
    try {
      const stats = await this.database.query(
        'SELECT COUNT(*) as count FROM nova_responses WHERE created_at > datetime("now", "-24 hours")'
      );
      
      return {
        responsesLast24h: stats[0]?.count || 0,
        queueSize: this.processingQueue.length,
        supabaseEnabled: this.isSupabaseEnabled,
        isProcessing: this.isProcessing
      };
    } catch (error) {
      console.error('Failed to get service stats:', error);
      return {
        responsesLast24h: 0,
        queueSize: 0,
        supabaseEnabled: false,
        isProcessing: false
      };
    }
  }
}

export default NovaAIBrainService;
