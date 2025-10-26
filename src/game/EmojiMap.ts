// Emoji mappings for game entities
export const ResourceEmojis: Record<string, string> = {
  iron_ore: '🪨',
  coal: '⚫',
  iron_ingot: '⚙️',
  copper_ore: '🟤',
  copper_ingot: '🟠',
  steel_ingot: '🔩',
  circuit: '🔌',
};

export const MachineEmojis: Record<string, string> = {
  miner: '⛏️',
  furnace: '🔥',
  assembler: '🏭',
};

export function getResourceEmoji(resourceId: string): string {
  return ResourceEmojis[resourceId] || '📦';
}

export function getMachineEmoji(machineType: string): string {
  return MachineEmojis[machineType] || '🤖';
}
