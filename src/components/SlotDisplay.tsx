import type { MachineSlot, Module } from '../game';
import { BufferDisplay } from './BufferDisplay';

interface SlotDisplayProps {
  slot: MachineSlot;
  index: number;
  module: Module;
  onUpdate: () => void;
}

export function SlotDisplay({
  slot,
  index,
  module,
  onUpdate,
}: SlotDisplayProps) {
  const buffers = module.getSlotBuffers(slot.slotId);

  return (
    <div
      style={{
        marginLeft: '10px',
        marginBottom: '12px',
        padding: '8px',
        borderRadius: '4px',
      }}
    >
      <div>
        <strong>
          #{index + 1} {slot.slotId}
        </strong>{' '}
        ({slot.machineType}){slot.recipe && ` - Recipe: ${slot.recipe}`}
      </div>

      <div style={{ marginTop: '5px' }}>
        <strong>Machine Count:</strong> {slot.machineCount} machines
        <button
          onClick={() => {
            if (slot.machineCount > 0) {
              module.setSlotMachineCount(slot.slotId, slot.machineCount - 1);
              onUpdate();
            }
          }}
          style={{ marginLeft: '10px', padding: '2px 8px' }}
          disabled={slot.machineCount === 0}
        >
          -
        </button>
        <button
          onClick={() => {
            module.setSlotMachineCount(slot.slotId, slot.machineCount + 1);
            onUpdate();
          }}
          style={{ marginLeft: '5px', padding: '2px 8px' }}
        >
          +
        </button>
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
