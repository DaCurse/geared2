import type { Deposit } from '../game';

interface DepositDisplayProps {
  deposits: Record<string, Deposit>;
}

export function DepositDisplay({ deposits }: DepositDisplayProps) {
  const depositList = Object.values(deposits);

  if (depositList.length === 0) {
    return (
      <div>
        <h2>Resource Deposits</h2>
        <p style={{ color: '#888' }}>No deposits discovered yet...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Resource Deposits</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {depositList.map(deposit => {
          const percentRemaining = deposit.getPercentageRemaining();
          const isDepleted = deposit.isDepleted();

          return (
            <div
              key={deposit.id}
              style={{
                border: `2px solid ${
                  isDepleted
                    ? '#f44336'
                    : percentRemaining < 25
                    ? '#FF9800'
                    : '#4CAF50'
                }`,
                padding: '10px',
                borderRadius: '4px',
                minWidth: '200px',
                opacity: isDepleted ? 0.5 : 1,
              }}
            >
              <div>
                <strong>{deposit.id}</strong>
                {isDepleted && (
                  <span style={{ color: '#f44336' }}> (DEPLETED)</span>
                )}
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                Resource: {deposit.resourceType}
              </div>
              <div style={{ fontSize: '12px' }}>
                Yield: {(deposit.yieldRate * 100).toFixed(0)}%
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {deposit.remainingAmount.toFixed(0)} /{' '}
                  {deposit.totalAmount.toFixed(0)}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    marginTop: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentRemaining}%`,
                      height: '100%',
                      backgroundColor: isDepleted
                        ? '#f44336'
                        : percentRemaining < 25
                        ? '#FF9800'
                        : '#4CAF50',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div
                  style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}
                >
                  {percentRemaining.toFixed(1)}% remaining
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
