import { useState } from 'react';
import type { Module } from '../game';
import { Recipes } from '../game';
import type { MachineInventory } from '../game/World';
import { SlotDisplay } from './SlotDisplay';

interface ModuleDisplayProps {
  module: Module;
  machineInventory: MachineInventory;
  onUpdate: () => void;
  onRefreshInventory: () => void;
}

export function ModuleDisplay({
  module,
  machineInventory,
  onUpdate,
  onRefreshInventory,
}: ModuleDisplayProps) {
  const validation = module.validateLinks(Recipes);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(module.name);

  const handleToggleEnabled = () => {
    if (!module.enabled) {
      // Resuming - refresh inventory to apply changes
      onRefreshInventory();
    }
    module.enabled = !module.enabled;
    onUpdate();
  };

  const handleNameClick = () => {
    setIsEditing(true);
    setEditName(module.name);
  };

  const handleNameSubmit = () => {
    if (editName.trim()) {
      module.name = editName.trim();
      onUpdate();
    }
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(module.name);
    }
  };

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '8px',
        border: `2px solid ${validation.valid ? '#4CAF50' : '#FF9800'}`,
        minWidth: '350px',
        maxWidth: '450px',
        flex: '0 0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'space-between',
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            autoFocus
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '2px 4px',
              border: '1px solid #2196F3',
              borderRadius: '3px',
              flex: 1,
            }}
          />
        ) : (
          <h3
            style={{ margin: 0, cursor: 'pointer', flex: 1 }}
            onClick={handleNameClick}
            title="Click to rename"
          >
            {module.name}{' '}
            {validation.valid ? (
              <span style={{ color: '#4CAF50' }}>✓</span>
            ) : (
              <span style={{ color: '#FF9800' }}>⚠</span>
            )}
          </h3>
        )}
        <button
          onClick={handleToggleEnabled}
          style={{
            padding: '5px 15px',
            cursor: 'pointer',
          }}
        >
          {module.enabled ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      {!module.enabled && (
        <div style={{ color: '#FF9800', marginTop: '5px', fontSize: '11px' }}>
          ⚠ Module paused - adjust machine allocations below
        </div>
      )}

      <h4 style={{ marginTop: '15px' }}>⚙️ Slots</h4>
      <div>
        {module.machineSlots.map((slot, index) => (
          <SlotDisplay
            key={slot.slotId}
            slot={slot}
            index={index}
            module={module}
            moduleEnabled={module.enabled}
            machineInventory={machineInventory}
            onUpdate={onUpdate}
            onRefreshInventory={onRefreshInventory}
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
