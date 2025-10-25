interface BufferDisplayProps {
  input: Record<string, number>;
  output: Record<string, number>;
  capacity: number;
}

export function BufferDisplay({ input, output, capacity }: BufferDisplayProps) {
  const hasInput = Object.keys(input).length > 0;
  const hasOutput = Object.keys(output).length > 0;

  if (!hasInput && !hasOutput) {
    return (
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
        <div>
          <strong>Buffer Capacity:</strong> {capacity.toFixed(0)}
        </div>
        <div>Buffers empty</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '8px', fontSize: '11px' }}>
      <div>
        <strong>Buffer Capacity:</strong> {capacity.toFixed(0)}
      </div>
      {hasInput && (
        <div style={{ color: '#1976d2', marginTop: '4px' }}>
          <strong>Input Buffer:</strong>{' '}
          {Object.entries(input)
            .map(([res, amt]) => `${res}: ${amt.toFixed(2)}`)
            .join(', ')}
        </div>
      )}
      {hasOutput && (
        <div style={{ color: '#388e3c', marginTop: '4px' }}>
          <strong>Output Buffer:</strong>{' '}
          {Object.entries(output)
            .map(([res, amt]) => `${res}: ${amt.toFixed(2)}`)
            .join(', ')}
        </div>
      )}
    </div>
  );
}
