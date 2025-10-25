/**
 * Storage.ts
 * Manages resource quantities with per-resource capacity limits.
 */

export interface StorageData {
  contents: Record<string, number>;
  capacity: Record<string, number>;
}

export class Storage {
  contents: Record<string, number>;
  capacity: Record<string, number>;

  constructor(capacity: Record<string, number> = {}) {
    this.contents = {};
    this.capacity = capacity;
  }

  /**
   * Add resources to storage, respecting capacity limits.
   * @param resource - Resource ID
   * @param amount - Amount to add
   * @returns Amount actually stored
   */
  add(resource: string, amount: number): number {
    if (amount <= 0) return 0;

    const current = this.contents[resource] || 0;
    const capacity = this.capacity[resource] || Infinity;
    const available = capacity - current;
    const toAdd = Math.min(amount, available);

    this.contents[resource] = current + toAdd;
    return toAdd;
  }

  /**
   * Remove resources from storage.
   * @param resource - Resource ID
   * @param amount - Amount to remove
   * @returns Amount actually removed
   */
  remove(resource: string, amount: number): number {
    if (amount <= 0) return 0;

    const current = this.contents[resource] || 0;
    const toRemove = Math.min(amount, current);

    this.contents[resource] = current - toRemove;
    if (this.contents[resource] <= 0) {
      delete this.contents[resource];
    }

    return toRemove;
  }

  /**
   * Get current amount of a resource.
   */
  get(resource: string): number {
    return this.contents[resource] || 0;
  }

  /**
   * Get free space for a resource.
   */
  getFreeSpace(resource: string): number {
    const current = this.contents[resource] || 0;
    const capacity = this.capacity[resource] || Infinity;
    return capacity - current;
  }

  /**
   * Set capacity for a resource.
   */
  setCapacity(resource: string, capacity: number): void {
    this.capacity[resource] = capacity;
  }

  /**
   * Check if storage has at least the specified amount.
   */
  has(resource: string, amount: number): boolean {
    return this.get(resource) >= amount;
  }

  /**
   * Serialize to JSON-compatible object.
   */
  serialize(): StorageData {
    return {
      contents: { ...this.contents },
      capacity: { ...this.capacity },
    };
  }

  /**
   * Deserialize from saved data.
   */
  static deserialize(data: StorageData): Storage {
    const storage = new Storage(data.capacity || {});
    storage.contents = data.contents || {};
    return storage;
  }
}
