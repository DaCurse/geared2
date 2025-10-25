/**
 * index.ts
 * Main entry point for the game simulation system.
 * Exports all public classes and interfaces.
 */

// Core classes
export { ResourceRegistry } from './Resource';
export type { ResourceDefinition } from './Resource';

export { RecipeRegistry } from './Recipe';
export type { RecipeDefinition } from './Recipe';

export { PipeRegistry } from './Pipe';
export type { PipeDefinition } from './Pipe';

export { Storage } from './Storage';
export type { StorageData } from './Storage';

export { Machine } from './Machine';
export type { MachineData, MachineDefinition } from './Machine';

export { Link } from './Link';
export type { LinkData, LinkEndpoint } from './Link';

export { Module } from './Module';
export type { ModuleData } from './Module';

export { World } from './World';
export type { WorldData } from './World';

export { Simulator } from './Simulator';

// Game definitions
export {
  initializeGameDefs,
  MachineDefs,
  Pipes,
  Recipes,
  Resources,
} from './GameDefs';
