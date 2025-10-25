/**
 * Module.test.ts
 * Test file for module simulation logic
 */

import { Deposit } from './Deposit';
import { MachineDefs, Pipes, Recipes } from './GameDefs';
import { Link } from './Link';
import { Module } from './Module';
import { Storage } from './Storage';

console.log('=== Running Module Tests ===\n');

// Test 1: Simple iron production chain with deposits
console.log('Test 1: Iron production (miners -> furnaces -> storage)');

// Create deposits
const ironDeposit = new Deposit('iron_deposit', 'iron_ore', 1000, 1.0);
const coalDeposit = new Deposit('coal_deposit', 'coal', 500, 1.0);
const deposits = {
  iron_deposit: ironDeposit,
  coal_deposit: coalDeposit,
};

const module1 = new Module('test1', 'Iron Production');

// Add slots with deposit assignments
module1.addMachineSlot(
  'iron_miners',
  'miner',
  Recipes.mine_iron.id,
  5,
  'iron_deposit'
);
module1.addMachineSlot(
  'coal_miners',
  'miner',
  Recipes.mine_coal.id,
  2,
  'coal_deposit'
);
module1.addMachineSlot('furnaces', 'furnace', Recipes.smelt_iron.id, 3);

// Add links
const link1 = new Link(
  'link1',
  'iron_miners',
  'furnaces',
  'iron_ore',
  Pipes.basic_pipe
);
const link2 = new Link(
  'link2',
  'coal_miners',
  'furnaces',
  'coal',
  Pipes.basic_pipe
);
const link3 = new Link(
  'link3',
  'furnaces',
  'global_storage',
  'iron_ingot',
  Pipes.basic_pipe
);

module1.addLink(link1);
module1.addLink(link2);
module1.addLink(link3);

// Create global storage
const globalStorage = new Storage();

// Run simulation for 10 ticks
console.log('Running 10 ticks at 1 second each...\n');
for (let i = 0; i < 10; i++) {
  module1.tick(
    1.0,
    globalStorage,
    {
      machines: MachineDefs,
      recipes: Recipes,
    },
    deposits
  );
}

console.log('Results after 10 ticks:');
console.log('Global storage:', globalStorage.contents);
console.log(
  'Deposit remaining - Iron:',
  ironDeposit.remainingAmount.toFixed(0),
  '/',
  ironDeposit.totalAmount
);
console.log(
  'Deposit remaining - Coal:',
  coalDeposit.remainingAmount.toFixed(0),
  '/',
  coalDeposit.totalAmount
);
console.log('Expected: ~30 iron_ingot, deposits should be depleting');
console.log('\n');

// Test 2: Validation
console.log('Test 2: Validation (missing links)');
const module2 = new Module('test2', 'Invalid Module');
module2.addMachineSlot('miners', 'miner', Recipes.mine_iron.id, 1);
module2.addMachineSlot('furnaces', 'furnace', Recipes.smelt_iron.id, 1);
// No links added!

const validation = module2.validateLinks(Recipes);
console.log('Validation result:', validation);
console.log('Expected: valid=false, with issues about missing links');
console.log('\n');

console.log('=== Tests Complete ===');
