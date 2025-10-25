/**
 * Pipe.ts
 * Defines pipe types that determine throughput rates for links.
 * Pipes are simple tiered rate limiters without buffers.
 */

export interface PipeDefinition {
  id: string;
  name: string;
  throughput: number; // units per second
  tier: number; // for upgrade progression (1, 2, 3, etc.)
}

/**
 * Static registry for pipe definitions.
 */
export class PipeRegistry {
  private static pipes: Map<string, PipeDefinition> = new Map();

  static register(def: PipeDefinition): void {
    this.pipes.set(def.id, def);
  }

  static get(id: string): PipeDefinition | undefined {
    return this.pipes.get(id);
  }

  static getAll(): PipeDefinition[] {
    return Array.from(this.pipes.values());
  }

  static has(id: string): boolean {
    return this.pipes.has(id);
  }

  static clear(): void {
    this.pipes.clear();
  }

  /**
   * Get all pipes of a specific tier.
   */
  static getByTier(tier: number): PipeDefinition[] {
    return Array.from(this.pipes.values()).filter(p => p.tier === tier);
  }

  /**
   * Get the next tier pipe upgrade for a given pipe.
   */
  static getUpgrade(pipeId: string): PipeDefinition | null {
    const current = this.pipes.get(pipeId);
    if (!current) return null;

    // Find pipes of the next tier with higher throughput
    const upgrades = Array.from(this.pipes.values())
      .filter(
        p => p.tier === current.tier + 1 && p.throughput > current.throughput
      )
      .sort((a, b) => a.throughput - b.throughput);

    return upgrades[0] || null;
  }
}
