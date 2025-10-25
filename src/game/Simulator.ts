/**
 * Simulator.ts
 * Convenience wrapper to run the game loop.
 * Used for local prototyping before hooking to UI.
 */

import { World } from './World';

export class Simulator {
  world: World;
  running: boolean;
  interval?: number;

  constructor(world: World) {
    this.world = world;
    this.running = false;
  }

  /**
   * Start the simulation loop.
   * @param intervalMs - Interval between ticks in milliseconds
   */
  start(intervalMs: number = 1000): void {
    if (this.running) {
      console.warn('Simulator already running');
      return;
    }

    this.running = true;
    this.interval = window.setInterval(() => {
      if (this.running) {
        this.world.tick();
      }
    }, intervalMs);

    console.log(`Simulator started with ${intervalMs}ms tick interval`);
  }

  /**
   * Stop the simulation loop.
   */
  stop(): void {
    if (!this.running) {
      console.warn('Simulator not running');
      return;
    }

    this.running = false;
    if (this.interval !== undefined) {
      window.clearInterval(this.interval);
      this.interval = undefined;
    }

    console.log('Simulator stopped');
  }

  /**
   * Run a single tick manually.
   */
  tick(): void {
    this.world.tick();
  }

  /**
   * Log current resource levels to console.
   */
  logStatus(): void {
    console.log('=== World Status ===');
    console.log(`Modules: ${this.world.modules.length}`);
    console.log(`Tick Rate: ${this.world.tickRate}s`);

    console.log('\n--- Global Storage ---');
    for (const [resource, amount] of Object.entries(
      this.world.globalStorage.contents
    )) {
      console.log(`  ${resource}: ${amount.toFixed(2)}`);
    }

    console.log('\n--- Modules ---');
    for (const module of this.world.modules) {
      console.log(`\nModule: ${module.name} (${module.id})`);

      console.log('  Machines:');
      for (const machine of module.machines) {
        console.log(
          `    ${machine.id} (${machine.type}) - Active: ${machine.active}`
        );

        const hasInput = Object.keys(machine.inputBuffer).length > 0;
        const hasOutput = Object.keys(machine.outputBuffer).length > 0;

        if (hasInput) {
          console.log('      Input:');
          for (const [resource, amount] of Object.entries(
            machine.inputBuffer
          )) {
            console.log(`        ${resource}: ${amount.toFixed(2)}`);
          }
        }

        if (hasOutput) {
          console.log('      Output:');
          for (const [resource, amount] of Object.entries(
            machine.outputBuffer
          )) {
            console.log(`        ${resource}: ${amount.toFixed(2)}`);
          }
        }
      }
    }

    console.log('\n--- Total Resources ---');
    const totals = this.world.getTotalResources();
    for (const [resource, amount] of Object.entries(totals)) {
      console.log(`  ${resource}: ${amount.toFixed(2)}`);
    }
    console.log('===================\n');
  }

  /**
   * Save current world state to JSON string.
   */
  save(): string {
    return JSON.stringify(this.world.serialize(), null, 2);
  }

  /**
   * Load world state from JSON string.
   */
  load(json: string): void {
    const data = JSON.parse(json);
    this.world = World.deserialize(data);
    console.log('World loaded from save data');
  }
}
