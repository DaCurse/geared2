import { getMachineEmoji } from '../game/EmojiMap';
import type { MachineInventory } from '../game/World';

interface MachineInventoryDisplayProps {
  inventory: MachineInventory;
}

export function MachineInventoryDisplay({
  inventory,
}: MachineInventoryDisplayProps) {
  const machineTypes = Object.keys(inventory);

  if (machineTypes.length === 0) {
    return <p style={{ color: '#888' }}>No machines in inventory</p>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {machineTypes.map(machineType => {
        const inv = inventory[machineType];
        const utilizationPercent =
          inv.total > 0 ? (inv.allocated / inv.total) * 100 : 0;

        return (
          <div
            key={machineType}
            style={{
              border: '2px solid #2196F3',
              padding: '10px',
              borderRadius: '4px',
              minWidth: '180px',
            }}
          >
            <div>
              <strong>
                {getMachineEmoji(machineType)} {machineType}
              </strong>
            </div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Total: {inv.total}
            </div>
            <div style={{ fontSize: '12px', color: '#FF9800' }}>
              Allocated: {inv.allocated}
            </div>
            <div style={{ fontSize: '12px', color: '#4CAF50' }}>
              Available: {inv.available}
            </div>
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${utilizationPercent}%`,
                    height: '100%',
                    backgroundColor:
                      utilizationPercent > 90 ? '#f44336' : '#2196F3',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div
                style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}
              >
                {utilizationPercent.toFixed(0)}% utilized
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
