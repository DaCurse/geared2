import { useEffect, useState } from 'react';
import type { MachineSlot, Module } from '../game';
import { getMachineEmoji } from '../game/EmojiMap';
import type { MachineInventory } from '../game/World';
import { BufferDisplay } from './BufferDisplay';

interface SlotDisplayProps {
  slot: MachineSlot;
  index: number;
  module: Module;
  moduleEnabled: boolean;
  machineInventory: MachineInventory;
  onUpdate: () => void;
  onRefreshInventory: () => void;
}

export function SlotDisplay({
  slot,
  index,
  module,
  moduleEnabled,
  machineInventory,
  onUpdate,
  onRefreshInventory,
}: SlotDisplayProps) {
  const buffers = module.getSlotBuffers(slot.slotId);
  const inv = machineInventory[slot.machineType];

  // Local state for slider - only update module on mouse up
  const [sliderValue, setSliderValue] = useState(slot.machineCount);

  // Sync slider value when slot count changes externally
  useEffect(() => {
    setSliderValue(slot.machineCount);
  }, [slot.machineCount]);

  // Max we can allocate = what's available + what this slot currently has
  const maxAvailable = inv
    ? inv.available + slot.machineCount
    : slot.machineCount;

  // Slider max is always the total in inventory
  const sliderMax = inv ? inv.total : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    // Clamp the value to not exceed what's actually available
    const clampedValue = Math.min(newValue, maxAvailable);
    setSliderValue(clampedValue);
  };

  const handleSliderCommit = () => {
    if (!moduleEnabled && sliderValue !== slot.machineCount) {
      // Double-check we're not exceeding available
      const finalValue = Math.min(sliderValue, maxAvailable);
      module.setSlotMachineCount(slot.slotId, finalValue);
      onRefreshInventory();
      onUpdate();
    }
  };

  return (
    <div
      style={{
        marginLeft: '4px',
        marginBottom: '6px',
        padding: '6px',
        borderRadius: '3px',
      }}
    >
      <div>
        <strong>
          #{index + 1} {slot.slotId}
        </strong>{' '}
        ({getMachineEmoji(slot.machineType)} {slot.machineType})
        {slot.recipe && ` - Recipe: ${slot.recipe}`}
        {slot.depositId && (
          <span style={{ fontSize: '11px', color: '#666' }}>
            {' '}
            → 📍 {slot.depositId}
          </span>
        )}
      </div>

      <div style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '11px', minWidth: '160px' }}>
            <strong>{getMachineEmoji(slot.machineType)} Machines:</strong>{' '}
            {sliderValue} / {sliderMax}{' '}
            <span
              style={{
                color: inv && inv.available > 0 ? '#4CAF50' : '#f44336',
              }}
              title={`Total in inventory: ${sliderMax}, Available to allocate: ${
                inv ? inv.available : 0
              }`}
            >
              ({inv ? inv.available : 0})
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={sliderMax}
            value={sliderValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            disabled={moduleEnabled}
            style={{
              flex: 1,
              cursor: moduleEnabled ? 'not-allowed' : 'pointer',
            }}
          />
        </div>
      </div>

      {buffers && (
        <BufferDisplay
          input={buffers.input}
          output={buffers.output}
          capacity={buffers.capacity}
        />
      )}
    </div>
  );
}
