/**
 * @cyntientops/command-chains
 * 
 * Command chains for CyntientOps
 * Service orchestration and workflow management
 */

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
export default CommandChainManager;
