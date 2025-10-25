interface ResourceDisplayProps {
  resources: Record<string, number>;
}

export function ResourceDisplay({ resources }: ResourceDisplayProps) {
  return (
    <div>
      <h2>Global Resources</h2>
      <div>
        {Object.keys(resources).length === 0 ? (
          <p>No resources yet...</p>
        ) : (
          Object.entries(resources).map(([resource, amount]) => (
            <div key={resource}>
              {resource}: {amount.toFixed(2)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
