# Game Simulation System

A complete backend simulation system for a modular incremental/automation game. This system runs independently of any UI and exposes clear classes and interfaces for integration with a React frontend.

## Overview

This game simulation allows players to build modules containing machines, links, and storage. Machines consume and produce resources per tick, while links move resources between machines and storage units.

## Architecture

### Core Components

- **Resource**: Lightweight definitions for resource types
- **Storage**: Manages resource quantities with per-resource capacity limits
- **Machine**: Processes resources at defined rates using input/output buffers
- **Link**: Transfers resources between machines and storage
- **Module**: Container for machines, storage, and links
- **World**: Top-level game state containing all modules
- **Simulator**: Convenience wrapper for running the game loop

## File Structure

```
src/game/
├── Resource.ts      - Resource definitions and registry
├── Storage.ts       - Resource storage with capacity management
├── Machine.ts       - Production machines with buffers
├── Link.ts          - Resource transfer between entities
├── Module.ts        - Container for machines and links
├── World.ts         - Top-level game state
├── GameDefs.ts      - Resource and machine definitions
├── Simulator.ts     - Game loop wrapper
├── index.ts         - Main export file
└── example.ts       - Usage examples
```

## Quick Start

### Basic Usage

```typescript
import { World, Module, Machine, Link, MachineDefs, Resources } from './game';

// Create a world
const world = new World(1.0); // 1 second per tick

// Create a module
const module = new Module("production", "Production Module");

// Add machines
const miner = new Machine("miner_1", MachineDefs.iron_miner);
const furnace = new Machine("furnace_1", MachineDefs.furnace);

module.addMachine(miner);
module.addMachine(furnace);

// Set up storage
module.storage.setCapacity(Resources.iron_ore.id, 1000);
module.storage.setCapacity(Resources.iron_ingot.id, 1000);

// Create links
const link1 = new Link("link_1", miner.id, furnace.id, Resources.iron_ore.id, 5);
module.addLink(link1);

// Add module to world
world.addModule(module);

// Run simulation
world.tick();
```

### Using the Simulator

```typescript
import { Simulator, createExampleWorld } from './game';

const world = createExampleWorld();
const sim = new Simulator(world);

// Start auto-tick
sim.start(1000); // Tick every 1000ms

// Check status
sim.logStatus();

// Stop simulation
sim.stop();

// Save/Load
const saveData = sim.save();
sim.load(saveData);
```

## Core Concepts

### Tick Flow

Each tick follows this sequence:

1. **Links Transfer**: All links move resources from sources to targets
2. **Machines Process**: All machines consume inputs and produce outputs

### Machine Processing

Machines have:

- **Input Buffer**: Stores resources waiting to be processed
- **Output Buffer**: Stores produced resources waiting to be transferred
- **Efficiency**: 0.0 to 1.0 multiplier for production rates
- **Active State**: Machines only process when active

### Resource Flow

```
[Storage] --Link--> [Machine Input] --Process--> [Machine Output] --Link--> [Storage]
```

### Serialization

All game state is JSON-serializable for saving/loading:

```typescript
// Save
const data = world.serialize();
const json = JSON.stringify(data);

// Load
const parsedData = JSON.parse(json);
const loadedWorld = World.deserialize(parsedData);
```

## Available Resources

- Iron Ore
- Coal
- Iron Ingot
- Copper Ore
- Copper Ingot
- Steel Ingot
- Circuit

## Available Machines

### Miners

- **Iron Miner**: Produces iron ore (1/sec)
- **Coal Miner**: Produces coal (1/sec)
- **Copper Miner**: Produces copper ore (1/sec)

### Processing

- **Furnace**: Converts iron ore + coal → iron ingot
- **Copper Furnace**: Converts copper ore + coal → copper ingot
- **Steel Mill**: Converts iron ingots + coal → steel ingot
- **Circuit Assembler**: Converts copper + iron ingots → circuit

## API Reference

### World

```typescript
class World {
  modules: Module[];
  globalStorage: Storage;
  tickRate: number;

  constructor(tickRate?: number);
  addModule(module: Module): void;
  getModule(id: string): Module | undefined;
  tick(): void;
  getTotalResources(): Record<string, number>;
  serialize(): WorldData;
  static deserialize(data: WorldData): World;
}
```

### Module

```typescript
class Module {
  id: string;
  name: string;
  machines: Machine[];
  storage: Storage;
  links: Link[];

  constructor(id: string, name: string);
  addMachine(machine: Machine): void;
  addLink(link: Link): void;
  getMachine(id: string): Machine | undefined;
  tick(dt: number): void;
  serialize(): ModuleData;
  static deserialize(data: ModuleData, defs): Module;
}
```

### Machine

```typescript
class Machine {
  id: string;
  type: string;
  inputBuffer: Record<string, number>;
  outputBuffer: Record<string, number>;
  efficiency: number;
  active: boolean;

  constructor(id: string, def: MachineDefinition, efficiency?: number);
  tick(dt: number): void;
  addInput(resource: string, amount: number): number;
  removeOutput(resource: string, amount: number): number;
  serialize(): MachineData;
  static deserialize(data: MachineData, def: MachineDefinition): Machine;
}
```

### Storage

```typescript
class Storage {
  contents: Record<string, number>;
  capacity: Record<string, number>;

  constructor(capacity?: Record<string, number>);
  add(resource: string, amount: number): number;
  remove(resource: string, amount: number): number;
  get(resource: string): number;
  getFreeSpace(resource: string): number;
  setCapacity(resource: string, capacity: number): void;
  serialize(): StorageData;
  static deserialize(data: StorageData): Storage;
}
```

### Link

```typescript
class Link {
  id: string;
  fromId: string;
  toId: string;
  resource: string;
  rateLimit: number;

  constructor(id: string, fromId: string, toId: string, resource: string, rateLimit?: number);
  transfer(worldObjects: Map<string, LinkEndpoint>, dt: number): void;
  serialize(): LinkData;
  static deserialize(data: LinkData): Link;
}
```

## Design Principles

1. **Deterministic**: Same inputs always produce same outputs
2. **Serializable**: All state can be saved/loaded as JSON
3. **UI-Independent**: No DOM or rendering logic
4. **Type-Safe**: Full TypeScript type coverage
5. **Modular**: Clean separation of concerns

## Integration with React

The system is designed to integrate cleanly with React:

```typescript
// React Component Example
function GameComponent() {
  const [world, setWorld] = useState(() => new World());
  
  useEffect(() => {
    const interval = setInterval(() => {
      world.tick();
      setWorld(new World()); // Trigger re-render
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      {world.modules.map(module => (
        <ModuleView key={module.id} module={module} />
      ))}
    </div>
  );
}
```

## Examples

See `example.ts` for complete working examples including:

- Mining and smelting production chain
- Manual tick-by-tick simulation
- Auto-ticking simulation
- Save/load demonstration

## License

MIT
