# Module Scaling System

## Overview

The module scaling system allows you to allocate machines to modules and control how many are actively running. This provides flexibility for managing production capacity and machine resources.

## Key Concepts

### Machine Slots

Each module contains **machine slots** instead of a simple array of machines. A slot has:

- `slotId`: Unique identifier for the slot
- `machine`: The machine instance in this slot
- `enabled`: Whether this slot is currently active

### Scale

The `scale` property determines how many machines in a module are actively running. This allows you to:

- Temporarily disable machines without removing them
- Scale production up/down based on demand
- Manage machine allocation efficiently

### Global Machine Inventory

The `World` tracks total owned machines vs allocated machines:

- `total`: How many machines you own
- `allocated`: How many are currently in use in modules
- `available`: How many are free to allocate (`total - allocated`)

## Usage

### Adding Machines to Inventory

```typescript
// Add 5 miners to your global inventory
world.addMachinesToInventory('miner', 5);

// Add 3 furnaces
world.addMachinesToInventory('furnace', 3);
```

### Creating Modules with Slots

```typescript
const module = new Module('mining', 'Mining Module');

// Create machine instances
const miner1 = new Machine('miner1', MachineDefs.miner, Recipes.mine_iron);
const miner2 = new Machine('miner2', MachineDefs.miner, Recipes.mine_coal);

// Add to slots (enabled by default)
module.addMachineSlot('slot1', miner1, true);
module.addMachineSlot('slot2', miner2, true);

// Or use the convenience method (creates slot with machine.id)
module.addMachine(miner1);
```

### Controlling Scale

```typescript
// Run 2 machines (enables first 2 slots, disables the rest)
module.setScale(2);

// Get current scale
const currentScale = module.scale;

// Get maximum possible scale
const maxScale = module.getMaxScale(); // Returns total number of slots
```

### Manually Controlling Slots

```typescript
// Enable/disable specific slots
module.setSlotEnabled('slot1', false); // Disable slot1
module.setSlotEnabled('slot2', true);  // Enable slot2

// Get only enabled machines
const activeMachines = module.getEnabledMachines();

// Get all machines (enabled + disabled)
const allMachines = module.machines;
```

### Checking Inventory

```typescript
// Get inventory for a machine type
const minerInventory = world.getMachineInventory('miner');
console.log(`Total miners: ${minerInventory.total}`);
console.log(`Allocated: ${minerInventory.allocated}`);
console.log(`Available: ${minerInventory.available}`);

// Refresh allocation counts (call after changing module slots)
world.refreshMachineInventory();
```

## How Tick Processing Works

Only **enabled** machines process during each tick:

```typescript
module.tick(dt); // Only runs machines where slot.enabled === true
```

The `scale` property automatically enables the first N slots and disables the rest when you call `setScale(N)`.

## Example

```typescript
// Create world and add machines to inventory
const world = new World(1.0);
world.addMachinesToInventory('miner', 10);

// Create module with 5 miner slots
const module = new Module('mining', 'Mining');
for (let i = 0; i < 5; i++) {
  const miner = new Machine(`miner${i}`, MachineDefs.miner, Recipes.mine_iron);
  module.addMachineSlot(`slot${i}`, miner, true);
}

// Start with only 2 active
module.setScale(2); // Only first 2 slots enabled

// Later, scale up to 4
module.setScale(4); // First 4 slots enabled

// Check inventory
const inv = world.getMachineInventory('miner');
console.log(`Using ${inv.allocated} of ${inv.total} miners`);
// Output: Using 4 of 10 miners
```

## Future Enhancements

- **Allocation validation**: Prevent allocating more machines than available
- **Auto-allocation UI**: Interface for distributing machines across modules
- **Machine construction**: Build new machines over time
- **Machine upgrades**: Improve efficiency of existing machines
- **Power/maintenance costs**: Costs for running machines at scale
