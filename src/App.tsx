import { useEffect, useState } from 'react';
import './App.css';
import { DepositDisplay } from './components/DepositDisplay';
import { MachineInventoryDisplay } from './components/MachineInventoryDisplay';
import { ModuleDisplay } from './components/ModuleDisplay';
import { ResourceDisplay } from './components/ResourceDisplay';
import {
  Deposit,
  Link,
  Module,
  Pipes,
  Recipes,
  Resources,
  World,
} from './game';

function App() {
  const [world] = useState(() => {
    // Create a simple demo world
    const w = new World(1.0);

    // Add machines to inventory
    w.addMachinesToInventory('miner', 10);
    w.addMachinesToInventory('furnace', 5);
    w.addMachinesToInventory('assembler', 3);

    // Create resource deposits
    const ironDeposit1 = new Deposit(
      'iron_deposit_1',
      Resources.iron_ore.id,
      5000,
      1.0
    );
    const coalDeposit1 = new Deposit(
      'coal_deposit_1',
      Resources.coal.id,
      3000,
      1.0
    );
    const copperDeposit1 = new Deposit(
      'copper_deposit_1',
      Resources.copper_ore.id,
      4000,
      1.0
    );

    w.addDeposit(ironDeposit1);
    w.addDeposit(coalDeposit1);
    w.addDeposit(copperDeposit1);

    // Module 1: Iron Production
    const module1 = new Module('iron_production', 'Iron Production');
    module1.enabled = false; // Start paused

    // Add machine slots with balanced allocations for 3 furnaces
    module1.addMachineSlot(
      'iron_miners',
      'miner',
      Recipes.mine_iron.id,
      3,
      'iron_deposit_1'
    );

    module1.addMachineSlot(
      'coal_miners',
      'miner',
      Recipes.mine_coal.id,
      3,
      'coal_deposit_1'
    );

    module1.addMachineSlot('furnaces', 'furnace', Recipes.smelt_iron.id, 3);

    // Link iron miners -> furnaces (iron ore)
    const link1 = new Link(
      'link1',
      'iron_miners',
      'furnaces',
      Resources.iron_ore.id,
      Pipes.basic_pipe
    );

    // Link coal miners -> furnaces (coal)
    const link2 = new Link(
      'link2',
      'coal_miners',
      'furnaces',
      Resources.coal.id,
      Pipes.basic_pipe
    );

    // Link furnaces -> global storage (iron ingots)
    const link3 = new Link(
      'link3',
      'furnaces',
      'global_storage',
      Resources.iron_ingot.id,
      Pipes.basic_pipe
    );

    module1.addLink(link1);
    module1.addLink(link2);
    module1.addLink(link3);

    // Module 2: Copper Production
    const module2 = new Module('copper_production', 'Copper Production');
    module2.enabled = false; // Start paused

    module2.addMachineSlot(
      'copper_miners',
      'miner',
      Recipes.mine_copper.id,
      2,
      'copper_deposit_1'
    );

    module2.addMachineSlot(
      'copper_furnaces',
      'furnace',
      Recipes.smelt_copper.id,
      2
    );

    const link4 = new Link(
      'link4',
      'copper_miners',
      'copper_furnaces',
      Resources.copper_ore.id,
      Pipes.basic_pipe
    );

    const link5 = new Link(
      'link5',
      'global_storage',
      'copper_furnaces',
      Resources.coal.id,
      Pipes.basic_pipe
    );

    const link6 = new Link(
      'link6',
      'copper_furnaces',
      'global_storage',
      Resources.copper_ingot.id,
      Pipes.basic_pipe
    );

    module2.addLink(link4);
    module2.addLink(link5);
    module2.addLink(link6);

    // Module 3: Coal Mining for Global Storage
    const module3 = new Module('coal_mining', 'Coal Mining');
    module3.enabled = false; // Start paused

    module3.addMachineSlot(
      'coal_miners_global',
      'miner',
      Recipes.mine_coal.id,
      2,
      'coal_deposit_1'
    );

    const link7 = new Link(
      'link7',
      'coal_miners_global',
      'global_storage',
      Resources.coal.id,
      Pipes.basic_pipe
    );

    module3.addLink(link7);

    w.addModule(module1);
    w.addModule(module2);
    w.addModule(module3);
    w.refreshMachineInventory();
    return w;
  });

  const [tick, setTick] = useState(0);
  const [globalResources, setGlobalResources] = useState<
    Record<string, number>
  >({});

  // Helper to get fresh inventory snapshot
  const getInventorySnapshot = () => {
    const snapshot: typeof world.machineInventory = {};
    for (const [machineType, inv] of Object.entries(world.machineInventory)) {
      snapshot[machineType] = { ...inv };
    }
    return snapshot;
  };

  const [machineInventory, setMachineInventory] = useState(() =>
    getInventorySnapshot()
  );

  const [globalPaused, setGlobalPaused] = useState(true); // Start globally paused

  // Manual tick function for debugging
  const runTicks = (count: number) => {
    for (let i = 0; i < count; i++) {
      world.tick();
    }
    setTick(t => t + count);
    setGlobalResources(world.globalStorage.contents);
  };

  useEffect(() => {
    if (globalPaused) return; // Don't run interval when globally paused

    const interval = setInterval(() => {
      world.tick();
      setTick(t => t + 1);
      // Only show global storage, not machine buffers
      setGlobalResources(world.globalStorage.contents);
    }, 1000);

    return () => clearInterval(interval);
  }, [world, globalPaused]);

  return (
    <div style={{ padding: '10px', fontFamily: 'monospace' }}>
      <h1 style={{ margin: '0 0 5px 0' }}>🎮 Geared Automation MVP</h1>
      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
        Sponsored by <strong>🐵 Monkey Business Ventures</strong>
      </p>
      <div
        style={{
          margin: '0 0 10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        <span>⏱️ Tick: {tick}</span>
        <button onClick={() => setGlobalPaused(!globalPaused)}>
          {globalPaused ? '▶️ Resume Simulation' : '⏸️ Pause Simulation'}
        </button>
        {globalPaused && (
          <>
            <button onClick={() => runTicks(1)}>+1 Tick</button>
            <button onClick={() => runTicks(10)}>+10 Ticks</button>
          </>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h2 style={{ marginBottom: '8px' }}>📦 Global Resources</h2>
        <ResourceDisplay resources={globalResources} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h2 style={{ marginBottom: '8px' }}>🏭 Machine Inventory</h2>
        <MachineInventoryDisplay inventory={machineInventory} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h2 style={{ marginBottom: '8px' }}>📍 Resource Deposits</h2>
        <DepositDisplay deposits={world.deposits} />
      </div>

      <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>📊 Modules</h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        <button
          onClick={() => {
            world.modules.forEach(m => {
              if (!m.enabled) {
                world.refreshMachineInventory();
              }
              m.enabled = true;
            });
            setMachineInventory(getInventorySnapshot());
            setTick(t => t + 1);
          }}
          style={{ padding: '5px 10px', cursor: 'pointer' }}
        >
          ▶ Resume All
        </button>
        <button
          onClick={() => {
            world.modules.forEach(m => {
              m.enabled = false;
            });
            setTick(t => t + 1);
          }}
          style={{ padding: '5px 10px', cursor: 'pointer' }}
        >
          ⏸ Pause All
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          paddingBottom: '10px',
        }}
      >
        {world.modules.map(module => (
          <ModuleDisplay
            key={module.id}
            module={module}
            machineInventory={machineInventory}
            onUpdate={() => {
              setTick(t => t);
              setMachineInventory(getInventorySnapshot());
            }}
            onRefreshInventory={() => {
              world.refreshMachineInventory();
              setMachineInventory(getInventorySnapshot());
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
