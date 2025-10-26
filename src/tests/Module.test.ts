/**
 * Module.test.ts
 * Test file for module simulation logic
 */

import { describe, expect, it } from 'vitest';
import { Deposit } from '../game/Deposit';
import { MachineDefs, Pipes, Recipes } from '../game/GameDefs';
import { Link } from '../game/Link';
import { Module } from '../game/Module';
import { Storage } from '../game/Storage';

describe('Module', () => {
  describe('Simple single-machine production', () => {
    it('should produce exactly 10 iron ore with 1 miner over 10 ticks', () => {
      const ironDeposit = new Deposit('iron_deposit', 'iron_ore', 1000, 1.0);
      const deposits = { iron_deposit: ironDeposit };

      const module = new Module('test', 'Test Module');
      module.addMachineSlot(
        'miners',
        'miner',
        Recipes.mine_iron.id,
        1,
        'iron_deposit'
      );
      module.addLink(
        new Link('l1', 'miners', 'global_storage', 'iron_ore', Pipes.basic_pipe)
      );

      const globalStorage = new Storage();

      // Run 10 ticks
      for (let i = 0; i < 10; i++) {
        module.tick(1.0, { machines: MachineDefs, recipes: Recipes }, deposits);
        module.runTransfers(1.0, globalStorage);
        module.runTransfers(1.0, globalStorage);
      }

      // 1 miner * 10 ticks = exactly 10 iron ore
      expect(globalStorage.get('iron_ore')).toBe(10);
      expect(ironDeposit.remainingAmount).toBe(990);
    });
  });

  describe('Balanced iron production chain', () => {
    it('should produce iron ingots without buffer bottlenecks', () => {
      const ironDeposit = new Deposit('iron_deposit', 'iron_ore', 1000, 1.0);
      const coalDeposit = new Deposit('coal_deposit', 'coal', 1000, 1.0);
      const deposits = {
        iron_deposit: ironDeposit,
        coal_deposit: coalDeposit,
      };

      const module = new Module('iron_production', 'Iron Production');

      // Balanced: 3 iron miners, 3 coal miners, 3 furnaces
      module.addMachineSlot(
        'iron_miners',
        'miner',
        Recipes.mine_iron.id,
        3,
        'iron_deposit'
      );
      module.addMachineSlot(
        'coal_miners',
        'miner',
        Recipes.mine_coal.id,
        3,
        'coal_deposit'
      );
      module.addMachineSlot('furnaces', 'furnace', Recipes.smelt_iron.id, 3);

      module.addLink(
        new Link('l1', 'iron_miners', 'furnaces', 'iron_ore', Pipes.basic_pipe)
      );
      module.addLink(
        new Link('l2', 'coal_miners', 'furnaces', 'coal', Pipes.basic_pipe)
      );
      module.addLink(
        new Link(
          'l3',
          'furnaces',
          'global_storage',
          'iron_ingot',
          Pipes.basic_pipe
        )
      );

      const globalStorage = new Storage();

      // Run 11 ticks to account for warm-up (first tick fills input buffers)
      for (let i = 0; i < 11; i++) {
        module.tick(1.0, { machines: MachineDefs, recipes: Recipes }, deposits);
        module.runTransfers(1.0, globalStorage);
        module.runTransfers(1.0, globalStorage);
      }

      // 3 furnaces * 10 effective ticks = exactly 30 iron ingots
      expect(globalStorage.get('iron_ingot')).toBe(30);
      expect(globalStorage.get('coal')).toBe(0);
      expect(globalStorage.get('iron_ore')).toBe(0);
      expect(ironDeposit.remainingAmount).toBe(967); // 11 ticks * 3 miners = 33 extracted
      expect(coalDeposit.remainingAmount).toBe(967);
    });
  });

  describe('Multi-module coordination', () => {
    it('should have zero coal accumulation in global storage', () => {
      const coalDeposit = new Deposit('coal_deposit', 'coal', 1000, 1.0);
      const copperDeposit = new Deposit(
        'copper_deposit',
        'copper_ore',
        1000,
        1.0
      );
      const deposits = {
        coal_deposit: coalDeposit,
        copper_deposit: copperDeposit,
      };

      // Coal mining module: 2 coal miners -> global storage
      const coalModule = new Module('coal_mining', 'Coal Mining');
      coalModule.addMachineSlot(
        'coal_miners',
        'miner',
        Recipes.mine_coal.id,
        2,
        'coal_deposit'
      );
      coalModule.addLink(
        new Link(
          'l1',
          'coal_miners',
          'global_storage',
          'coal',
          Pipes.basic_pipe
        )
      );

      // Copper smelting module: 2 copper miners, 2 furnaces (pulls coal from global)
      const copperModule = new Module('copper_production', 'Copper Production');
      copperModule.addMachineSlot(
        'copper_miners',
        'miner',
        Recipes.mine_copper.id,
        2,
        'copper_deposit'
      );
      copperModule.addMachineSlot(
        'copper_furnaces',
        'furnace',
        Recipes.smelt_copper.id,
        2
      );
      copperModule.addLink(
        new Link(
          'l1',
          'copper_miners',
          'copper_furnaces',
          'copper_ore',
          Pipes.basic_pipe
        )
      );
      copperModule.addLink(
        new Link(
          'l2',
          'global_storage',
          'copper_furnaces',
          'coal',
          Pipes.basic_pipe
        )
      );
      copperModule.addLink(
        new Link(
          'l3',
          'copper_furnaces',
          'global_storage',
          'copper_ingot',
          Pipes.basic_pipe
        )
      );

      const globalStorage = new Storage();

      // Run 11 ticks to account for warm-up
      for (let i = 0; i < 11; i++) {
        coalModule.tick(
          1.0,
          { machines: MachineDefs, recipes: Recipes },
          deposits
        );
        copperModule.tick(
          1.0,
          { machines: MachineDefs, recipes: Recipes },
          deposits
        );

        coalModule.runTransfers(1.0, globalStorage);
        copperModule.runTransfers(1.0, globalStorage);
        coalModule.runTransfers(1.0, globalStorage);
        copperModule.runTransfers(1.0, globalStorage);
      }

      // Critical: coal should not accumulate (2 produced = 2 consumed per tick)
      expect(globalStorage.get('coal')).toBe(0);
      // 2 copper furnaces * 10 effective ticks = exactly 20 copper ingots
      expect(globalStorage.get('copper_ingot')).toBe(20);
      expect(globalStorage.get('copper_ore')).toBe(0);
      expect(coalDeposit.remainingAmount).toBe(978); // 11 ticks * 2 miners = 22 extracted
      expect(copperDeposit.remainingAmount).toBe(978);
    });
  });

  describe('Link validation', () => {
    it('should detect missing links', () => {
      const module = new Module('invalid', 'Invalid Module');
      module.addMachineSlot('miners', 'miner', Recipes.mine_iron.id, 1);
      module.addMachineSlot('furnaces', 'furnace', Recipes.smelt_iron.id, 1);
      // No links added!

      const validation = module.validateLinks(Recipes);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(i => i.includes('iron_ore'))).toBe(true);
      expect(validation.issues.some(i => i.includes('coal'))).toBe(true);
    });
  });

  describe('Deposit depletion', () => {
    it('should not extract more than deposit contains', () => {
      const smallDeposit = new Deposit('small_deposit', 'iron_ore', 10, 1.0);
      const deposits = { small_deposit: smallDeposit };

      const module = new Module('miner', 'Miner Module');
      module.addMachineSlot(
        'miners',
        'miner',
        Recipes.mine_iron.id,
        5,
        'small_deposit'
      );
      module.addLink(
        new Link('l1', 'miners', 'global_storage', 'iron_ore', Pipes.basic_pipe)
      );

      const globalStorage = new Storage();

      // Run 3 ticks (5 miners * 3 ticks = 15, but only 10 available)
      for (let i = 0; i < 3; i++) {
        module.tick(1.0, { machines: MachineDefs, recipes: Recipes }, deposits);
        module.runTransfers(1.0, globalStorage);
        module.runTransfers(1.0, globalStorage);
      }

      expect(smallDeposit.isDepleted()).toBe(true);
      expect(globalStorage.get('iron_ore')).toBe(10);
      expect(smallDeposit.remainingAmount).toBe(0);
    });
  });
});
