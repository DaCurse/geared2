import type { Module } from '../game';
import { Recipes } from '../game';
import { SlotDisplay } from './SlotDisplay';

interface ModuleDisplayProps {
  module: Module;
  onUpdate: () => void;
}

export function ModuleDisplay({ module, onUpdate }: ModuleDisplayProps) {
  const validation = module.validateLinks(Recipes);

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '10px',
        border: `2px solid ${validation.valid ? '#4CAF50' : '#FF9800'}`,
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
            onUpdate();
          }}
          style={{
            padding: '5px 15px',
            cursor: 'pointer',
          }}
        >
          {module.enabled ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      {!module.enabled && (
        <div style={{ color: '#999', marginTop: '5px' }}>Module is paused</div>
      )}

      <h4 style={{ marginTop: '15px' }}>Slots</h4>
      <div>
        {module.machineSlots.map((slot, index) => (
          <SlotDisplay
            key={slot.slotId}
            slot={slot}
            index={index}
            module={module}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      {validation.issues.length > 0 && (
        <div style={{ color: '#f44336', marginBottom: '10px' }}>
          <strong>Issues:</strong>
          <ul style={{ margin: '5px 0' }}>
            {validation.issues.map((issue: string, i: number) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div style={{ color: '#FF9800', marginBottom: '10px' }}>
          <strong>Warnings:</strong>
          <ul style={{ margin: '5px 0' }}>
            {validation.warnings.map((warning: string, i: number) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
