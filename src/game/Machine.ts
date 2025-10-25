/**
 * Machine.ts
 * Processes resources at defined rates, consuming from input buffers
 * and producing to output buffers.
 * Machines can now use recipes to determine their input/output behavior.
 */

import type { RecipeDefinition } from './Recipe';

export interface MachineDefinition {
  id: string;
  name: string;
  bufferSize?: number; // default buffer capacity
  allowedRecipes?: string[]; // recipe IDs this machine can use (empty = any)
  defaultRecipe?: string; // default recipe ID to use
}

export interface MachineData {
  id: string;
  type: string;
  inputBuffer: Record<string, number>;
  outputBuffer: Record<string, number>;
  efficiency: number;
  active: boolean;
  recipeId?: string; // current recipe being used
}

export class Machine {
  id: string;
  type: string;
  definition: MachineDefinition;
  inputBuffer: Record<string, number>;
  outputBuffer: Record<string, number>;
  efficiency: number; // 0.0 to 1.0 multiplier
  active: boolean;
  bufferCapacity: number;
  currentRecipe: RecipeDefinition | null; // current active recipe

  constructor(
    id: string,
    def: MachineDefinition,
    recipe: RecipeDefinition | null = null,
    efficiency: number = 1.0
  ) {
    this.id = id;
    this.type = def.id;
    this.definition = def;
    this.inputBuffer = {};
    this.outputBuffer = {};
    this.efficiency = efficiency;
    this.active = true;
    this.bufferCapacity = def.bufferSize || 100;
    this.currentRecipe = recipe;
  }

  /**
   * Set the current recipe for this machine.
   */
  setRecipe(recipe: RecipeDefinition | null): void {
    this.currentRecipe = recipe;
  }

  /**
   * Get the current recipe's input rates.
   */
  private getInputRates(): Record<string, number> {
    return this.currentRecipe?.inputRates || {};
  }

  /**
   * Get the current recipe's output rates.
   */
  private getOutputRates(): Record<string, number> {
    return this.currentRecipe?.outputRates || {};
  }

  /**
   * Process one tick of production.
   * Consumes from input buffer, produces to output buffer.
   * @param dt - Delta time in seconds
   */
  tick(dt: number): void {
    if (!this.active || !this.currentRecipe) return;

    const inputRates = this.getInputRates();
    const outputRates = this.getOutputRates();

    // Check if we have enough inputs
    let canProduce = true;
    for (const [resource, rate] of Object.entries(inputRates)) {
      const required = rate * dt;
      const available = this.inputBuffer[resource] || 0;
      if (available < required) {
        canProduce = false;
        break;
      }
    }

    if (!canProduce) return;

    // Check if we have space for outputs
    for (const [resource, rate] of Object.entries(outputRates)) {
      const toOutput = rate * dt * this.efficiency;
      const current = this.outputBuffer[resource] || 0;
      if (current + toOutput > this.bufferCapacity) {
        canProduce = false;
        break;
      }
    }

    if (!canProduce) return;

    // Consume inputs
    for (const [resource, rate] of Object.entries(inputRates)) {
      const toConsume = rate * dt;
      this.inputBuffer[resource] =
        (this.inputBuffer[resource] || 0) - toConsume;
    }

    // Produce outputs
    for (const [resource, rate] of Object.entries(outputRates)) {
      const toProduce = rate * dt * this.efficiency;
      this.outputBuffer[resource] =
        (this.outputBuffer[resource] || 0) + toProduce;
    }
  }

  /**
   * Add resources to input buffer.
   */
  addInput(resource: string, amount: number): number {
    const current = this.inputBuffer[resource] || 0;
    const available = this.bufferCapacity - current;
    const toAdd = Math.min(amount, available);
    this.inputBuffer[resource] = current + toAdd;
    return toAdd;
  }

  /**
   * Remove resources from output buffer.
   */
  removeOutput(resource: string, amount: number): number {
    const current = this.outputBuffer[resource] || 0;
    const toRemove = Math.min(amount, current);
    this.outputBuffer[resource] = current - toRemove;
    if (this.outputBuffer[resource] <= 0) {
      delete this.outputBuffer[resource];
    }
    return toRemove;
  }

  /**
   * Get amount of resource in input buffer.
   */
  getInput(resource: string): number {
    return this.inputBuffer[resource] || 0;
  }

  /**
   * Get amount of resource in output buffer.
   */
  getOutput(resource: string): number {
    return this.outputBuffer[resource] || 0;
  }

  /**
   * Serialize to JSON-compatible object.
   */
  serialize(): MachineData {
    return {
      id: this.id,
      type: this.type,
      inputBuffer: { ...this.inputBuffer },
      outputBuffer: { ...this.outputBuffer },
      efficiency: this.efficiency,
      active: this.active,
      recipeId: this.currentRecipe?.id,
    };
  }

  /**
   * Deserialize from saved data.
   */
  static deserialize(
    data: MachineData,
    def: MachineDefinition,
    recipe: RecipeDefinition | null = null
  ): Machine {
    const machine = new Machine(data.id, def, recipe, data.efficiency);
    machine.inputBuffer = data.inputBuffer || {};
    machine.outputBuffer = data.outputBuffer || {};
    machine.active = data.active ?? true;
    return machine;
  }
}
