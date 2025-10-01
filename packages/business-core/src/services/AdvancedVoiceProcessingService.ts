/**
 * 🎤 Advanced Voice Processing Service
 * Purpose: Enhanced speech recognition and voice command processing for Nova AI
 * Features: Multi-language support, context awareness, command interpretation
 */

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Logger } from './LoggingService';

export interface VoiceCommand {
  id: string;
  text: string;
  confidence: number;
  timestamp: Date;
  context?: {
    currentScreen?: string;
    currentTask?: string;
    workerId?: string;
    buildingId?: string;
  };
  intent?: VoiceIntent;
  entities?: VoiceEntity[];
}

export interface VoiceIntent {
  type: 'task_management' | 'navigation' | 'information' | 'emergency' | 'nova_interaction';
  action: string;
  parameters: { [key: string]: any };
  confidence: number;
}

export interface VoiceEntity {
  type: 'task' | 'building' | 'time' | 'location' | 'equipment' | 'priority';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface VoiceProcessingConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  contextAwareness: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
}

export interface VoiceResponse {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
  error?: string;
}

export class AdvancedVoiceProcessingService {
  private config: VoiceProcessingConfig;
  private isListening: boolean = false;
  private recognitionTimeout?: NodeJS.Timeout;
  private audioPermissionGranted: boolean = false;
  private currentContext: VoiceCommand['context'] = {};

  // Command patterns for intent recognition
  private commandPatterns = {
    task_management: [
      /start task (.+)/i,
      /complete task (.+)/i,
      /mark task (.+) as (.+)/i,
      /create task (.+)/i,
      /update task (.+)/i,
      /delete task (.+)/i,
      /prioritize task (.+)/i,
    ],
    navigation: [
      /navigate to (.+)/i,
      /go to (.+)/i,
      /show (.+)/i,
      /open (.+)/i,
      /switch to (.+)/i,
    ],
    information: [
      /what is (.+)/i,
      /tell me about (.+)/i,
      /show me (.+)/i,
      /how many (.+)/i,
      /status of (.+)/i,
    ],
    emergency: [
      /emergency/i,
      /help/i,
      /urgent/i,
      /alert/i,
      /danger/i,
    ],
    nova_interaction: [
      /nova/i,
      /ai/i,
      /assistant/i,
      /help me/i,
      /what should i do/i,
    ],
  };

  // Entity extraction patterns
  private entityPatterns = {
    task: [
      /task (\w+)/i,
      /(\w+) task/i,
      /cleaning/i,
      /maintenance/i,
      /inspection/i,
      /repair/i,
    ],
    building: [
      /building (\w+)/i,
      /(\w+) building/i,
      /(\d+) west (\d+) street/i,
      /(\d+) (\w+) street/i,
    ],
    time: [
      /(\d+):(\d+)/i,
      /(\d+) minutes/i,
      /(\d+) hours/i,
      /tomorrow/i,
      /today/i,
      /now/i,
    ],
    location: [
      /(\d+) floor/i,
      /basement/i,
      /roof/i,
      /lobby/i,
      /(\w+) room/i,
    ],
    equipment: [
      /(\w+) equipment/i,
      /toolkit/i,
      /ladder/i,
      /vacuum/i,
      /cleaning supplies/i,
    ],
    priority: [
      /urgent/i,
      /critical/i,
      /high priority/i,
      /medium priority/i,
      /low priority/i,
    ],
  };

  constructor(config: Partial<VoiceProcessingConfig> = {}) {
    this.config = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      contextAwareness: true,
      noiseReduction: true,
      echoCancellation: true,
      ...config,
    };
  }

  /**
   * Initializes the voice processing service
   */
  async initialize(): Promise<boolean> {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      this.audioPermissionGranted = status === 'granted';

      if (!this.audioPermissionGranted) {
        throw new Error('Audio permission not granted');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      return true;
    } catch (error) {
      Logger.error('Failed to initialize voice processing:', undefined, 'AdvancedVoiceProcessingService');
      return false;
    }
  }

  /**
   * Starts listening for voice commands
   */
  async startListening(): Promise<boolean> {
    if (!this.audioPermissionGranted) {
      throw new Error('Audio permission not granted');
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.isListening = true;
      
      // In a real implementation, this would use a speech recognition service
      // For now, we'll simulate the listening process
      this.simulateVoiceRecognition();
      
      return true;
    } catch (error) {
      Logger.error('Failed to start listening:', undefined, 'AdvancedVoiceProcessingService');
      this.isListening = false;
      return false;
    }
  }

  /**
   * Stops listening for voice commands
   */
  async stopListening(): Promise<void> {
    this.isListening = false;
    
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = undefined;
    }
  }

  /**
   * Processes a voice command and returns the response
   */
  async processVoiceCommand(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      // Extract intent and entities
      const intent = this.extractIntent(command.text);
      const entities = this.extractEntities(command.text);

      // Update command with extracted information
      command.intent = intent;
      command.entities = entities;

      // Process based on intent
      switch (intent.type) {
        case 'task_management':
          return await this.processTaskManagementCommand(command);
        case 'navigation':
          return await this.processNavigationCommand(command);
        case 'information':
          return await this.processInformationCommand(command);
        case 'emergency':
          return await this.processEmergencyCommand(command);
        case 'nova_interaction':
          return await this.processNovaInteractionCommand(command);
        default:
          return {
            success: false,
            message: 'I did not understand that command. Please try again.',
            error: 'Unknown intent',
          };
      }
    } catch (error) {
      Logger.error('Failed to process voice command:', undefined, 'AdvancedVoiceProcessingService');
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your command.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Speaks a response using text-to-speech
   */
  async speakResponse(text: string, options?: { rate?: number; pitch?: number; voice?: string }): Promise<void> {
    try {
      const speechOptions: Speech.SpeechOptions = {
        rate: options?.rate || 0.8,
        pitch: options?.pitch || 1.0,
        voice: options?.voice,
        language: this.config.language,
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      Logger.error('Failed to speak response:', undefined, 'AdvancedVoiceProcessingService');
    }
  }

  /**
   * Sets the current context for voice processing
   */
  setContext(context: VoiceCommand['context']): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  /**
   * Extracts intent from voice command text
   */
  private extractIntent(text: string): VoiceIntent {
    let bestMatch: { type: VoiceIntent['type']; action: string; parameters: any; confidence: number } = {
      type: 'nova_interaction',
      action: 'unknown',
      parameters: {},
      confidence: 0,
    };

    // Check each intent type
    Object.entries(this.commandPatterns).forEach(([intentType, patterns]) => {
      patterns.forEach(pattern => {
        const match = text.match(pattern);
        if (match) {
          const confidence = this.calculateConfidence(text, pattern);
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              type: intentType as VoiceIntent['type'],
              action: this.extractAction(text, intentType),
              parameters: this.extractParameters(match),
              confidence,
            };
          }
        }
      });
    });

    return bestMatch;
  }

  /**
   * Extracts entities from voice command text
   */
  private extractEntities(text: string): VoiceEntity[] {
    const entities: VoiceEntity[] = [];

    Object.entries(this.entityPatterns).forEach(([entityType, patterns]) => {
      patterns.forEach(pattern => {
        const match = text.match(pattern);
        if (match) {
          entities.push({
            type: entityType as VoiceEntity['type'],
            value: match[0],
            confidence: this.calculateConfidence(text, pattern),
            startIndex: match.index || 0,
            endIndex: (match.index || 0) + match[0].length,
          });
        }
      });
    });

    return entities;
  }

  /**
   * Calculates confidence score for pattern matching
   */
  private calculateConfidence(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    if (!match) return 0;

    // Base confidence on match length and text similarity
    const matchLength = match[0].length;
    const textLength = text.length;
    const lengthRatio = matchLength / textLength;

    // Higher confidence for longer matches and exact matches
    return Math.min(1.0, lengthRatio * 1.5);
  }

  /**
   * Extracts action from text based on intent type
   */
  private extractAction(text: string, intentType: string): string {
    const actionMap: { [key: string]: { [key: string]: string } } = {
      task_management: {
        'start': 'start_task',
        'complete': 'complete_task',
        'mark': 'update_task',
        'create': 'create_task',
        'update': 'update_task',
        'delete': 'delete_task',
        'prioritize': 'prioritize_task',
      },
      navigation: {
        'navigate': 'navigate',
        'go': 'navigate',
        'show': 'show',
        'open': 'open',
        'switch': 'switch',
      },
      information: {
        'what': 'query',
        'tell': 'query',
        'show': 'show',
        'how many': 'count',
        'status': 'status',
      },
      emergency: {
        'emergency': 'emergency',
        'help': 'help',
        'urgent': 'urgent',
        'alert': 'alert',
        'danger': 'danger',
      },
      nova_interaction: {
        'nova': 'nova_interact',
        'ai': 'nova_interact',
        'assistant': 'nova_interact',
        'help me': 'nova_help',
        'what should i do': 'nova_advice',
      },
    };

    const actions = actionMap[intentType] || {};
    const lowerText = text.toLowerCase();

    for (const [keyword, action] of Object.entries(actions)) {
      if (lowerText.includes(keyword)) {
        return action;
      }
    }

    return 'unknown';
  }

  /**
   * Extracts parameters from regex match
   */
  private extractParameters(match: RegExpMatchArray): { [key: string]: any } {
    const parameters: { [key: string]: any } = {};
    
    // Extract captured groups as parameters
    for (let i = 1; i < match.length; i++) {
      parameters[`param${i}`] = match[i];
    }

    return parameters;
  }

  /**
   * Processes task management commands
   */
  private async processTaskManagementCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const { intent, entities } = command;
    
    if (!intent) {
      return {
        success: false,
        message: 'I could not understand the task command.',
        error: 'No intent detected',
      };
    }

    switch (intent.action) {
      case 'start_task':
        return {
          success: true,
          message: `Starting task: ${intent.parameters.param1}`,
          action: 'start_task',
          data: { taskName: intent.parameters.param1 },
        };
      
      case 'complete_task':
        return {
          success: true,
          message: `Marking task as complete: ${intent.parameters.param1}`,
          action: 'complete_task',
          data: { taskName: intent.parameters.param1 },
        };
      
      case 'create_task':
        return {
          success: true,
          message: `Creating new task: ${intent.parameters.param1}`,
          action: 'create_task',
          data: { taskName: intent.parameters.param1 },
        };
      
      default:
        return {
          success: false,
          message: 'I did not understand that task command.',
          error: 'Unknown task action',
        };
    }
  }

  /**
   * Processes navigation commands
   */
  private async processNavigationCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const { intent } = command;
    
    if (!intent) {
      return {
        success: false,
        message: 'I could not understand the navigation command.',
        error: 'No intent detected',
      };
    }

    return {
      success: true,
      message: `Navigating to: ${intent.parameters.param1}`,
      action: 'navigate',
      data: { destination: intent.parameters.param1 },
    };
  }

  /**
   * Processes information commands
   */
  private async processInformationCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const { intent } = command;
    
    if (!intent) {
      return {
        success: false,
        message: 'I could not understand the information request.',
        error: 'No intent detected',
      };
    }

    return {
      success: true,
      message: `Here's information about: ${intent.parameters.param1}`,
      action: 'query',
      data: { query: intent.parameters.param1 },
    };
  }

  /**
   * Processes emergency commands
   */
  private async processEmergencyCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      success: true,
      message: 'Emergency alert activated. Help is on the way.',
      action: 'emergency',
      data: { 
        type: 'voice_emergency',
        timestamp: new Date(),
        context: this.currentContext,
      },
    };
  }

  /**
   * Processes Nova AI interaction commands
   */
  private async processNovaInteractionCommand(command: VoiceCommand): Promise<VoiceResponse> {
    return {
      success: true,
      message: 'Nova AI is ready to help. What would you like to know?',
      action: 'nova_interact',
      data: { 
        command: command.text,
        context: this.currentContext,
      },
    };
  }

  /**
   * Simulates voice recognition for demo purposes
   */
  private simulateVoiceRecognition(): void {
    // In a real implementation, this would be replaced with actual speech recognition
    // For demo purposes, we'll simulate some common commands after a delay
    
    this.recognitionTimeout = setTimeout(() => {
      if (this.isListening) {
        // Simulate receiving a voice command
        const simulatedCommands = [
          'Start cleaning task',
          'Navigate to building 1',
          'What is the status of maintenance',
          'Nova help me with my tasks',
          'Emergency situation',
        ];
        
        const randomCommand = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
        
        const command: VoiceCommand = {
          id: `cmd_${Date.now()}`,
          text: randomCommand,
          confidence: 0.9,
          timestamp: new Date(),
          context: this.currentContext,
        };
        
        // Process the simulated command
        this.processVoiceCommand(command).then(response => {
          Logger.debug('Voice command processed:', undefined, 'AdvancedVoiceProcessingService');
          if (response.success && response.message) {
            this.speakResponse(response.message);
          }
        });
        
        // Continue listening
        this.simulateVoiceRecognition();
      }
    }, 5000); // Simulate command every 5 seconds
  }

  /**
   * Gets the current listening status
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): VoiceProcessingConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<VoiceProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default AdvancedVoiceProcessingService;
