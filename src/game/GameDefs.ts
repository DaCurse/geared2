/**
 * GameDefs.ts
 * Central registry for machine, recipe, resource, and pipe definitions.
 */

import type { MachineDefinition } from './Machine';
import type { PipeDefinition } from './Pipe';
import { PipeRegistry } from './Pipe';
import type { RecipeDefinition } from './Recipe';
import { RecipeRegistry } from './Recipe';
import type { ResourceDefinition } from './Resource';
import { ResourceRegistry } from './Resource';

/**
 * Resource definitions
 */
export const Resources: Record<string, ResourceDefinition> = {
  iron_ore: { id: 'iron_ore', name: 'Iron Ore' },
  coal: { id: 'coal', name: 'Coal' },
  iron_ingot: { id: 'iron_ingot', name: 'Iron Ingot' },
  copper_ore: { id: 'copper_ore', name: 'Copper Ore' },
  copper_ingot: { id: 'copper_ingot', name: 'Copper Ingot' },
  steel_ingot: { id: 'steel_ingot', name: 'Steel Ingot' },
  circuit: { id: 'circuit', name: 'Circuit' },
};

/**
 * Recipe definitions
 */
export const Recipes: Record<string, RecipeDefinition> = {
  smelt_iron: {
    id: 'smelt_iron',
    name: 'Smelt Iron',
    inputRates: { iron_ore: 1, coal: 1 },
    outputRates: { iron_ingot: 1 },
  },
  smelt_copper: {
    id: 'smelt_copper',
    name: 'Smelt Copper',
    inputRates: { copper_ore: 1, coal: 1 },
    outputRates: { copper_ingot: 1 },
  },
  smelt_steel: {
    id: 'smelt_steel',
    name: 'Smelt Steel',
    inputRates: { iron_ingot: 2, coal: 1 },
    outputRates: { steel_ingot: 1 },
  },
  mine_iron: {
    id: 'mine_iron',
    name: 'Mine Iron',
    inputRates: {},
    outputRates: { iron_ore: 1 },
  },
  mine_coal: {
    id: 'mine_coal',
    name: 'Mine Coal',
    inputRates: {},
    outputRates: { coal: 1 },
  },
  mine_copper: {
    id: 'mine_copper',
    name: 'Mine Copper',
    inputRates: {},
    outputRates: { copper_ore: 1 },
  },
  assemble_circuit: {
    id: 'assemble_circuit',
    name: 'Assemble Circuit',
    inputRates: { copper_ingot: 2, iron_ingot: 1 },
    outputRates: { circuit: 1 },
  },
};

/**
 * Machine definitions
 */
export const MachineDefs: Record<string, MachineDefinition> = {
  miner: {
    id: 'miner',
    name: 'Miner',
    bufferSize: 50,
    allowedRecipes: ['mine_iron', 'mine_coal', 'mine_copper'],
    defaultRecipe: 'mine_iron',
  },
  furnace: {
    id: 'furnace',
    name: 'Furnace',
    bufferSize: 100,
    allowedRecipes: ['smelt_iron', 'smelt_copper', 'smelt_steel'],
    defaultRecipe: 'smelt_iron',
  },
  assembler: {
    id: 'assembler',
    name: 'Assembler',
    bufferSize: 100,
    allowedRecipes: ['assemble_circuit'],
    defaultRecipe: 'assemble_circuit',
  },
};

/**
 * Pipe definitions
 * Pipes control throughput rate limits for resource transport.
 */
export const Pipes: Record<string, PipeDefinition> = {
  basic_pipe: {
    id: 'basic_pipe',
    name: 'Basic Pipe',
    throughput: 5, // 5 units per second
    tier: 1,
  },
  improved_pipe: {
    id: 'improved_pipe',
    name: 'Improved Pipe',
    throughput: 15, // 15 units per second
    tier: 2,
  },
  advanced_pipe: {
    id: 'advanced_pipe',
    name: 'Advanced Pipe',
    throughput: 50, // 50 units per second
    tier: 3,
  },
  express_pipe: {
    id: 'express_pipe',
    name: 'Express Pipe',
    throughput: 150, // 150 units per second
    tier: 4,
  },
};

/**
 * Initialize resource, recipe, and pipe registries
 */
export function initializeGameDefs(): void {
  ResourceRegistry.clear();
  RecipeRegistry.clear();
  PipeRegistry.clear();

  for (const resource of Object.values(Resources)) {
    ResourceRegistry.register(resource);
  }

  for (const recipe of Object.values(Recipes)) {
    RecipeRegistry.register(recipe);
  }

  for (const pipe of Object.values(Pipes)) {
    PipeRegistry.register(pipe);
  }
}

// Auto-initialize when module is imported
initializeGameDefs();
initializeGameDefs();
