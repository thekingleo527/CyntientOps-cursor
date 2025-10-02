/**
 * @cyntientops/command-chains
 * 
 * Command chains for CyntientOps
 * Service orchestration and workflow management
 */

import { CommandChainManager } from './CommandChain';
export { CommandChainManager } from './CommandChain';

export type { 
  Command,
  CommandChain,
  CommandExecutor,
  CommandChainConfig
} from './CommandChain';

// Command chain manager initialization helper
export async function initializeCommandChainManager(
  databaseManager: any,
  clockInManager: any,
  locationManager: any,
  notificationManager: any,
  intelligenceService: any,
  serviceContainer: any
): Promise<CommandChainManager> {
  return CommandChainManager.getInstance(
    databaseManager,
    clockInManager,
    locationManager,
    notificationManager,
    intelligenceService,
    serviceContainer
  );
}

// Default export
// Default export with a local binding (helps Babel scope tracking)
export default CommandChainManager;
