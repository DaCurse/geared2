import { useEffect, useState } from 'react';
import './App.css';
import { DepositDisplay } from './components/DepositDisplay';
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

    // Create resource deposits
    const ironDeposit1 = new Deposit(
      'iron_deposit_1',
      Resources.iron_ore.id,
      50000,
      1.0
    );
    const coalDeposit1 = new Deposit(
      'coal_deposit_1',
      Resources.coal.id,
      30000,
      1.0
    );

    w.addDeposit(ironDeposit1);
    w.addDeposit(coalDeposit1);

    const module = new Module('demo', 'Iron Production Module');

    // Add machine slots (templates) with per-slot scaling
    // Step 1: Mine iron ore (2 miners - balanced for 2 furnaces)
    module.addMachineSlot(
      'iron_miners',
      'miner',
      Recipes.mine_iron.id,
      2,
      'iron_deposit_1'
    );

    // Step 2: Mine coal (1 miner - balanced for 2 furnaces)
    module.addMachineSlot(
      'coal_miners',
      'miner',
      Recipes.mine_coal.id,
      1,
      'coal_deposit_1'
    );

    // Step 3: Smelt iron (2 furnaces)
    module.addMachineSlot('furnaces', 'furnace', Recipes.smelt_iron.id, 2);

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

    module.addLink(link1);
    module.addLink(link2);
    module.addLink(link3);

    w.addModule(module);
    return w;
  });

  const [tick, setTick] = useState(0);
  const [globalResources, setGlobalResources] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const interval = setInterval(() => {
      world.tick();
      setTick(t => t + 1);
      // Only show global storage, not machine buffers
      setGlobalResources(world.globalStorage.contents);
    }, 1000);

    return () => clearInterval(interval);
  }, [world]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Game Simulation Demo</h1>
      <p>Tick: {tick}</p>

      <ResourceDisplay resources={globalResources} />

      <DepositDisplay deposits={world.deposits} />

      <h2>Modules</h2>
      {world.modules.map(module => (
        <ModuleDisplay
          key={module.id}
          module={module}
          onUpdate={() => setTick(t => t)}
        />
      ))}
    </div>
  );
}

export default App;
