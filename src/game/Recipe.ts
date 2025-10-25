/**
 * Recipe.ts
 * Defines recipes for machine processing.
 * Recipes specify input/output rates and processing time.
 */

export interface RecipeDefinition {
  id: string;
  name: string;
  inputRates: Record<string, number>; // resource -> units per second
  outputRates: Record<string, number>; // resource -> units per second
  processingTime?: number; // time in seconds (for future use)
}

/**
 * Static registry for recipe definitions.
 */
export class RecipeRegistry {
  private static recipes: Map<string, RecipeDefinition> = new Map();

  static register(def: RecipeDefinition): void {
    this.recipes.set(def.id, def);
  }

  static get(id: string): RecipeDefinition | undefined {
    return this.recipes.get(id);
  }

  static getAll(): RecipeDefinition[] {
    return Array.from(this.recipes.values());
  }

  static has(id: string): boolean {
    return this.recipes.has(id);
  }

  static clear(): void {
    this.recipes.clear();
  }
}
