/**
 * Resource.ts
 * Defines resource types and provides a registry for lookup.
 */

export interface ResourceDefinition {
  id: string; // unique key e.g. "iron_ore"
  name: string; // display name
}

/**
 * Static registry for resource definitions.
 * Populated from GameDefs.ts
 */
export class ResourceRegistry {
  private static resources: Map<string, ResourceDefinition> = new Map();

  static register(def: ResourceDefinition): void {
    this.resources.set(def.id, def);
  }

  static get(id: string): ResourceDefinition | undefined {
    return this.resources.get(id);
  }

  static getAll(): ResourceDefinition[] {
    return Array.from(this.resources.values());
  }

  static has(id: string): boolean {
    return this.resources.has(id);
  }

  static clear(): void {
    this.resources.clear();
  }
}
