/**
 * World.ts
 * Top-level game state and tick manager.
 * Contains all modules, global storage, and machine inventory.
 */

import type { DepositData } from './Deposit';
import { Deposit } from './Deposit';
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
  deposits: DepositData[];
  tickRate: number;
  machineInventory: Record<string, number>; // machineType -> total count
}

export class World {
  modules: Module[];
  globalStorage: Storage;
  deposits: Record<string, Deposit>;
  tickRate: number;
  machineInventory: MachineInventory;

  constructor(tickRate: number = 1.0) {
    this.modules = [];
    this.globalStorage = new Storage();
    this.deposits = {};
    this.tickRate = tickRate;
    this.machineInventory = {};
  }

  addDeposit(deposit: Deposit): void {
    this.deposits[deposit.id] = deposit;
  }

  getDepositsByResource(resourceType: string): Deposit[] {
    return Object.values(this.deposits).filter(
      d => d.resourceType === resourceType && d.discovered
    );
  }

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
        if (slot.machineType === machineType) {
          allocated += slot.machineCount;
        }
      }
    }
    return allocated;
  }

  refreshMachineInventory(): void {
    for (const machineType in this.machineInventory) {
      this.machineInventory[machineType].allocated =
        this.calculateAllocated(machineType);
      this.updateMachineAvailability(machineType);
    }
  }

  getMachineInventory(
    machineType: string
  ): MachineInventory[string] | undefined {
    return this.machineInventory[machineType];
  }

  addModule(module: Module): void {
    this.modules.push(module);
  }

  getModule(id: string): Module | undefined {
    return this.modules.find(m => m.id === id);
  }
  tick(): void {
    for (const module of this.modules) {
      module.tick(
        this.tickRate,
        {
          machines: MachineDefs,
          recipes: Recipes,
        },
        this.deposits
      );
    }

    for (const module of this.modules) {
      module.runTransfers(this.tickRate, this.globalStorage);
    }
    for (const module of this.modules) {
      module.runTransfers(this.tickRate, this.globalStorage);
    }
  }

  getTotalResources(): Record<string, number> {
    const totals: Record<string, number> = {};

    // Add global storage
    for (const [resource, amount] of Object.entries(
      this.globalStorage.contents
    )) {
      totals[resource] = (totals[resource] || 0) + (amount as number);
    }

    return totals;
  }

  /**
   * Serialize world state for saving.
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
      deposits: Object.values(this.deposits).map(d => d.serialize()),
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

    // Deserialize deposits
    if (data.deposits) {
      for (const depositData of data.deposits) {
        world.deposits[depositData.id] = Deposit.deserialize(depositData);
      }
    }

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
