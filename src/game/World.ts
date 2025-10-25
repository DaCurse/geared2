/**
 * World.ts
 * Top-level game state and tick manager.
 * Contains all modules, global storage, and machine inventory.
 */

import { MachineDefs, Pipes, Recipes } from './GameDefs';
import type { ModuleData } from './Module';
import { Module } from './Module';
import type { StorageData } from './Storage';
import { Storage } from './Storage';

export interface MachineInventory {
  [machineType: string]: {
    total: number; // total machines owned
    allocated: number; // machines currently allocated to modules
    available: number; // machines available for allocation
  };
}

export interface WorldData {
  modules: ModuleData[];
  globalStorage: StorageData;
  tickRate: number;
  machineInventory: Record<string, number>; // machineType -> total count
}

export class World {
  modules: Module[];
  globalStorage: Storage;
  tickRate: number; // seconds per tick
  machineInventory: MachineInventory; // track owned and allocated machines

  constructor(tickRate: number = 1.0) {
    this.modules = [];
    this.globalStorage = new Storage();
    this.tickRate = tickRate;
    this.machineInventory = {};
  }

  /**
   * Add machines to inventory.
   */
  addMachinesToInventory(machineType: string, count: number): void {
    if (!this.machineInventory[machineType]) {
      this.machineInventory[machineType] = {
        total: 0,
        allocated: 0,
        available: 0,
      };
    }
    this.machineInventory[machineType].total += count;
    this.updateMachineAvailability(machineType);
  }

  /**
   * Update available count based on total and allocated.
   */
  private updateMachineAvailability(machineType: string): void {
    const inv = this.machineInventory[machineType];
    if (inv) {
      inv.available = inv.total - inv.allocated;
    }
  }

  /**
   * Calculate how many machines of a type are currently allocated.
   */
  private calculateAllocated(machineType: string): number {
    let allocated = 0;
    for (const module of this.modules) {
      for (const slot of module.machineSlots) {
        if (slot.machine.type === machineType && slot.enabled) {
          allocated++;
        }
      }
    }
    return allocated;
  }

  /**
   * Refresh all machine inventory counts based on actual module allocations.
   */
  refreshMachineInventory(): void {
    // Reset all allocated counts
    for (const machineType in this.machineInventory) {
      this.machineInventory[machineType].allocated =
        this.calculateAllocated(machineType);
      this.updateMachineAvailability(machineType);
    }
  }

  /**
   * Get machine inventory for a specific type.
   */
  getMachineInventory(
    machineType: string
  ): MachineInventory[string] | undefined {
    return this.machineInventory[machineType];
  }

  /**
   * Add a module to the world.
   */
  addModule(module: Module): void {
    this.modules.push(module);
  }

  /**
   * Get a module by ID.
   */
  getModule(id: string): Module | undefined {
    return this.modules.find(m => m.id === id);
  }

  /**
   * Process one tick of simulation.
   * Ticks all modules with the current tick rate and provides global storage.
   */
  tick(): void {
    for (const module of this.modules) {
      module.tick(this.tickRate, this.globalStorage);
    }
  }

  /**
   * Get total resources across all machine buffers and global storage.
   */
  getTotalResources(): Record<string, number> {
    const totals: Record<string, number> = {};

    // Add global storage
    for (const [resource, amount] of Object.entries(
      this.globalStorage.contents
    )) {
      totals[resource] = (totals[resource] || 0) + amount;
    }

    // Add machine buffers (input + output)
    for (const module of this.modules) {
      for (const machine of module.machines) {
        for (const [resource, amount] of Object.entries(machine.inputBuffer)) {
          totals[resource] = (totals[resource] || 0) + amount;
        }
        for (const [resource, amount] of Object.entries(machine.outputBuffer)) {
          totals[resource] = (totals[resource] || 0) + amount;
        }
      }
    }

    return totals;
  }

  /**
   * Serialize to JSON-compatible object.
   */
  serialize(): WorldData {
    // Convert machineInventory to simple Record<string, number> for serialization
    const machineInventoryCounts: Record<string, number> = {};
    for (const machineType in this.machineInventory) {
      machineInventoryCounts[machineType] =
        this.machineInventory[machineType].total;
    }

    return {
      modules: this.modules.map(m => m.serialize()),
      globalStorage: this.globalStorage.serialize(),
      tickRate: this.tickRate,
      machineInventory: machineInventoryCounts,
    };
  }

  /**
   * Deserialize from saved data.
   */
  static deserialize(data: WorldData): World {
    const world = new World(data.tickRate || 1.0);

    // Deserialize global storage
    world.globalStorage = Storage.deserialize(data.globalStorage);

    // Deserialize machine inventory
    if (data.machineInventory) {
      for (const machineType in data.machineInventory) {
        world.addMachinesToInventory(
          machineType,
          data.machineInventory[machineType]
        );
      }
    }

    // Deserialize modules
    for (const moduleData of data.modules || []) {
      const module = Module.deserialize(moduleData, {
        machines: MachineDefs,
        recipes: Recipes,
        pipes: Pipes,
      });
      world.modules.push(module);
    }

    // Refresh inventory allocations after loading modules
    world.refreshMachineInventory();

    return world;
  }
}
