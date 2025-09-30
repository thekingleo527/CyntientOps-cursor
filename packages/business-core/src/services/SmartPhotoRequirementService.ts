/**
 * 📸 Smart Photo Requirement Service
 * Purpose: Intelligently determine when photos are required based on task type and category
 * Logic: Not all tasks need photos - only tasks that require visual verification
 */

export interface PhotoRequirement {
  requiresPhotos: boolean;
  requiredCategories: PhotoCategory[];
  beforePhoto: boolean;
  afterPhoto: boolean;
  duringPhoto: boolean;
  issuePhoto: boolean;
  completionPhoto: boolean;
  reasoning: string;
}

export enum PhotoCategory {
  BEFORE = 'before',
  DURING = 'during', 
  AFTER = 'after',
  ISSUE = 'issue',
  COMPLETION = 'completion'
}

export enum TaskCategory {
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  SANITATION = 'sanitation',
  INSPECTION = 'inspection',
  REPAIR = 'repair',
  SECURITY = 'security',
  OPERATIONS = 'operations'
}

export class SmartPhotoRequirementService {
  private static instance: SmartPhotoRequirementService;

  private constructor() {}

  public static getInstance(): SmartPhotoRequirementService {
    if (!SmartPhotoRequirementService.instance) {
      SmartPhotoRequirementService.instance = new SmartPhotoRequirementService();
    }
    return SmartPhotoRequirementService.instance;
  }

  /**
   * Determine photo requirements for a specific task
   */
  public getPhotoRequirements(taskTitle: string, taskCategory: TaskCategory, taskDescription?: string): PhotoRequirement {
    const title = taskTitle.toLowerCase();
    const description = taskDescription?.toLowerCase() || '';

    // Tasks that NEVER require photos (routine cleaning tasks)
    if (this.isRoutineCleaningTask(title, description)) {
      return {
        requiresPhotos: false,
        requiredCategories: [],
        beforePhoto: false,
        afterPhoto: false,
        duringPhoto: false,
        issuePhoto: false,
        completionPhoto: false,
        reasoning: 'Routine cleaning task - no visual verification needed'
      };
    }

    // Tasks that ALWAYS require before/after photos
    if (this.requiresBeforeAfterPhotos(title, description)) {
      return {
        requiresPhotos: true,
        requiredCategories: [PhotoCategory.BEFORE, PhotoCategory.AFTER],
        beforePhoto: true,
        afterPhoto: true,
        duringPhoto: false,
        issuePhoto: true,
        completionPhoto: true,
        reasoning: 'Visual verification required - before/after photos needed'
      };
    }

    // Tasks that require completion photos only
    if (this.requiresCompletionPhotos(title, description)) {
      return {
        requiresPhotos: true,
        requiredCategories: [PhotoCategory.COMPLETION],
        beforePhoto: false,
        afterPhoto: false,
        duringPhoto: false,
        issuePhoto: true,
        completionPhoto: true,
        reasoning: 'Completion verification required'
      };
    }

    // Tasks that require issue photos if problems found
    if (this.requiresIssuePhotos(title, description)) {
      return {
        requiresPhotos: true,
        requiredCategories: [PhotoCategory.ISSUE],
        beforePhoto: false,
        afterPhoto: false,
        duringPhoto: false,
        issuePhoto: true,
        completionPhoto: false,
        reasoning: 'Issue documentation required if problems found'
      };
    }

    // Default: no photos required
    return {
      requiresPhotos: false,
      requiredCategories: [],
      beforePhoto: false,
      afterPhoto: false,
      duringPhoto: false,
      issuePhoto: false,
      completionPhoto: false,
      reasoning: 'No visual verification needed for this task type'
    };
  }

  /**
   * Check if task is routine cleaning that doesn't need photos
   */
  private isRoutineCleaningTask(title: string, description: string): boolean {
    const routineCleaningKeywords = [
      'clean glass',
      'clean windows',
      'vacuum',
      'vacuuming',
      'sweep',
      'sweeping',
      'mop',
      'mopping',
      'dust',
      'dusting',
      'wipe down',
      'wipe surfaces',
      'polish',
      'polishing',
      'empty trash',
      'empty bins',
      'replace liners',
      'restock supplies',
      'organize',
      'organizing',
      'straighten',
      'straightening'
    ];

    return routineCleaningKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Check if task requires before/after photos
   */
  private requiresBeforeAfterPhotos(title: string, description: string): boolean {
    const beforeAfterKeywords = [
      // Sidewalk and exterior cleaning
      'hose sidewalk',
      'hose walkway',
      'pressure wash',
      'sidewalk cleaning',
      'exterior cleaning',
      'power wash',
      'steam clean',
      
      // Trash and waste management
      'trash bin set out',
      'trash bin return',
      'waste bin set out',
      'waste bin return',
      'garbage bin set out',
      'garbage bin return',
      'set out bins',
      'return bins',
      'bin placement',
      'bin retrieval',
      
      // Poster and signage
      'remove poster',
      'poster removal',
      'remove signage',
      'signage removal',
      'remove flyer',
      'flyer removal',
      'remove sticker',
      'sticker removal',
      'graffiti removal',
      'remove graffiti',
      
      // Deep cleaning tasks
      'deep clean',
      'thorough clean',
      'sanitize',
      'disinfect',
      'scrub',
      'scouring',
      
      // Maintenance tasks with visual impact
      'paint',
      'painting',
      'repair',
      'fix',
      'replace',
      'install',
      'remove',
      'demolish',
      
      // Landscaping
      'landscape',
      'landscaping',
      'trim',
      'prune',
      'plant',
      'mulch',
      'fertilize'
    ];

    return beforeAfterKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Check if task requires completion photos
   */
  private requiresCompletionPhotos(title: string, description: string): boolean {
    const completionKeywords = [
      'inspection',
      'check',
      'verify',
      'test',
      'audit',
      'review',
      'assess',
      'evaluate',
      'survey',
      'monitor',
      'patrol',
      'security check',
      'safety check',
      'compliance check'
    ];

    return completionKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Check if task requires issue photos
   */
  private requiresIssuePhotos(title: string, description: string): boolean {
    const issueKeywords = [
      'repair',
      'fix',
      'maintenance',
      'troubleshoot',
      'diagnose',
      'investigate',
      'damage',
      'broken',
      'malfunction',
      'leak',
      'clog',
      'blockage',
      'emergency',
      'urgent',
      'critical'
    ];

    return issueKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Get photo requirement explanation for a task
   */
  public getPhotoRequirementExplanation(taskTitle: string, taskCategory: TaskCategory, taskDescription?: string): string {
    const requirements = this.getPhotoRequirements(taskTitle, taskCategory, taskDescription);
    
    if (!requirements.requiresPhotos) {
      return `No photos required for "${taskTitle}" - ${requirements.reasoning}`;
    }

    const photoTypes = [];
    if (requirements.beforePhoto) photoTypes.push('before');
    if (requirements.afterPhoto) photoTypes.push('after');
    if (requirements.duringPhoto) photoTypes.push('during');
    if (requirements.issuePhoto) photoTypes.push('issue (if problems found)');
    if (requirements.completionPhoto) photoTypes.push('completion');

    return `Photos required for "${taskTitle}": ${photoTypes.join(', ')} - ${requirements.reasoning}`;
  }

  /**
   * Get smart photo prompts for a task
   */
  public getSmartPhotoPrompts(taskTitle: string, taskCategory: TaskCategory, taskDescription?: string): string[] {
    const requirements = this.getPhotoRequirements(taskTitle, taskCategory, taskDescription);
    const prompts = [];

    if (requirements.beforePhoto) {
      prompts.push(`📸 Take a "BEFORE" photo showing the current state before starting "${taskTitle}"`);
    }

    if (requirements.duringPhoto) {
      prompts.push(`📸 Take a "DURING" photo showing the work in progress for "${taskTitle}"`);
    }

    if (requirements.afterPhoto) {
      prompts.push(`📸 Take an "AFTER" photo showing the completed work for "${taskTitle}"`);
    }

    if (requirements.issuePhoto) {
      prompts.push(`📸 Take an "ISSUE" photo if you encounter any problems during "${taskTitle}"`);
    }

    if (requirements.completionPhoto) {
      prompts.push(`📸 Take a "COMPLETION" photo to verify the task "${taskTitle}" is finished`);
    }

    return prompts;
  }

  /**
   * Validate if required photos are present
   */
  public validatePhotoRequirements(
    taskTitle: string, 
    taskCategory: TaskCategory, 
    taskDescription: string | undefined,
    capturedPhotos: { category: PhotoCategory; uri: string }[]
  ): { isValid: boolean; missingPhotos: PhotoCategory[]; message: string } {
    const requirements = this.getPhotoRequirements(taskTitle, taskCategory, taskDescription);
    
    if (!requirements.requiresPhotos) {
      return {
        isValid: true,
        missingPhotos: [],
        message: 'No photos required for this task'
      };
    }

    const missingPhotos: PhotoCategory[] = [];
    const capturedCategories = capturedPhotos.map(photo => photo.category);

    if (requirements.beforePhoto && !capturedCategories.includes(PhotoCategory.BEFORE)) {
      missingPhotos.push(PhotoCategory.BEFORE);
    }

    if (requirements.afterPhoto && !capturedCategories.includes(PhotoCategory.AFTER)) {
      missingPhotos.push(PhotoCategory.AFTER);
    }

    if (requirements.duringPhoto && !capturedCategories.includes(PhotoCategory.DURING)) {
      missingPhotos.push(PhotoCategory.DURING);
    }

    if (requirements.completionPhoto && !capturedCategories.includes(PhotoCategory.COMPLETION)) {
      missingPhotos.push(PhotoCategory.COMPLETION);
    }

    const isValid = missingPhotos.length === 0;
    const message = isValid 
      ? 'All required photos have been captured'
      : `Missing required photos: ${missingPhotos.join(', ')}`;

    return { isValid, missingPhotos, message };
  }

  /**
   * Get task-specific photo tips
   */
  public getPhotoTips(taskTitle: string, taskCategory: TaskCategory, taskDescription?: string): string[] {
    const title = taskTitle.toLowerCase();
    const tips = [];

    if (title.includes('hose') || title.includes('pressure wash') || title.includes('sidewalk')) {
      tips.push('💡 For sidewalk cleaning: Capture the full width of the sidewalk in your photos');
      tips.push('💡 Show any debris, stains, or dirt that needs to be cleaned');
      tips.push('💡 After photo should show clean, dry sidewalk surface');
    }

    if (title.includes('trash') || title.includes('bin')) {
      tips.push('💡 For bin management: Show bin placement in designated area');
      tips.push('💡 Include surrounding area to show proper positioning');
      tips.push('💡 After photo should show bins properly returned to storage area');
    }

    if (title.includes('poster') || title.includes('removal')) {
      tips.push('💡 For poster removal: Show the poster/signage before removal');
      tips.push('💡 Capture any damage to the surface from removal');
      tips.push('💡 After photo should show clean surface with no residue');
    }

    if (title.includes('inspection')) {
      tips.push('💡 For inspections: Focus on areas that need attention');
      tips.push('💡 Include any issues or concerns found');
      tips.push('💡 Show overall condition of the inspected area');
    }

    return tips;
  }
}

// Export singleton instance
export const smartPhotoRequirement = SmartPhotoRequirementService.getInstance();
