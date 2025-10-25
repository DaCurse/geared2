import { useEffect, useState } from 'react';
import './App.css';
import {
  Link,
  Machine,
  MachineDefs,
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
    const module = new Module('demo', 'Demo Module');

    // Add multiple machines to test scaling
    const ironMiner1 = new Machine(
      'iron_miner1',
      MachineDefs.miner,
      Recipes.mine_iron
    );
    const ironMiner2 = new Machine(
      'iron_miner2',
      MachineDefs.miner,
      Recipes.mine_iron
    );
    const coalMiner = new Machine(
      'coal_miner',
      MachineDefs.miner,
      Recipes.mine_coal
    );
    const furnace1 = new Machine(
      'furnace1',
      MachineDefs.furnace,
      Recipes.smelt_iron
    );
    const furnace2 = new Machine(
      'furnace2',
      MachineDefs.furnace,
      Recipes.smelt_iron
    );

    // Add machines to slots
    module.addMachineSlot('slot_iron1', ironMiner1, true);
    module.addMachineSlot('slot_iron2', ironMiner2, true);
    module.addMachineSlot('slot_coal', coalMiner, true);
    module.addMachineSlot('slot_furnace1', furnace1, true);
    module.addMachineSlot('slot_furnace2', furnace2, true);

    // Set initial scale to 3 (only first 3 machines enabled)
    module.setScale(3);

    // Link iron miners to furnaces
    const link1 = new Link(
      'link1',
      ironMiner1.id,
      furnace1.id,
      Resources.iron_ore.id,
      Pipes.basic_pipe
    );
    const link2 = new Link(
      'link2',
      ironMiner2.id,
      furnace2.id,
      Resources.iron_ore.id,
      Pipes.basic_pipe
    );

    // Link coal miner to both furnaces
    const link3 = new Link(
      'link3',
      coalMiner.id,
      furnace1.id,
      Resources.coal.id,
      Pipes.basic_pipe
    );
    const link4 = new Link(
      'link4',
      coalMiner.id,
      furnace2.id,
      Resources.coal.id,
      Pipes.basic_pipe
    );

    // Link furnace outputs to global storage
    const link5 = new Link(
      'link5',
      furnace1.id,
      'global_storage',
      Resources.iron_ingot.id,
      Pipes.basic_pipe
    );
    const link6 = new Link(
      'link6',
      furnace2.id,
      'global_storage',
      Resources.iron_ingot.id,
      Pipes.basic_pipe
    );

    module.addLink(link1);
    module.addLink(link2);
    module.addLink(link3);
    module.addLink(link4);
    module.addLink(link5);
    module.addLink(link6);

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

      <h2>Global Resources</h2>
      <div>
        {Object.keys(globalResources).length === 0 ? (
          <div style={{ color: '#888' }}>No global resources</div>
        ) : (
          Object.entries(globalResources).map(([resource, amount]) => (
            <div key={resource}>
              {resource}: {amount.toFixed(2)}
            </div>
          ))
        )}
      </div>

      <h2>Modules</h2>
      {world.modules.map(module => {
        const validation = module.validateLinks();
        return (
          <div
            key={module.id}
            style={{
              marginTop: '20px',
              padding: '10px',
              border: `2px solid ${validation.valid ? '#4CAF50' : '#FF9800'}`,
              opacity: module.enabled ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0 }}>
                {module.name}{' '}
                {validation.valid ? (
                  <span style={{ color: '#4CAF50' }}>✓ Valid</span>
                ) : (
                  <span style={{ color: '#FF9800' }}>⚠ Issues</span>
                )}
              </h3>
              <button
                onClick={() => {
                  module.enabled = !module.enabled;
                  setTick(t => t); // Force re-render
                }}
                style={{
                  padding: '5px 15px',
                  cursor: 'pointer',
                  backgroundColor: module.enabled ? '#f44336' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                {module.enabled ? '⏸ Pause' : '▶ Resume'}
              </button>
            </div>

            {!module.enabled && (
              <div
                style={{
                  color: '#666',
                  fontStyle: 'italic',
                  marginTop: '5px',
                }}
              >
                Module is paused
              </div>
            )}

            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <strong>Scale:</strong> {module.scale} / {module.getMaxScale()}{' '}
              <button
                onClick={() => {
                  if (module.scale > 0) {
                    module.setScale(module.scale - 1);
                    setTick(t => t); // Force re-render
                  }
                }}
                style={{ marginLeft: '10px', padding: '2px 8px' }}
              >
                -
              </button>
              <button
                onClick={() => {
                  if (module.scale < module.getMaxScale()) {
                    module.setScale(module.scale + 1);
                    setTick(t => t); // Force re-render
                  }
                }}
                style={{ marginLeft: '5px', padding: '2px 8px' }}
              >
                +
              </button>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {module.getEnabledMachines().length} machines currently running
              </div>
            </div>

            {validation.issues.length > 0 && (
              <div style={{ color: '#f44336', marginBottom: '10px' }}>
                <strong>Issues:</strong>
                <ul style={{ margin: '5px 0' }}>
                  {validation.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div style={{ color: '#FF9800', marginBottom: '10px' }}>
                <strong>Warnings:</strong>
                <ul style={{ margin: '5px 0' }}>
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <h4>Machines</h4>
            {module.machineSlots.map((slot, index) => (
              <div
                key={slot.slotId}
                style={{
                  marginLeft: '10px',
                  opacity: slot.enabled ? 1 : 0.5,
                  marginBottom: '8px',
                }}
              >
                <div>
                  <strong>#{index + 1}</strong>{' '}
                  {slot.enabled ? '✓' : '✗ (disabled)'}{' '}
                  <strong>{slot.machine.id}</strong> ({slot.machine.type}) -
                  Active: {slot.machine.active ? '✓' : '✗'}
                </div>
                {Object.keys(slot.machine.inputBuffer).length > 0 && (
                  <div style={{ marginLeft: '20px', fontSize: '12px' }}>
                    Input:{' '}
                    {Object.entries(slot.machine.inputBuffer)
                      .map(([r, a]) => `${r}: ${(a as number).toFixed(2)}`)
                      .join(', ')}
                  </div>
                )}
                {Object.keys(slot.machine.outputBuffer).length > 0 && (
                  <div style={{ marginLeft: '20px', fontSize: '12px' }}>
                    Output:{' '}
                    {Object.entries(slot.machine.outputBuffer)
                      .map(([r, a]) => `${r}: ${(a as number).toFixed(2)}`)
                      .join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default App;
