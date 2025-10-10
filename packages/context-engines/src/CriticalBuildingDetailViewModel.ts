/**
 * CriticalBuildingDetailViewModel
 * 
 * Specialized ViewModel for critical buildings requiring immediate attention
 * Handles emergency compliance issues, HPD violations, and urgent repairs
 * Extends BuildingDetailViewModel with emergency-specific functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ServiceContainer } from '@cyntientops/business-core';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

// MARK: - Critical Building Types

export interface CriticalBuildingState {
  // Building Information
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  complianceScore: number;
  complianceGrade: string;
  complianceStatus: 'critical' | 'high' | 'medium' | 'low';
  
  // Critical Issues
  hpdViolations: HPDViolation[];
  dsnyViolations: DSNYViolation[];
  fdnyInspections: FDNYInspection[];
  complaints311: Complaints311[];
  outstandingFines: number;
  dailyPenalties: number;
  
  // Emergency Team
  assignedWorkers: CriticalWorker[];
  emergencyContacts: EmergencyContact[];
  
  // Real-time Status
  isEmergencyMode: boolean;
  lastUpdated: Date;
  nextReviewDate: Date;
  
  // UI State
  selectedTab: 'overview' | 'operations' | 'compliance' | 'resources' | 'emergency' | 'reports';
  isLoading: boolean;
  error: string | null;
}

export interface CriticalWorker {
  id: string;
  name: string;
  role: 'lead' | 'assistant' | 'admin';
  status: 'available' | 'busy' | 'offline';
  currentTask: string;
  phone: string;
  isEmergencyAssigned: boolean;
  clockedInTime: Date;
  estimatedCompletion: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  agency: 'HPD' | 'DSNY' | 'FDNY' | 'NYC311' | 'MANAGEMENT';
  phone: string;
  email?: string;
  isEmergency: boolean;
  responseTime: string;
}

export interface CriticalTask {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  assignedWorker: string;
  dueDate: Date;
  estimatedDuration: number;
  violationId?: string;
  fineAmount?: number;
  isEmergency: boolean;
}

export interface CriticalBuildingActions {
  // Emergency Actions
  startEmergencyProtocol: () => Promise<void>;
  assignEmergencyWorker: (workerId: string, taskId: string) => Promise<void>;
  escalateToAdmin: (message: string) => Promise<void>;
  
  // Violation Management
  startViolationRepair: (violationId: string) => Promise<void>;
  markViolationComplete: (violationId: string, notes: string) => Promise<void>;
  contactHPD: (violationId: string) => Promise<void>;
  
  // Financial Management
  payOutstandingFines: (amount: number) => Promise<void>;
  setupPaymentPlan: (amount: number, installments: number) => Promise<void>;
  
  // Communication
  sendEmergencyMessage: (message: string, recipients: string[]) => Promise<void>;
  broadcastAlert: (message: string) => Promise<void>;
  
  // Navigation
  switchTab: (tab: CriticalBuildingState['selectedTab']) => void;
  refreshData: () => Promise<void>;
}

export function useCriticalBuildingDetailViewModel(
  container: ServiceContainer,
  buildingId: string,
  buildingName: string,
  buildingAddress: string
): CriticalBuildingState & CriticalBuildingActions {
  
  // MARK: - State Management
  
  const [state, setState] = useState<CriticalBuildingState>({
    buildingId,
    buildingName,
    buildingAddress,
    complianceScore: 65, // Critical building default
    complianceGrade: 'C',
    complianceStatus: 'critical',
    hpdViolations: [],
    dsnyViolations: [],
    fdnyInspections: [],
    complaints311: [],
    outstandingFines: 2340,
    dailyPenalties: 50,
    assignedWorkers: [],
    emergencyContacts: [],
    isEmergencyMode: true,
    lastUpdated: new Date(),
    nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    selectedTab: 'compliance', // Default to compliance for critical buildings
    isLoading: true,
    error: null
  });

  // MARK: - Data Loading
  
  const loadCriticalBuildingData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Load HPD violations
      const hpdViolations = await container.apiClients.hpd.getBuildingViolations(buildingId);
      const criticalViolations = hpdViolations.filter(v => 
        v.violationclass === 'A' && (v.currentstatus === 'OPEN' || v.currentstatus === 'ACTIVE')
      );
      
      // Load DSNY violations
      const dsnyViolations = await container.apiClients.dsny.getBuildingViolations(buildingId);
      
      // Load FDNY inspections
      const fdnyInspections = await container.apiClients.fdny.getBuildingInspections(buildingId, 10);
      
      // Load 311 complaints
      const complaints311 = await container.apiClients.complaints311.getBuildingComplaints(buildingId, 20);
      
      // Calculate compliance score
      const complianceScore = calculateCriticalComplianceScore({
        hpdViolations: criticalViolations.length,
        dsnyViolations: dsnyViolations.length,
        fdnyFailures: fdnyInspections.filter(i => i.result === 'FAIL').length,
        complaints311: complaints311.length,
        outstandingFines: 2340 // From building data
      });
      
      // Load assigned workers
      const assignedWorkers = await loadCriticalWorkers(container, buildingId);
      
      // Load emergency contacts
      const emergencyContacts = loadEmergencyContacts();
      
      setState(prev => ({
        ...prev,
        hpdViolations: criticalViolations,
        dsnyViolations,
        fdnyInspections,
        complaints311,
        complianceScore: complianceScore.score,
        complianceGrade: complianceScore.grade,
        complianceStatus: complianceScore.status,
        assignedWorkers,
        emergencyContacts,
        isEmergencyMode: criticalViolations.length > 0,
        lastUpdated: new Date(),
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Failed to load critical building data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load critical building data',
        isLoading: false
      }));
    }
  }, [container, buildingId]);

  // MARK: - Emergency Actions
  
  const startEmergencyProtocol = useCallback(async () => {
    try {
      // Notify all assigned workers
      const emergencyMessage = `🚨 EMERGENCY PROTOCOL ACTIVATED for ${buildingName}. All hands on deck!`;
      await broadcastAlert(emergencyMessage);
      
      // Set emergency mode
      setState(prev => ({ ...prev, isEmergencyMode: true }));
      
      // Log emergency activation
      console.log(`Emergency protocol activated for ${buildingName}`);
      
    } catch (error) {
      console.error('Failed to start emergency protocol:', error);
      setState(prev => ({ ...prev, error: 'Failed to start emergency protocol' }));
    }
  }, [buildingName]);

  const assignEmergencyWorker = useCallback(async (workerId: string, taskId: string) => {
    try {
      // Update worker assignment
      setState(prev => ({
        ...prev,
        assignedWorkers: prev.assignedWorkers.map(worker => 
          worker.id === workerId 
            ? { ...worker, isEmergencyAssigned: true, currentTask: `Emergency: ${taskId}` }
            : worker
        )
      }));
      
      // Send notification to worker
      const message = `🚨 EMERGENCY ASSIGNMENT: ${taskId} at ${buildingName}. Immediate action required!`;
      await sendEmergencyMessage(message, [workerId]);
      
    } catch (error) {
      console.error('Failed to assign emergency worker:', error);
    }
  }, [buildingName]);

  const escalateToAdmin = useCallback(async (message: string) => {
    try {
      // Find admin workers
      const adminWorkers = state.assignedWorkers.filter(w => w.role === 'admin');
      
      if (adminWorkers.length > 0) {
        const adminMessage = `🚨 ESCALATION: ${message} - Building: ${buildingName}`;
        await sendEmergencyMessage(adminMessage, adminWorkers.map(w => w.id));
      }
      
    } catch (error) {
      console.error('Failed to escalate to admin:', error);
    }
  }, [buildingName, state.assignedWorkers]);

  // MARK: - Violation Management
  
  const startViolationRepair = useCallback(async (violationId: string) => {
    try {
      // Find the violation
      const violation = state.hpdViolations.find(v => v.violationid === violationId);
      if (!violation) return;
      
      // Create critical task
      const criticalTask: CriticalTask = {
        id: `task_${violationId}`,
        title: `Repair HPD Violation #${violationId}`,
        description: violation.description || 'HPD violation repair',
        priority: violation.violationclass === 'A' ? 'critical' : 'high',
        status: 'in_progress',
        assignedWorker: state.assignedWorkers[0]?.id || '',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        estimatedDuration: violation.violationclass === 'A' ? 4 : 2, // hours
        violationId,
        fineAmount: violation.penalty || 0,
        isEmergency: true
      };
      
      // Update state
      setState(prev => ({
        ...prev,
        assignedWorkers: prev.assignedWorkers.map(worker => 
          worker.id === criticalTask.assignedWorker
            ? { ...worker, currentTask: criticalTask.title, status: 'busy' }
            : worker
        )
      }));
      
      // Send notification
      const message = `🔧 Started repair for HPD Violation #${violationId} at ${buildingName}`;
      await sendEmergencyMessage(message, [criticalTask.assignedWorker]);
      
    } catch (error) {
      console.error('Failed to start violation repair:', error);
    }
  }, [buildingName, state.hpdViolations, state.assignedWorkers]);

  const markViolationComplete = useCallback(async (violationId: string, notes: string) => {
    try {
      // Update violation status
      setState(prev => ({
        ...prev,
        hpdViolations: prev.hpdViolations.map(v => 
          v.violationid === violationId 
            ? { ...v, currentstatus: 'CLOSED' as const }
            : v
        )
      }));
      
      // Send completion notification
      const message = `✅ Completed repair for HPD Violation #${violationId} at ${buildingName}. Notes: ${notes}`;
      await broadcastAlert(message);
      
    } catch (error) {
      console.error('Failed to mark violation complete:', error);
    }
  }, [buildingName]);

  const contactHPD = useCallback(async (violationId: string) => {
    try {
      // Find HPD emergency contact
      const hpdContact = state.emergencyContacts.find(c => c.agency === 'HPD');
      if (hpdContact) {
        // In a real app, this would open the phone dialer
        console.log(`Contacting HPD: ${hpdContact.phone} for violation ${violationId}`);
      }
      
    } catch (error) {
      console.error('Failed to contact HPD:', error);
    }
  }, [state.emergencyContacts]);

  // MARK: - Financial Management
  
  const payOutstandingFines = useCallback(async (amount: number) => {
    try {
      // Update outstanding fines
      setState(prev => ({
        ...prev,
        outstandingFines: Math.max(0, prev.outstandingFines - amount)
      }));
      
      // Send payment notification
      const message = `💰 Paid $${amount} in fines for ${buildingName}. Remaining: $${state.outstandingFines - amount}`;
      await broadcastAlert(message);
      
    } catch (error) {
      console.error('Failed to pay outstanding fines:', error);
    }
  }, [buildingName, state.outstandingFines]);

  const setupPaymentPlan = useCallback(async (amount: number, installments: number) => {
    try {
      // Calculate payment plan
      const monthlyPayment = amount / installments;
      
      // Send payment plan notification
      const message = `📋 Payment plan setup for ${buildingName}: $${monthlyPayment.toFixed(2)}/month for ${installments} months`;
      await broadcastAlert(message);
      
    } catch (error) {
      console.error('Failed to setup payment plan:', error);
    }
  }, [buildingName]);

  // MARK: - Communication
  
  const sendEmergencyMessage = useCallback(async (message: string, recipients: string[]) => {
    try {
      // In a real app, this would send push notifications
      console.log(`Emergency message to ${recipients.join(', ')}: ${message}`);
      
      // Update message history
      setState(prev => ({
        ...prev,
        // Add to message history
      }));
      
    } catch (error) {
      console.error('Failed to send emergency message:', error);
    }
  }, []);

  const broadcastAlert = useCallback(async (message: string) => {
    try {
      // Broadcast to all assigned workers
      const allWorkerIds = state.assignedWorkers.map(w => w.id);
      await sendEmergencyMessage(message, allWorkerIds);
      
    } catch (error) {
      console.error('Failed to broadcast alert:', error);
    }
  }, [state.assignedWorkers, sendEmergencyMessage]);

  // MARK: - Navigation
  
  const switchTab = useCallback((tab: CriticalBuildingState['selectedTab']) => {
    setState(prev => ({ ...prev, selectedTab: tab }));
  }, []);

  const refreshData = useCallback(async () => {
    await loadCriticalBuildingData();
  }, [loadCriticalBuildingData]);

  // MARK: - Effects
  
  useEffect(() => {
    loadCriticalBuildingData();
  }, [loadCriticalBuildingData]);

  // MARK: - Return Actions
  
  return {
    ...state,
    startEmergencyProtocol,
    assignEmergencyWorker,
    escalateToAdmin,
    startViolationRepair,
    markViolationComplete,
    contactHPD,
    payOutstandingFines,
    setupPaymentPlan,
    sendEmergencyMessage,
    broadcastAlert,
    switchTab,
    refreshData
  };
}

// MARK: - Helper Functions

function calculateCriticalComplianceScore(input: {
  hpdViolations: number;
  dsnyViolations: number;
  fdnyFailures: number;
  complaints311: number;
  outstandingFines: number;
}): { score: number; grade: string; status: 'critical' | 'high' | 'medium' | 'low' } {
  let score = 100;
  
  // HPD violations penalty (most severe)
  score -= input.hpdViolations * 15; // Higher penalty for critical buildings
  
  // DSNY violations penalty
  score -= input.dsnyViolations * 8;
  
  // FDNY failures penalty
  score -= input.fdnyFailures * 12;
  
  // 311 complaints penalty
  score -= input.complaints311 * 4;
  
  // Outstanding fines penalty
  if (input.outstandingFines > 0) {
    score -= Math.min(25, input.outstandingFines / 100); // Cap at 25 points
  }
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score);
  
  // Calculate grade and status
  let grade: string;
  let status: 'critical' | 'high' | 'medium' | 'low';
  
  if (score >= 90) {
    grade = 'A';
    status = 'low';
  } else if (score >= 80) {
    grade = 'B';
    status = 'medium';
  } else if (score >= 70) {
    grade = 'C';
    status = 'high';
  } else {
    grade = 'D';
    status = 'critical';
  }
  
  return { score: Math.round(score), grade, status };
}

async function loadCriticalWorkers(container: ServiceContainer, buildingId: string): Promise<CriticalWorker[]> {
  // Load workers assigned to this building
  const workers = await container.workers.getAllWorkers();
  
  return workers
    .filter(worker => worker.isActive)
    .map(worker => ({
      id: worker.id,
      name: worker.name,
      role: worker.role === 'admin' ? 'admin' as const : 'lead' as const,
      status: 'available' as const,
      currentTask: '',
      phone: worker.phone,
      isEmergencyAssigned: false,
      clockedInTime: new Date(),
      estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    }));
}

function loadEmergencyContacts(): EmergencyContact[] {
  return [
    {
      id: 'hpd_emergency',
      name: 'HPD Emergency',
      agency: 'HPD',
      phone: '(212) 825-5000',
      isEmergency: true,
      responseTime: '24 hours'
    },
    {
      id: 'dsny_emergency',
      name: 'DSNY Emergency',
      agency: 'DSNY',
      phone: '(212) 639-9675',
      isEmergency: true,
      responseTime: '48 hours'
    },
    {
      id: 'fdny_emergency',
      name: 'FDNY Emergency',
      agency: 'FDNY',
      phone: '911',
      isEmergency: true,
      responseTime: 'Immediate'
    },
    {
      id: 'nyc311',
      name: 'NYC 311',
      agency: 'NYC311',
      phone: '311',
      isEmergency: false,
      responseTime: '72 hours'
    }
  ];
}
