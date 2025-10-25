/**
 * Module.ts - Clean Refactor
 *
 * A module contains slots that process resources.
 * - Each slot has a machine type, recipe, and machine count
 * - Slots have input/output buffers based on their recipe
 * - Links connect slot outputs to slot inputs (or global storage)
 * - All slot inputs/outputs must be connected (validation)
 */

import type { Deposit } from './Deposit';
import type { LinkData } from './Link';
import { Link } from './Link';
import type { MachineDefinition } from './Machine';
import type { RecipeDefinition } from './Recipe';
import { Storage } from './Storage';

export interface MachineSlot {
  slotId: string;
  machineType: string;
  recipe: string | null;
  machineCount: number;
  depositId?: string; // Optional: for miners to extract from specific deposits
}

export interface ModuleData {
  id: string;
  name: string;
  machineSlots: MachineSlot[];
  links: LinkData[];
  enabled: boolean;
}

interface SlotBuffer {
  input: Record<string, number>;
  output: Record<string, number>;
  capacity: number;
}

export class Module {
  id: string;
  name: string;
  machineSlots: MachineSlot[];
  links: Link[];
  enabled: boolean;
  private slotBuffers: Map<string, SlotBuffer>;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.machineSlots = [];
    this.links = [];
    this.enabled = true;
    this.slotBuffers = new Map();
  }

  addMachineSlot(
    slotId: string,
    machineType: string,
    recipe: string | null,
    machineCount: number = 1,
    depositId?: string
  ): void {
    this.machineSlots.push({
      slotId,
      machineType,
      recipe,
      machineCount,
      depositId,
    });
  }

  addLink(link: Link): void {
    this.links.push(link);
  }

  setSlotMachineCount(slotId: string, count: number): void {
    const slot = this.machineSlots.find(s => s.slotId === slotId);
    if (slot) {
      slot.machineCount = Math.max(0, count);
    }
  }

  setSlotDeposit(slotId: string, depositId: string | undefined): void {
    const slot = this.machineSlots.find(s => s.slotId === slotId);
    if (slot) {
      slot.depositId = depositId;
    }
  }

  getSlotMachineCount(slotId: string): number {
    const slot = this.machineSlots.find(s => s.slotId === slotId);
    return slot?.machineCount || 0;
  }

  getSlotBuffers(slotId: string): {
    input: Record<string, number>;
    output: Record<string, number>;
    capacity: number;
  } | null {
    const buffer = this.slotBuffers.get(slotId);
    if (!buffer) return null;
    return {
      input: { ...buffer.input },
      output: { ...buffer.output },
      capacity: buffer.capacity,
    };
  }

  private getSlotInputs(
    slot: MachineSlot,
    recipes: Record<string, RecipeDefinition>
  ): string[] {
    if (!slot.recipe) return [];
    const recipe = recipes[slot.recipe];
    if (!recipe) return [];
    return Object.keys(recipe.inputRates);
  }

  private getSlotOutputs(
    slot: MachineSlot,
    recipes: Record<string, RecipeDefinition>
  ): string[] {
    if (!slot.recipe) return [];
    const recipe = recipes[slot.recipe];
    if (!recipe) return [];
    return Object.keys(recipe.outputRates);
  }

  validateLinks(recipes?: Record<string, RecipeDefinition>): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!recipes) {
      warnings.push('No recipes provided for validation');
      return { valid: true, issues, warnings };
    }

    for (const slot of this.machineSlots) {
      const inputs = this.getSlotInputs(slot, recipes);
      const outputs = this.getSlotOutputs(slot, recipes);

      for (const resource of inputs) {
        const hasLink = this.links.some(
          l => l.toId === slot.slotId && l.resource === resource
        );
        if (!hasLink) {
          issues.push(
            `Slot ${slot.slotId}: Missing input link for ${resource}`
          );
        }
      }

      for (const resource of outputs) {
        const hasLink = this.links.some(
          l => l.fromId === slot.slotId && l.resource === resource
        );
        if (!hasLink) {
          issues.push(
            `Slot ${slot.slotId}: Missing output link for ${resource}`
          );
        }
      }
    }

    const validIds = new Set(this.machineSlots.map(s => s.slotId));
    validIds.add('global_storage');

    for (const link of this.links) {
      if (!validIds.has(link.fromId)) {
        issues.push(`Link ${link.id}: Invalid source '${link.fromId}'`);
      }
      if (!validIds.has(link.toId)) {
        issues.push(`Link ${link.id}: Invalid target '${link.toId}'`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  isValid(recipes?: Record<string, RecipeDefinition>): boolean {
    return this.validateLinks(recipes).valid;
  }

  private updateSlotBuffers(defs: {
    machines: Record<string, MachineDefinition>;
  }): void {
    const activeSlots = new Set<string>();

    for (const slot of this.machineSlots) {
      activeSlots.add(slot.slotId);

      const machineDef = defs.machines[slot.machineType];
      if (!machineDef || !machineDef.bufferSize) continue;

      const capacity = machineDef.bufferSize * slot.machineCount;

      if (!this.slotBuffers.has(slot.slotId)) {
        this.slotBuffers.set(slot.slotId, {
          input: {},
          output: {},
          capacity,
        });
      } else {
        this.slotBuffers.get(slot.slotId)!.capacity = capacity;
      }
    }

    for (const slotId of Array.from(this.slotBuffers.keys())) {
      if (!activeSlots.has(slotId)) {
        this.slotBuffers.delete(slotId);
      }
    }
  }

  tick(
    dt: number,
    globalStorage?: Storage,
    defs?: {
      machines: Record<string, MachineDefinition>;
      recipes: Record<string, RecipeDefinition>;
    },
    deposits?: Record<string, Deposit>
  ): void {
    if (!this.enabled) return;

    if (!defs) {
      console.warn('Module tick called without definitions');
      return;
    }

    if (!this.isValid(defs.recipes)) {
      console.warn(`Module ${this.id} has invalid links, skipping tick`);
      return;
    }

    this.updateSlotBuffers(defs);

    // Phase 1: Production
    for (const slot of this.machineSlots) {
      if (slot.machineCount === 0 || !slot.recipe) continue;

      const recipe = defs.recipes[slot.recipe];
      if (!recipe) continue;

      const buffer = this.slotBuffers.get(slot.slotId);
      if (!buffer) continue;

      const scaledInputRates: Record<string, number> = {};
      const scaledOutputRates: Record<string, number> = {};

      for (const [resource, rate] of Object.entries(recipe.inputRates)) {
        scaledInputRates[resource] = rate * slot.machineCount;
      }
      for (const [resource, rate] of Object.entries(recipe.outputRates)) {
        scaledOutputRates[resource] = rate * slot.machineCount;
      }

      // Apply deposit yield multiplier for mining operations (recipes with no inputs)
      let yieldMultiplier = 1.0;
      if (
        Object.keys(recipe.inputRates).length === 0 &&
        slot.depositId &&
        deposits
      ) {
        const deposit = deposits[slot.depositId];
        if (deposit && deposit.discovered && !deposit.isDepleted()) {
          yieldMultiplier = deposit.yieldRate;
        } else if (deposit && deposit.isDepleted()) {
          // Deposit depleted, can't produce
          continue;
        } else if (!deposit) {
          // No deposit assigned or invalid deposit
          continue;
        }
      } else if (
        Object.keys(recipe.inputRates).length === 0 &&
        !slot.depositId
      ) {
        // Mining recipe but no deposit assigned
        continue;
      }

      let canProduce = true;
      for (const [resource, rate] of Object.entries(scaledInputRates)) {
        const required = rate * dt;
        const available = buffer.input[resource] || 0;
        if (available < required) {
          canProduce = false;
          break;
        }
      }

      if (canProduce) {
        for (const [resource, rate] of Object.entries(scaledOutputRates)) {
          const toProduce = rate * dt * yieldMultiplier;
          const current = buffer.output[resource] || 0;
          if (current + toProduce > buffer.capacity) {
            canProduce = false;
            break;
          }
        }
      }

      if (!canProduce) continue;

      for (const [resource, rate] of Object.entries(scaledInputRates)) {
        const toConsume = rate * dt;
        buffer.input[resource] = (buffer.input[resource] || 0) - toConsume;
        if (buffer.input[resource] <= 0) {
          delete buffer.input[resource];
        }
      }

      for (const [resource, rate] of Object.entries(scaledOutputRates)) {
        const toProduce = rate * dt * yieldMultiplier;
        buffer.output[resource] = (buffer.output[resource] || 0) + toProduce;

        // Extract from deposit if this is a mining operation
        if (
          Object.keys(recipe.inputRates).length === 0 &&
          slot.depositId &&
          deposits
        ) {
          const deposit = deposits[slot.depositId];
          if (deposit) {
            deposit.extract(toProduce);
          }
        }
      }
    }

    // Phase 2: Transfer
    for (const link of this.links) {
      const maxTransfer = link.pipeDefinition.throughput * dt;

      let sourceAmount = 0;
      let sourceBuffer: SlotBuffer | Storage | null = null;

      if (link.fromId === 'global_storage' && globalStorage) {
        sourceAmount = globalStorage.get(link.resource);
        sourceBuffer = globalStorage;
      } else {
        const buffer = this.slotBuffers.get(link.fromId);
        if (buffer) {
          sourceAmount = buffer.output[link.resource] || 0;
          sourceBuffer = buffer;
        }
      }

      let targetSpace = Infinity;
      let targetBuffer: SlotBuffer | Storage | null = null;

      if (link.toId === 'global_storage' && globalStorage) {
        targetSpace = globalStorage.getFreeSpace(link.resource);
        targetBuffer = globalStorage;
      } else {
        const buffer = this.slotBuffers.get(link.toId);
        if (buffer) {
          const current = buffer.input[link.resource] || 0;
          targetSpace = buffer.capacity - current;
          targetBuffer = buffer;
        }
      }

      if (!sourceBuffer || !targetBuffer) continue;

      const toTransfer = Math.min(sourceAmount, targetSpace, maxTransfer);
      if (toTransfer <= 0) continue;

      if (sourceBuffer instanceof Storage) {
        sourceBuffer.remove(link.resource, toTransfer);
      } else {
        sourceBuffer.output[link.resource] =
          (sourceBuffer.output[link.resource] || 0) - toTransfer;
        if (sourceBuffer.output[link.resource] <= 0) {
          delete sourceBuffer.output[link.resource];
        }
      }

      if (targetBuffer instanceof Storage) {
        targetBuffer.add(link.resource, toTransfer);
      } else {
        targetBuffer.input[link.resource] =
          (targetBuffer.input[link.resource] || 0) + toTransfer;
      }
    }
  }

  serialize(): ModuleData {
    return {
      id: this.id,
      name: this.name,
      machineSlots: this.machineSlots.map(slot => ({
        slotId: slot.slotId,
        machineType: slot.machineType,
        recipe: slot.recipe,
        machineCount: slot.machineCount,
      })),
      links: this.links.map(l => l.serialize()),
      enabled: this.enabled,
    };
  }

  static deserialize(
    data: ModuleData,
    defs: {
      machines: Record<string, MachineDefinition>;
      recipes: Record<string, RecipeDefinition>;
      pipes: Record<string, import('./Pipe').PipeDefinition>;
    }
  ): Module {
    const module = new Module(data.id, data.name);

    for (const slotData of data.machineSlots || []) {
      module.addMachineSlot(
        slotData.slotId,
        slotData.machineType,
        slotData.recipe,
        slotData.machineCount
      );
    }

    for (const linkData of data.links || []) {
      const pipeDef = defs.pipes[linkData.pipeType];
      if (pipeDef) {
        const link = Link.deserialize(linkData, pipeDef);
        module.links.push(link);
      }
    }

    module.enabled = data.enabled !== undefined ? data.enabled : true;

    return module;
  }
}
