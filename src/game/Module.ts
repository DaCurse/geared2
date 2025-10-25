/**
 * Module.ts
 * Container for machines and links - represents a production template.
 * A module defines a complete production process (e.g., mine -> smelt -> store).
 * Each slot can be independently scaled (e.g., 5 miners feeding 3 furnaces).
 */

import type { LinkData, LinkEndpoint } from './Link';
import { Link } from './Link';
import type { MachineDefinition } from './Machine';
import { Machine } from './Machine';
import type { RecipeDefinition } from './Recipe';

export interface MachineSlot {
  slotId: string; // unique ID for this slot/step
  machineType: string; // type of machine (e.g., 'miner', 'furnace')
  recipe: string | null; // recipe ID this slot uses
  scale: number; // how many machines for this specific step
}

export interface MachineSlotData {
  slotId: string;
  machineType: string;
  recipe: string | null;
  scale: number;
}

export interface ModuleData {
  id: string;
  name: string;
  machineSlots: MachineSlotData[];
  links: LinkData[];
  enabled: boolean;
}

export class Module {
  id: string;
  name: string;
  machineSlots: MachineSlot[]; // Template slots (one per step)
  links: Link[];
  enabled: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.machineSlots = [];
    this.links = [];
    this.enabled = true;
  }

  /**
   * Add a machine slot to the template.
   */
  addMachineSlot(
    slotId: string,
    machineType: string,
    recipe: string | null,
    scale: number = 1
  ): void {
    this.machineSlots.push({ slotId, machineType, recipe, scale });
  }

  /**
   * Add a machine (convenience method).
   */
  addMachine(machine: Machine): void {
    const recipeId = machine.currentRecipe?.id || null;
    this.addMachineSlot(machine.id, machine.type, recipeId, 1);
  }

  /**
   * Add a link to this module.
   */
  addLink(link: Link): void {
    this.links.push(link);
  }

  /**
   * Generate all machine instances based on current slot scales.
   */
  private generateMachines(defs: {
    machines: Record<string, MachineDefinition>;
    recipes: Record<string, RecipeDefinition>;
  }): Machine[] {
    const machines: Machine[] = [];

    for (const slot of this.machineSlots) {
      const machineDef = defs.machines[slot.machineType];
      const recipe = slot.recipe ? defs.recipes[slot.recipe] : null;

      if (!machineDef) {
        console.warn(`Machine type ${slot.machineType} not found`);
        continue;
      }

      // Create 'scale' number of machines for this slot
      for (let i = 0; i < slot.scale; i++) {
        const machineId = `${slot.slotId}_${i}`;
        const machine = new Machine(machineId, machineDef, recipe);
        machines.push(machine);
      }
    }

    return machines;
  }

  /**
   * Get all machines (convenience property - regenerates on each call).
   */
  get machines(): Machine[] {
    // This is a placeholder - in real usage, machines should be cached
    // and regenerated only when slots change
    return [];
  }

  /**
   * Set the scale for a specific slot.
   */
  setSlotScale(slotId: string, scale: number): void {
    const slot = this.machineSlots.find(s => s.slotId === slotId);
    if (slot) {
      slot.scale = Math.max(0, scale);
    }
  }

  /**
   * Get the scale for a specific slot.
   */
  getSlotScale(slotId: string): number {
    const slot = this.machineSlots.find(s => s.slotId === slotId);
    return slot?.scale || 0;
  }

  /**
   * Validate that all machine inputs/outputs are properly linked.
   */
  validateLinks(): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Build set of all valid endpoint IDs
    const validEndpoints = new Set<string>();
    for (const slot of this.machineSlots) {
      // Each slot can have multiple machines (based on scale)
      for (let i = 0; i < slot.scale; i++) {
        validEndpoints.add(`${slot.slotId}_${i}`);
      }
    }
    validEndpoints.add('global_storage'); // Always valid

    // Check all links point to valid endpoints
    for (const link of this.links) {
      // Links can use slot IDs or machine IDs
      if (!validEndpoints.has(link.fromId) && !this.isSlotId(link.fromId)) {
        issues.push(`Link ${link.id}: Invalid source '${link.fromId}'`);
      }
      if (!validEndpoints.has(link.toId) && !this.isSlotId(link.toId)) {
        issues.push(`Link ${link.id}: Invalid target '${link.toId}'`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Check if an ID is a slot ID.
   */
  private isSlotId(id: string): boolean {
    return this.machineSlots.some(s => s.slotId === id);
  }

  /**
   * Check if the module is valid and can run.
   */
  isValid(): boolean {
    return this.validateLinks().valid;
  }

  /**
   * Process one tick of simulation.
   */
  tick(
    dt: number,
    globalStorage?: import('./Storage').Storage,
    defs?: {
      machines: Record<string, MachineDefinition>;
      recipes: Record<string, RecipeDefinition>;
    }
  ): void {
    // Don't run if module is disabled or invalid
    if (!this.enabled || !this.isValid()) {
      return;
    }

    if (!defs) {
      console.warn('Module tick called without machine/recipe definitions');
      return;
    }

    // Generate machines for this tick
    const machines = this.generateMachines(defs);

    // Build lookup map
    const worldObjects = new Map<string, LinkEndpoint>();

    // Add all machines
    for (const machine of machines) {
      worldObjects.set(machine.id, machine);
    }

    // Add global storage if provided
    if (globalStorage) {
      worldObjects.set('global_storage', globalStorage);
    }

    // Phase 1: Transfer resources via links
    for (const link of this.links) {
      link.transfer(worldObjects, dt);
    }

    // Phase 2: Process machines
    for (const machine of machines) {
      machine.tick(dt);
    }
  }

  /**
   * Serialize to JSON.
   */
  serialize(): ModuleData {
    return {
      id: this.id,
      name: this.name,
      machineSlots: this.machineSlots.map(slot => ({
        slotId: slot.slotId,
        machineType: slot.machineType,
        recipe: slot.recipe,
        scale: slot.scale,
      })),
      links: this.links.map(l => l.serialize()),
      enabled: this.enabled,
    };
  }

  /**
   * Deserialize from saved data.
   */
  static deserialize(
    data: ModuleData,
    defs: {
      machines: Record<string, MachineDefinition>;
      recipes: Record<string, RecipeDefinition>;
      pipes: Record<string, import('./Pipe').PipeDefinition>;
    }
  ): Module {
    const module = new Module(data.id, data.name);

    // Deserialize slots
    for (const slotData of data.machineSlots || []) {
      module.addMachineSlot(
        slotData.slotId,
        slotData.machineType,
        slotData.recipe,
        slotData.scale
      );
    }

    // Deserialize links
    for (const linkData of data.links || []) {
      const pipeDef = defs.pipes[linkData.pipeType];
      if (pipeDef) {
        const link = Link.deserialize(linkData, pipeDef);
        module.links.push(link);
      }
    }

    // Set enabled state
    module.enabled = data.enabled !== undefined ? data.enabled : true;

    return module;
  }
}
