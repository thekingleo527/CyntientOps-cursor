/**
 * @cyntientops/domain-schema
 *
 * Complete type system and validation schemas for CyntientOps
 * Ported from Swift CoreTypes with complete fidelity
 */

// Re-export all canonical IDs and utilities
export * from './canonical-ids';

// Re-export all core types and schemas
export * from './core-types';

// Version information
export const DOMAIN_SCHEMA_VERSION = '1.0.0';
export const SWIFT_COMPATIBILITY_VERSION = '6.0';
export const LAST_SYNC_DATE = '2024-09-28';

// Quick validation functions for common use cases
export {
  validateTaskAssignment,
  getDisplayName,
  validateWorkerId,
  validateBuildingId,
  getUrgencyLevel,
  isTaskOverdue,
  calculateDistance
} from './core-types';

export {
  CanonicalIDs,
  type WorkerId,
  type BuildingId,
  type TaskCategory as CanonicalTaskCategory,
  type SkillLevel,
  type RecurrenceType
} from './canonical-ids';